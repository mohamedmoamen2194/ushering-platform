"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { QrCode, Camera, CheckCircle, XCircle, Clock, User } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"

interface QRScanResult {
  success: boolean
  message: string
  gigTitle?: string
  action?: string
  shiftId?: number
  timestamp?: string
}

export function QRScanner() {
  const [scanning, setScanning] = useState(false)
  const [qrCodeInput, setQrCodeInput] = useState("")
  const [scanResult, setScanResult] = useState<QRScanResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [action, setAction] = useState<'check_in' | 'check_out'>('check_in')
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const { language, isRTL } = useLanguage()
  const { user } = useAuth()

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setScanning(true)
      }
    } catch (error) {
      console.error("Failed to start camera:", error)
      alert(language === "ar" ? "فشل في تشغيل الكاميرا" : "Failed to start camera")
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setScanning(false)
  }

  const handleScan = async (qrCodeToken: string) => {
    if (!user?.id) {
      setScanResult({
        success: false,
        message: language === "ar" ? "يجب تسجيل الدخول أولاً" : "Must be logged in first"
      })
      return
    }

    try {
      setLoading(true)
      setScanResult(null)

      const response = await fetch("/api/qr-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          qrCodeToken, 
          usherId: user.id, 
          action 
        })
      })

      const data = await response.json()

      if (data.success) {
        setScanResult({
          success: true,
          message: data.message,
          gigTitle: data.gigTitle,
          action: data.action,
          shiftId: data.shiftId,
          timestamp: data.timestamp
        })
        
        // Clear input after successful scan
        setQrCodeInput("")
      } else {
        setScanResult({
          success: false,
          message: data.error
        })
      }
    } catch (error) {
      console.error("Scan failed:", error)
      setScanResult({
        success: false,
        message: language === "ar" ? "فشل في معالجة المسح" : "Failed to process scan"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (qrCodeInput.trim()) {
      handleScan(qrCodeInput.trim())
    }
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          {language === "ar" ? "ماسح رمز QR" : "QR Code Scanner"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Action Selection */}
        <div className="flex gap-2">
          <Button
            variant={action === 'check_in' ? 'default' : 'outline'}
            onClick={() => setAction('check_in')}
            className="flex-1"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {language === "ar" ? "تسجيل دخول" : "Check In"}
          </Button>
          <Button
            variant={action === 'check_out' ? 'default' : 'outline'}
            onClick={() => setAction('check_out')}
            className="flex-1"
          >
            <Clock className="h-4 w-4 mr-2" />
            {language === "ar" ? "تسجيل خروج" : "Check Out"}
          </Button>
        </div>

        {/* Camera View */}
        {scanning && (
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-64 bg-black rounded-lg"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="border-2 border-white rounded-lg p-2">
                <QrCode className="h-8 w-8 text-white" />
              </div>
            </div>
            <Button
              onClick={stopCamera}
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Camera Controls */}
        {!scanning && (
          <Button
            onClick={startCamera}
            className="w-full"
            variant="outline"
          >
            <Camera className="h-4 w-4 mr-2" />
            {language === "ar" ? "تشغيل الكاميرا" : "Start Camera"}
          </Button>
        )}

        {/* Manual Input */}
        <div className="space-y-2">
          <p className="text-sm text-gray-600 text-center">
            {language === "ar" 
              ? "أو أدخل رمز QR يدوياً" 
              : "Or enter QR code manually"
            }
          </p>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <Input
              value={qrCodeInput}
              onChange={(e) => setQrCodeInput(e.target.value)}
              placeholder={language === "ar" ? "رمز QR..." : "QR code..."}
              className="flex-1"
            />
            <Button 
              type="submit" 
              disabled={loading || !qrCodeInput.trim()}
              size="sm"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <QrCode className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>

        {/* Scan Result */}
        {scanResult && (
          <div className={`p-3 rounded-md border ${
            scanResult.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start gap-2">
              {scanResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  scanResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {scanResult.message}
                </p>
                {scanResult.success && scanResult.gigTitle && (
                  <p className="text-xs text-green-700 mt-1">
                    {language === "ar" ? "الحدث:" : "Event:"} {scanResult.gigTitle}
                  </p>
                )}
                {scanResult.success && scanResult.shiftId && (
                  <p className="text-xs text-green-700">
                    {language === "ar" ? "رقم المناوبة:" : "Shift ID:"} {scanResult.shiftId}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-gray-500 text-center space-y-1">
          <p>
            {language === "ar" 
              ? "امسح رمز QR الخاص بالحدث للتحقق من الحضور"
              : "Scan the event QR code to verify attendance"
            }
          </p>
          <p>
            {language === "ar" 
              ? "يجب أن تكون مقبولاً في الحدث أولاً"
              : "You must be approved for the event first"
            }
          </p>
        </div>
      </CardContent>
    </Card>
  )
} 