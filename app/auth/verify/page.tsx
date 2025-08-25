"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/lib/language-context"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useTranslation } from "@/lib/i18n"
import { MessageSquare, ArrowRight } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { LogOut } from "lucide-react"

export default function VerifyPage() {
  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { language, isRTL } = useLanguage()

  const handleLogout = () => {
    // implement logout logic if needed
  }

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
      <header className="bg-card shadow-sm border-b border-border">
        <div className="container mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 max-w-4xl flex flex-col items-center">
          {/* Logo */}
          <div className="w-16 h-16 rounded-lg overflow-hidden flex items-center justify-center mx-auto mb-2">
            <img src="/logo.png" alt="logo" className="w-full h-full object-cover" />
          </div>
          {/* Header Text */}
          <div className="text-center mb-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-card-foreground">
              {language === "ar" ? "تحقق من رقمك" : "Verify Your Number"}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {language === "ar" ? "صفحة التحقق" : "Verification Page"}
            </p>
          </div>
          {/* Header Actions */}
          <div className="flex flex-wrap justify-center items-center gap-2 mt-2 w-full">
            <ThemeToggle />
            <LanguageSwitcher />
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              {language === "ar" ? "خروج" : "Logout"}
            </Button>
          </div>
        </div>
      </header>

      <div className="w-full max-w-md px-2 sm:px-4 md:px-6 lg:px-8 mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-16 h-16 rounded-lg overflow-hidden flex items-center justify-center">
              <img src="/logo.png" alt="logo" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="flex justify-center">
            <LanguageSwitcher />
          </div>
        </div>

        <Card className="shadow-xl w-full max-w-full mx-auto">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <MessageSquare className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-center text-base sm:text-lg md:text-xl lg:text-2xl">
              {language === "ar" ? "تأكيد رقم الهاتف" : "Verify Phone Number"}
            </CardTitle>
            <p className="text-center text-xs sm:text-sm md:text-base text-muted-foreground">
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
