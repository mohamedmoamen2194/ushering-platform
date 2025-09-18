"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, QrCode, RefreshCw } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"

export default function CheckInPage() {
  const router = useRouter()
  const params = useSearchParams()
  const { user } = useAuth()
  const { language } = useLanguage()

  const token = params.get("token") || ""
  const gigId = params.get("gigId") || ""
  const actionParam = (params.get("action") || "check_in").toLowerCase()
  const action: "check_in" | "check_out" = actionParam === "check_out" ? "check_out" : "check_in"

  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isReady = useMemo(() => Boolean(token && gigId), [token, gigId])

  useEffect(() => {
    // If not logged in, send to login and then back here
    if (!user) {
      const returnTo = window.location.pathname + window.location.search
      router.push(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`)
      return
    }
  }, [user, router])

  const submitAttendance = async () => {
    if (!user) return
    if (!isReady) {
      setError(language === "ar" ? "رابط غير صالح" : "Invalid link")
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      setResult(null)

      const response = await fetch("/api/qr-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrCodeToken: token, usherId: user.id, action })
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data?.error || (language === "ar" ? "فشل التحقق" : "Verification failed"))
      } else {
        setResult({ success: true, message: data?.message || "Success" })
      }
    } catch (e) {
      setError(language === "ar" ? "حدث خطأ غير متوقع" : "Unexpected error")
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    // Auto-submit on load when authenticated
    if (user && isReady && !result && !error) {
      submitAttendance()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isReady])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            {language === "ar" ? (action === "check_in" ? "تسجيل الحضور" : "تسجيل الانصراف") : (action === "check_in" ? "Check In" : "Check Out")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isReady && (
            <div className="p-3 rounded-md border bg-muted/30 text-muted-foreground">
              {language === "ar" ? "الرابط يفتقد معلمات مطلوبة" : "The link is missing required parameters"}
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {result && result.success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>{result.message}</span>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={submitAttendance} disabled={!isReady || submitting} className="flex-1">
              {submitting ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <QrCode className="h-4 w-4 mr-2" />}
              {language === "ar" ? "إعادة المحاولة" : "Try Again"}
            </Button>
            <Button variant="outline" onClick={() => router.push("/")}> 
              {language === "ar" ? "الصفحة الرئيسية" : "Home"}
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center">
            {language === "ar" ? "إذا لم يعمل الرابط، اطلب من المسؤول إنشاء رمز جديد." : "If the link doesn't work, ask the organizer to generate a new code."}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 