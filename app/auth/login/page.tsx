"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Phone, Lock, Eye, EyeOff, ChevronDown } from "lucide-react"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"

// Updated country codes focusing on MENA, US, and major European countries
const countryCodes = [
  // MENA Region
  { code: "+966", country: "Saudi Arabia", flag: "🇸🇦" },
  { code: "+971", country: "UAE", flag: "🇦🇪" },
  { code: "+965", country: "Kuwait", flag: "🇰🇼" },
  { code: "+973", country: "Bahrain", flag: "🇧🇭" },
  { code: "+974", country: "Qatar", flag: "🇶🇦" },
  { code: "+968", country: "Oman", flag: "🇴🇲" },
  { code: "+20", country: "Egypt", flag: "🇪🇬" },
  { code: "+212", country: "Morocco", flag: "🇲🇦" },
  { code: "+213", country: "Algeria", flag: "🇩🇿" },
  { code: "+216", country: "Tunisia", flag: "🇹🇳" },
  { code: "+961", country: "Lebanon", flag: "🇱🇧" },
  { code: "+962", country: "Jordan", flag: "🇯🇴" },
  { code: "+963", country: "Syria", flag: "🇸🇾" },
  { code: "+964", country: "Iraq", flag: "🇮🇶" },
  { code: "+98", country: "Iran", flag: "🇮🇷" },
  { code: "+90", country: "Turkey", flag: "🇹🇷" },
  { code: "+972", country: "Israel", flag: "🇮🇱" },
  
  // United States
  { code: "+1", country: "United States", flag: "🇺🇸" },
  
  // Major European Countries
  { code: "+44", country: "United Kingdom", flag: "🇬🇧" },
  { code: "+49", country: "Germany", flag: "🇩🇪" },
  { code: "+33", country: "France", flag: "🇫🇷" },
  { code: "+39", country: "Italy", flag: "🇮🇹" },
  { code: "+34", country: "Spain", flag: "🇪🇸" },
  { code: "+31", country: "Netherlands", flag: "🇳🇱" },
  { code: "+32", country: "Belgium", flag: "🇧🇪" },
  { code: "+41", country: "Switzerland", flag: "🇨🇭" },
  { code: "+43", country: "Austria", flag: "🇦🇹" },
  { code: "+46", country: "Sweden", flag: "🇸🇪" },
  { code: "+47", country: "Norway", flag: "🇳🇴" },
  { code: "+45", country: "Denmark", flag: "🇩🇰" },
  { code: "+358", country: "Finland", flag: "🇫🇮" },
  { code: "+48", country: "Poland", flag: "🇵🇱" },
  { code: "+420", country: "Czech Republic", flag: "🇨🇿" },
  { code: "+36", country: "Hungary", flag: "🇭🇺" },
  { code: "+30", country: "Greece", flag: "🇬🇷" },
  { code: "+351", country: "Portugal", flag: "🇵🇹" },
  { code: "+353", country: "Ireland", flag: "🇮🇪" },
  { code: "+380", country: "Ukraine", flag: "🇺🇦" },
  { code: "+7", country: "Russia", flag: "🇷🇺" },
]

export default function LoginPage() {
  const router = useRouter()
  const { login, setUser } = useAuth()
  const { language, isRTL } = useLanguage()
  const [selectedCountry, setSelectedCountry] = useState(countryCodes[6]) // Default to Egypt
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showCountrySelector, setShowCountrySelector] = useState(false)
  const [showPasswordSetup, setShowPasswordSetup] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState("")

  // Close country selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.country-selector')) {
        setShowCountrySelector(false)
      }
    }

    if (showCountrySelector) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCountrySelector])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    const fullPhone = selectedCountry.code + phone

    try {
      console.log("🚀 Login attempt for:", fullPhone)
      
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone, password }),
      })

      const data = await response.json()
      console.log("📨 Login response:", data)

      if (data.success) {
        setSuccess(language === "ar" ? "تم تسجيل الدخول بنجاح" : "Login successful")
        
        // Set user data in auth context directly since login already succeeded
        setUser(data.user)
        
        // Redirect to dashboard based on user role
        router.push(`/dashboard/${data.user.role}`)
      } else {
        // Check if the error is about missing password
        if (data.error && data.error.includes("Account not set up")) {
          setError(language === "ar" ? "لم يتم إعداد كلمة المرور بعد. يرجى إعداد كلمة المرور أولاً." : "Password not set up yet. Please set up your password first.")
          // Show password setup option
          setShowPasswordSetup(true)
        } else {
          setError(data.error || (language === "ar" ? "فشل في تسجيل الدخول" : "Login failed"))
        }
      }
    } catch (err) {
      console.error("❌ Network error:", err)
      setError(language === "ar" ? "حدث خطأ في الاتصال" : "Network error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    const fullPhone = selectedCountry.code + phone

    if (password !== confirmPassword) {
      setError(language === "ar" ? "كلمات المرور غير متطابقة" : "Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      console.log("🔐 Password setup attempt for:", fullPhone)
      
      const response = await fetch("/api/auth/setup-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          phone: fullPhone, 
          password, 
          confirmPassword 
        }),
      })

      const data = await response.json()
      console.log("📨 Password setup response:", data)

      if (data.success) {
        setSuccess(language === "ar" ? "تم إعداد كلمة المرور بنجاح" : "Password set successfully")
        setShowPasswordSetup(false)
        setPassword("")
        setConfirmPassword("")
        // Now user can try to login
      } else {
        setError(data.error || (language === "ar" ? "فشل في إعداد كلمة المرور" : "Failed to set password"))
      }
    } catch (err) {
      console.error("❌ Network error:", err)
      setError(language === "ar" ? "حدث خطأ في الاتصال" : "Network error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-custom-black dark:to-custom-navy flex items-center justify-center p-4 ${isRTL ? "font-arabic" : ""}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-lg overflow-hidden flex items-center justify-center">
              <img src="/logo.svg" alt="logo" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* Language Switcher and Theme Toggle */}
        <div className="flex justify-center items-center gap-4 mb-6">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>

        {/* Login Card */}
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {language === "ar" ? "تسجيل الدخول" : "Login"}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {language === "ar" 
                ? "أدخل رقم هاتفك وكلمة المرور للوصول إلى حسابك"
                : "Enter your phone number and password to access your account"
              }
            </p>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert className="mb-4" variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-green-600">{success}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Phone Number Input */}
              <div className="space-y-2">
                <Label htmlFor="phone">{language === "ar" ? "رقم الهاتف" : "Phone Number"}</Label>
                
                {/* Country Code Selector */}
                <div className="relative country-selector">
                  <button
                    type="button"
                    onClick={() => setShowCountrySelector(!showCountrySelector)}
                    className="w-full flex items-center justify-between p-3 border border-input bg-background rounded-md hover:bg-accent hover:text-accent-foreground"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{selectedCountry.flag}</span>
                      <span className="font-medium">{selectedCountry.code}</span>
                      <span className="text-sm text-muted-foreground">({selectedCountry.country})</span>
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform ${showCountrySelector ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Country Dropdown */}
                  {showCountrySelector && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-input rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {countryCodes.map((country) => (
                        <button
                          key={country.code}
                          type="button"
                          onClick={() => {
                            setSelectedCountry(country)
                            setShowCountrySelector(false)
                          }}
                          className="w-full flex items-center gap-3 p-3 hover:bg-accent hover:text-accent-foreground text-left"
                        >
                          <span className="text-lg">{country.flag}</span>
                          <span className="font-medium">{country.code}</span>
                          <span className="text-sm text-muted-foreground">{country.country}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Phone Number Input */}
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder={language === "ar" ? "1XX XXX XXXX" : "1XX XXX XXXX"}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="pl-10"
                    required
                  />
                </div>
                
                <p className="text-xs text-muted-foreground">
                  {language === "ar"
                    ? "سنستخدم هذا الرقم للوصول إلى حسابك"
                    : "We'll use this number to access your account"
                  }
                </p>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <Label htmlFor="password">{language === "ar" ? "كلمة المرور" : "Password"}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={language === "ar" ? "أدخل كلمة المرور" : "Enter your password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {language === "ar" ? "جاري تسجيل الدخول..." : "Logging in..."}
                  </>
                ) : (
                  <>
                    {language === "ar" ? "تسجيل الدخول" : "Login"}
                  </>
                )}
              </Button>
            </form>

            {/* Password Setup Form */}
            {showPasswordSetup && (
              <div className="mt-6 p-4 border border-orange-200 bg-orange-50 rounded-lg">
                <h3 className="text-lg font-semibold text-orange-800 mb-3">
                  {language === "ar" ? "إعداد كلمة المرور" : "Set Up Password"}
                </h3>
                <p className="text-sm text-orange-700 mb-4">
                  {language === "ar" 
                    ? "يبدو أن هذا هو أول تسجيل دخول لك. يرجى إعداد كلمة مرور لحسابك."
                    : "This appears to be your first login. Please set up a password for your account."
                  }
                </p>
                
                <form onSubmit={handlePasswordSetup} className="space-y-4">
                  {/* Confirm Password Input */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      {language === "ar" ? "تأكيد كلمة المرور" : "Confirm Password"}
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder={language === "ar" ? "أعد إدخال كلمة المرور" : "Re-enter your password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Setup Button */}
                  <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        {language === "ar" ? "جاري الإعداد..." : "Setting up..."}
                      </>
                    ) : (
                      <>
                        {language === "ar" ? "إعداد كلمة المرور" : "Set Up Password"}
                      </>
                    )}
                  </Button>
                </form>
              </div>
            )}

            {/* Links */}
            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                {language === "ar" ? "ليس لديك حساب؟" : "Don't have an account?"}{" "}
                <Link href="/auth/register" className="text-blue-600 hover:underline">
                  {language === "ar" ? "إنشاء حساب جديد" : "Create new account"}
                </Link>
              </p>
              
              <p className="text-sm text-muted-foreground">
                <Link href="/auth/forgot-password" className="text-blue-600 hover:underline">
                  {language === "ar" ? "نسيت كلمة المرور؟" : "Forgot password?"}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>
            {language === "ar" 
              ? "© 2024 منصة أورا. جميع الحقوق محفوظة."
              : "© 2024 Aura Platform. All rights reserved."
            }
          </p>
        </div>
      </div>
    </div>
  )
}
