"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useTranslation } from "@/lib/i18n"
import { MessageSquare, ArrowRight } from "lucide-react"

export default function VerifyPage() {
  const [language, setLanguage] = useState<"ar" | "en">("ar")
  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { t, isRTL } = useTranslation(language)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // TODO: Implement OTP verification
    console.log("Verification attempt:", code)

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      // Redirect to dashboard based on user role
    }, 2000)
  }

  const resendCode = () => {
    // TODO: Implement resend OTP
    console.log("Resending verification code")
  }

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 ${isRTL ? "font-arabic" : ""}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Aura</h1>
          </div>
          <div className="flex justify-center">
            <LanguageSwitcher currentLanguage={language} onLanguageChange={setLanguage} />
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <MessageSquare className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-center">
              {language === "ar" ? "تأكيد رقم الهاتف" : "Verify Phone Number"}
            </CardTitle>
            <p className="text-center text-sm text-muted-foreground">
              {language === "ar"
                ? "أدخل رمز التحقق المرسل عبر واتساب"
                : "Enter the verification code sent via WhatsApp"}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">{language === "ar" ? "رمز التحقق" : "Verification Code"}</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="text-center text-2xl tracking-widest"
                  maxLength={6}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  language === "ar" ? (
                    "جاري التحقق..."
                  ) : (
                    "Verifying..."
                  )
                ) : (
                  <>
                    {language === "ar" ? "تأكيد" : "Verify"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                {language === "ar" ? "لم تستلم الرمز؟" : "Didn't receive the code?"}
              </p>
              <Button variant="link" onClick={resendCode}>
                {language === "ar" ? "إعادة الإرسال" : "Resend Code"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
