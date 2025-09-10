"use client"

import { useState, useEffect } from "react"
import QRCode from "react-qr-code"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, QrCode, RefreshCw, CheckCircle, XCircle } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

interface QRCodeData {
  id: number
  token: string
  expiresAt: string
  isActive: boolean
  gigTitle: string
  gigStartTime: string
  durationHours: number
  validFrom?: string
  validUntil?: string
}

interface QRCodeDisplayProps {
  gigId: number
  brandId: number
  gigTitle: string
  startTime: string
  durationHours: number
}

export function QRCodeDisplay({ gigId, brandId, gigTitle, startTime, durationHours }: QRCodeDisplayProps) {
  const [qrCode, setQrCode] = useState<QRCodeData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState<string>("")
  const { language, isRTL } = useLanguage()

  // Track server-provided window for smarter scheduling
  const [serverWindowStart, setServerWindowStart] = useState<Date | null>(null)
  const [serverWindowEnd, setServerWindowEnd] = useState<Date | null>(null)
  const [nextAttemptAt, setNextAttemptAt] = useState<Date | null>(null)
  const [autoTimerId, setAutoTimerId] = useState<ReturnType<typeof setTimeout> | null>(null)

  const parseStartTime = (s?: string): Date | null => {
    if (!s) return null
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const [y, m, d] = s.split("-").map(Number)
      return new Date(Date.UTC(y, m - 1, d))
    }
    const d = new Date(s)
    if (isNaN(d.getTime())) return null
    return d
  }

  const formatCairoTime = (d: Date | null) => {
    if (!d) return "?"
    return new Intl.DateTimeFormat(language === "ar" ? "ar-EG" : "en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
      timeZone: "Africa/Cairo",
    }).format(d)
  }

  const formatLocalTime = (d: Date | null) => {
    if (!d) return "?"
    return new Intl.DateTimeFormat(language === "ar" ? "ar-EG" : "en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(d)
  }

  const generateQRCode = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/gigs/${gigId}/qr-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId })
      })

      const data = await response.json()
      if (data.success && data.qrCode) {
        setQrCode(data.qrCode)
        setServerWindowStart(data.qrCode.validFrom ? new Date(data.qrCode.validFrom) : null)
        setServerWindowEnd(data.qrCode.validUntil ? new Date(data.qrCode.validUntil) : null)
        setNextAttemptAt(null)
      } else {
        // Capture server-side timing hints for scheduling
        if (data.reason === "outside_time_window") {
          const ws = data.windowStart ? new Date(data.windowStart) : null
          const we = data.windowEnd ? new Date(data.windowEnd) : null
          setServerWindowStart(ws)
          setServerWindowEnd(we)
          // If we are before windowStart, schedule a single retry at windowStart
          const now = new Date()
          if (ws && now < ws) {
            setNextAttemptAt(ws)
          } else if (we && now > we) {
            // Window passed; no auto retry
            setNextAttemptAt(null)
          }
        }
        setError(data.error || "Failed to generate QR")
      }
    } catch (err) {
      console.error("Failed to generate QR code:", err)
      setError("Failed to generate QR code")
    } finally {
      setLoading(false)
    }
  }

  const fetchActiveQRCode = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/gigs/${gigId}/qr-code?brandId=${brandId}`)
      const data = await response.json()

      if (data.success) {
        setQrCode(data.qrCode)
        // If server returns start/end in GET in future, capture them here as well
      } else {
        setQrCode(null)
      }
    } catch (error) {
      console.error("Failed to fetch QR code:", error)
      setError("Failed to fetch QR code")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActiveQRCode()
  }, [gigId, brandId])

  useEffect(() => {
    if (!qrCode) {
      setTimeLeft("")
      return
    }
    const updateTimeLeft = () => {
      const now = new Date().getTime()
      const expiresAt = new Date(qrCode.expiresAt).getTime()
      const timeLeftMs = expiresAt - now

      if (timeLeftMs <= 0) {
        setTimeLeft("Expired")
        setQrCode(null)
        return
      }

      const minutes = Math.floor(timeLeftMs / (1000 * 60))
      const seconds = Math.floor((timeLeftMs % (1000 * 60)) / 1000)
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`)
    }

    updateTimeLeft()
    const interval = setInterval(updateTimeLeft, 1000)

    return () => clearInterval(interval)
  }, [qrCode])

  const isWithinTimeWindow = () => {
    const now = new Date()
    // Prefer server-provided window when available
    if (serverWindowStart && serverWindowEnd) {
      return now >= serverWindowStart && now <= serverWindowEnd
    }
    const startDate = parseStartTime(startTime)
    if (!startDate) {
      return true
    }
    const qrExpiresAt = new Date(startDate.getTime() + 10 * 60 * 1000)
    return now >= startDate && now <= qrExpiresAt
  }

  // One-shot scheduler: set a timeout for nextAttemptAt (from server response)
  useEffect(() => {
    if (autoTimerId) {
      clearTimeout(autoTimerId)
      setAutoTimerId(null)
    }
    if (!qrCode && nextAttemptAt) {
      const now = Date.now()
      const delay = Math.max(0, nextAttemptAt.getTime() - now)
      const id = setTimeout(() => {
        generateQRCode()
      }, delay)
      setAutoTimerId(id)
    }
    return () => {
      if (autoTimerId) clearTimeout(autoTimerId)
    }
  }, [qrCode, nextAttemptAt])

  // Try once immediately if within window and no code
  useEffect(() => {
    if (!qrCode && isWithinTimeWindow()) {
      generateQRCode()
    }
  }, [gigId, brandId, startTime, serverWindowStart, serverWindowEnd])

  const canGenerateQR = isWithinTimeWindow() && !qrCode

    // Build user-facing QR payload: prefer a URL that opens check-in route in browser
  const buildPayloadUrl = () => {
    if (!qrCode) return ""
    if (typeof window === "undefined") return JSON.stringify({ id: qrCode.id, token: qrCode.token })
    // change /checkin to whatever endpoint you handle on frontend/server
    const origin = window.location.origin
    return `${origin}/checkin?gigId=${encodeURIComponent(gigId)}&token=${encodeURIComponent(qrCode.token)}`
  }

  const payloadUrl = buildPayloadUrl()

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          {language === "ar" ? "رمز QR للحدث" : "Event QR Code"}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {qrCode ? (
          <div className="text-center space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg flex flex-col items-center">
              {payloadUrl ? (
                <div style={{ background: "white", padding: 8, borderRadius: 8 }}>
                  <QRCode value={payloadUrl} size={160} />
                </div>
              ) : (
                <div className="text-6xl font-mono text-gray-800 mb-2">📱</div>
              )}

              <p className="text-sm text-gray-600 mt-2">
                {language === "ar" ? "امسح هذا الرمز" : "Scan this code"}
              </p>
            </div>

            <div className="space-y-2">
              <Badge variant={qrCode.isActive ? "default" : "secondary"}>
                {qrCode.isActive ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                {qrCode.isActive ? (language === "ar" ? "نشط" : "Active") : (language === "ar" ? "غير نشط" : "Inactive")}
              </Badge>

              <div className="text-sm text-gray-600">
                <div className="flex items-center justify-center gap-1">
                  <Clock className="h-3 w-3" />
                  {language === "ar" ? "ينتهي في:" : "Expires in:"} {timeLeft}
                </div>
              </div>
            </div>

            <Button onClick={fetchActiveQRCode} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`${loading ? "animate-spin" : ""} h-4 w-4 mr-2`} />
              {language === "ar" ? "تحديث" : "Refresh"}
            </Button>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <QrCode className="h-16 w-16 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">
                {language === "ar" ? "لا يوجد رمز QR نشط" : "No active QR code"}
              </p>
              {error && (
                <p className="text-xs text-red-600 mt-2">{error}</p>
              )}
              {(serverWindowStart || serverWindowEnd) && (
                <p className="text-xs text-gray-500 mt-1">
                  {language === "ar"
                    ? `نافذة الخادم (القاهرة): ${formatCairoTime(serverWindowStart)} → ${formatCairoTime(serverWindowEnd)} (المحلي: ${formatLocalTime(serverWindowStart)} → ${formatLocalTime(serverWindowEnd)})`
                    : `Server window (Cairo): ${formatCairoTime(serverWindowStart)} → ${formatCairoTime(serverWindowEnd)} (local: ${formatLocalTime(serverWindowStart)} → ${formatLocalTime(serverWindowEnd)})`}
                </p>
              )}
              {nextAttemptAt && (
                <p className="text-xs text-gray-500 mt-1">
                  {language === "ar"
                    ? `سيتم المحاولة تلقائيًا عند ${formatLocalTime(nextAttemptAt)}`
                    : `Will auto-try at ${formatLocalTime(nextAttemptAt)}`}
                </p>
              )}
            </div>

            <Button onClick={generateQRCode} disabled={loading || !!qrCode} className="w-full">
              {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <QrCode className="h-4 w-4 mr-2" />}
              {language === "ar" ? "إنشاء رمز QR" : "Generate QR Code"}
            </Button>

            {!canGenerateQR && (
              <div className="text-sm text-gray-500">
                {language === "ar"
                  ? "يتم إنشاء رمز QR تلقائيًا خلال نافذة الوقت المسموح بها. يمكنك أيضًا المحاولة يدويًا."
                  : "QR auto-generates during the allowed window. You can also try manually."}
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-gray-500 text-center">
          {language === "ar" ? "يظهر رمز QR لمدة 10 دقائق بعد بدء الحدث" : "QR code appears for 10 minutes after event starts"}
        </div>
      </CardContent>
    </Card>
  )
}