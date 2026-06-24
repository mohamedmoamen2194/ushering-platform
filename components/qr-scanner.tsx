"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { QrCode, CameraOff, CheckCircle, XCircle, Clock, Camera, RotateCcw } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import jsQR from "jsqr"

interface QRScanResult {
  success: boolean
  message: string
  gigTitle?: string
  action?: string
  shiftId?: number
  timestamp?: string
}

export function QRScanner() {
  const [scanning, setScanning] = useState(true)
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState(false)
  const [qrCodeInput, setQrCodeInput] = useState("")
  const [scanResult, setScanResult] = useState<QRScanResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [action, setAction] = useState<'check_in' | 'check_out'>('check_in')
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const lastScannedRef = useRef<string>("")
  const handleScanRef = useRef<typeof handleScan>(null as unknown as typeof handleScan)
  const { language, isRTL } = useLanguage()
  const { user } = useAuth()
  const initAttempted = useRef(false)

  const startCamera = useCallback(async () => {
    try {
      setCameraError(false)
      setCameraReady(false)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        await videoRef.current.play()
        setCameraReady(true)
        setScanning(true)
        setTimeout(() => {
          animationRef.current = requestAnimationFrame(detectQRCode)
        }, 500)
      }
    } catch (error) {
      console.error("Failed to start camera:", error)
      setCameraError(true)
      setScanning(false)
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setScanning(false)
    setCameraReady(false)
    lastScannedRef.current = ""
  }, [])

  const detectQRCode = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current

    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationRef.current = requestAnimationFrame(detectQRCode)
      return
    }

    const width = video.videoWidth
    const height = video.videoHeight

    if (width === 0 || height === 0) {
      animationRef.current = requestAnimationFrame(detectQRCode)
      return
    }

    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) {
      animationRef.current = requestAnimationFrame(detectQRCode)
      return
    }

    ctx.drawImage(video, 0, 0, width, height)
    const imageData = ctx.getImageData(0, 0, width, height)
    const code = jsQR(imageData.data, imageData.width, imageData.height)

    if (code && code.data && code.data !== lastScannedRef.current) {
      lastScannedRef.current = code.data
      handleScanRef.current(code.data)
    } else {
      animationRef.current = requestAnimationFrame(detectQRCode)
    }
  }, [])

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
    handleScanRef.current = handleScan
  })

  useEffect(() => {
    if (!initAttempted.current) {
      initAttempted.current = true
      startCamera()
    }
    return () => {
      stopCamera()
    }
  }, [startCamera, stopCamera])

  return (
    <div className="w-full space-y-4">
      {/* Action Selection */}
      <div className="flex gap-2">
        <button
          onClick={() => setAction('check_in')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
            action === 'check_in'
              ? 'bg-secondary/20 text-secondary shadow-sm'
              : 'bg-muted/30 text-muted-foreground/60'
          }`}
        >
          <CheckCircle className="h-3.5 w-3.5" />
          {language === "ar" ? "تسجيل دخول" : "Check In"}
        </button>
        <button
          onClick={() => setAction('check_out')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
            action === 'check_out'
              ? 'bg-accent/20 text-accent shadow-sm'
              : 'bg-muted/30 text-muted-foreground/60'
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          {language === "ar" ? "تسجيل خروج" : "Check Out"}
        </button>
      </div>

      {/* Camera Viewfinder */}
      <div className="relative w-full overflow-hidden rounded-2xl bg-black" style={{ aspectRatio: '3/4', maxHeight: '70vh' }}>
        {/* Video feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${cameraReady ? 'opacity-100' : 'opacity-0'}`}
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Scanner frame overlay */}
        <div className="absolute inset-0 pointer-events-none z-10">
          {/* Scan area with darkened surroundings */}
          <div className="absolute inset-[15%]">
            <div className="absolute inset-0" style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)' }} />
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-secondary rounded-tl-[4px]" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-secondary rounded-tr-[4px]" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-secondary rounded-bl-[4px]" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-secondary rounded-br-[4px]" />
            {/* Scan line animation */}
            <div className="absolute left-2 right-2 h-[2px] bg-gradient-to-r from-transparent via-secondary to-transparent animate-scan-line" />
          </div>
          {/* Top hint */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm text-white text-[10px] font-mono font-semibold tracking-wider whitespace-nowrap">
              <QrCode className="h-3 w-3" />
              {language === "ar" ? "وجه الكاميرا نحو رمز QR" : "POINT AT QR CODE"}
            </div>
          </div>
        </div>

        {/* Camera not available overlay */}
        {cameraError && !scanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 z-10">
            <CameraOff className="h-10 w-10 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground font-semibold">
              {language === "ar" ? "الكاميرا غير متاحة" : "Camera not available"}
            </p>
            <Button
              onClick={startCamera}
              size="sm"
              variant="secondary"
              className="gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {language === "ar" ? "إعادة المحاولة" : "Retry"}
            </Button>
          </div>
        )}

        {/* Loading state */}
        {!cameraReady && !cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="flex flex-col items-center gap-3">
              <Camera className="h-8 w-8 text-muted-foreground/30 animate-pulse" />
              <p className="text-xs text-muted-foreground/50 font-mono">
                {language === "ar" ? "جارٍ تشغيل الكاميرا..." : "Starting camera..."}
              </p>
            </div>
          </div>
        )}

        {/* Stop camera button */}
        {cameraReady && (
          <button
            onClick={stopCamera}
            className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white/80 hover:text-white transition-colors"
          >
            <XCircle className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Scan Result */}
      {scanResult && (
        <div className={`p-4 rounded-xl border ${
          scanResult.success 
            ? 'bg-green-50/80 border-green-200/60 dark:bg-green-900/10 dark:border-green-800/30' 
            : 'bg-red-50/80 border-red-200/60 dark:bg-red-900/10 dark:border-red-800/30'
        }`}>
          <div className="flex items-start gap-3">
            {scanResult.success ? (
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              {scanResult.success && scanResult.gigTitle ? (
                <>
                  <p className="text-sm font-bold text-green-800 dark:text-green-300">
                    {language === "ar"
                      ? `تم تسجيل دخولك بنجاح إلى وظيفة ${scanResult.gigTitle}`
                      : `You successfully entered ${scanResult.gigTitle} gig`}
                  </p>
                  <p className="text-xs text-green-700/70 dark:text-green-400/70 mt-1 font-mono">
                    {language === "ar" ? "في" : "at"}{" "}
                    {new Date(scanResult.timestamp || Date.now()).toLocaleTimeString(
                      language === "ar" ? "ar-EG" : "en-US",
                      { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Africa/Cairo" }
                    )}
                  </p>
                </>
              ) : (
                <p className={`text-sm font-medium ${
                  scanResult.success ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'
                }`}>
                  {scanResult.message}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manual input toggle */}
      <div className="text-center">
        <button
          onClick={() => setShowManual(!showManual)}
          className="text-[11px] text-muted-foreground/50 hover:text-muted-foreground/80 transition-colors font-mono underline underline-offset-2"
        >
          {showManual
            ? (language === "ar" ? "إخفاء الإدخال اليدوي" : "Hide manual input")
            : (language === "ar" ? "أدخل رمز QR يدوياً" : "Enter QR code manually")}
        </button>
      </div>

      {showManual && (
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <Input
            value={qrCodeInput}
            onChange={(e) => setQrCodeInput(e.target.value)}
            placeholder={language === "ar" ? "رمز QR..." : "QR code..."}
            className="flex-1 h-10 text-sm"
          />
          <Button 
            type="submit" 
            disabled={loading || !qrCodeInput.trim()}
            size="sm"
            className="h-10 px-4"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
            ) : (
              <QrCode className="h-4 w-4" />
            )}
          </Button>
        </form>
      )}

      {!scanResult && (
        <p className="text-[10px] text-muted-foreground/40 text-center font-mono">
          {language === "ar" 
            ? "يجب أن تكون مقبولاً في الحدث أولاً"
            : "You must be approved for the event first"}
        </p>
      )}
    </div>
  )
} 