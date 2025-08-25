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
  const parseStartTime = (s?: string): Date | null => {
    if (!s) return null
    // date-only 'YYYY-MM-DD'
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const [y, m, d] = s.split("-").map(Number)
      // use UTC midnight (unambiguous)
      return new Date(Date.UTC(y, m - 1, d))
    }
    // otherwise rely on Date parsing for full ISO strings
    const d = new Date(s)
    if (isNaN(d.getTime())) return null
    return d
  }

  const generateQRCode = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("[QR] generateQRCode() POST /api/gigs/%s/qr-code", gigId)

      const response = await fetch(`/api/gigs/${gigId}/qr-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId })
      })

      const data = await response.json()
      console.log("[QR] generate response:", data)

      if (data.success && data.qrCode) {
        setQrCode(data.qrCode)
      } else {
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
    const startDate = parseStartTime(startTime)
    if (!startDate) {
      // can't determine start => disallow generation
      console.warn("[QR] invalid startTime prop:", startTime)
      return false
    }

    const qrExpiresAt = new Date(startDate.getTime() + 10 * 60 * 1000) // 10 minutes after start
    // you used durationHours for endTime previously; keep for logic if needed
    // const endTime = new Date(startDate.getTime() + durationHours * 3600 * 1000)
    console.debug("[QR] now:", now.toISOString(), "start:", startDate.toISOString(), "qrExpiresAt:", qrExpiresAt.toISOString())
    return now >= startDate && now <= qrExpiresAt
  }
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
              {/* Render actual QR graphic here */}
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
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
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
            </div>

            {canGenerateQR ? (
              <Button onClick={generateQRCode} disabled={loading} className="w-full">
                {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <QrCode className="h-4 w-4 mr-2" />}
                {language === "ar" ? "إنشاء رمز QR" : "Generate QR Code"}
              </Button>
            ) : (
              <div className="text-sm text-gray-500">
                {language === "ar"
                  ? "يمكن إنشاء رمز QR فقط خلال نافذة الوقت المحددة (10 دقائق بعد بدء الحدث)"
                  : "QR code can only be generated during the time window (10 minutes after event starts)"}
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