"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { useTranslation } from "@/lib/i18n"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { Phone, ArrowRight, Upload, Building, User, AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

export default function RegisterPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { register } = useAuth()
  const { language, isRTL } = useLanguage()
  const [role, setRole] = useState<"usher" | "brand">("usher")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [uploadedFile, setUploadedFile] = useState<string | null>(null)
  const [passwordStrength, setPasswordStrength] = useState<{ score: number; feedback: string[]; isStrong: boolean }>({ score: 0, feedback: [], isStrong: false })
  const { t } = useTranslation(language)

  // Form states
  const [formData, setFormData] = useState({
    phone: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    // Usher specific
    skills: [] as string[],
    experienceYears: "",
    vcashNumber: "",
    // Brand specific
    companyName: "",
    industry: "",
    contactPerson: "",
    taxId: "",
  })

  useEffect(() => {
    const roleParam = searchParams.get("role")
    if (roleParam === "usher" || roleParam === "brand") {
      setRole(roleParam)
    }
  }, [searchParams])

  // Add password strength checking function
  const checkPasswordStrength = (password: string) => {
    const feedback: string[] = []
    let score = 0

    // Length check
    if (password.length >= 8) score += 1
    else feedback.push(language === "ar" ? "يجب أن تكون كلمة المرور 8 أحرف على الأقل" : "Password should be at least 8 characters long")

    // Contains lowercase
    if (/[a-z]/.test(password)) score += 1
    else feedback.push(language === "ar" ? "يجب أن تحتوي على أحرف صغيرة" : "Password should contain lowercase letters")

    // Contains uppercase
    if (/[A-Z]/.test(password)) score += 1
    else feedback.push(language === "ar" ? "يجب أن تحتوي على أحرف كبيرة" : "Password should contain uppercase letters")

    // Contains numbers
    if (/\d/.test(password)) score += 1
    else feedback.push(language === "ar" ? "يجب أن تحتوي على أرقام" : "Password should contain numbers")

    // Contains special characters
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1
    else feedback.push(language === "ar" ? "يجب أن تحتوي على رموز خاصة (!@#$%^&*)" : "Password should contain special characters (!@#$%^&*)")

    const strength = {
      score,
      feedback,
      isStrong: score >= 4
    }
    
    setPasswordStrength(strength)
    return strength
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Form submitted with data:", { ...formData, role, language })

    setIsLoading(true)
    setError("")
    setSuccess("")

    // Basic validation
    if (!formData.phone || !formData.name || !formData.password || !formData.confirmPassword) {
      setError(language === "ar" ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill in all required fields")
      setIsLoading(false)
      return
    }

    // Password validation
    if (formData.password !== formData.confirmPassword) {
      setError(language === "ar" ? "كلمات المرور غير متطابقة" : "Passwords do not match")
      setIsLoading(false)
      return
    }

    // Check password strength
    const strength = checkPasswordStrength(formData.password)
    if (!strength.isStrong) {
      setError(language === "ar" ? 
        `كلمة المرور ضعيفة. ${strength.feedback.join("، ")}` : 
        `Password is too weak. ${strength.feedback.join(", ")}`
      )
      setIsLoading(false)
      return
    }

    if (role === "brand" && !formData.companyName) {
      setError(language === "ar" ? "يرجى إدخال اسم الشركة" : "Please enter company name")
      setIsLoading(false)
      return
    }

    try {
      console.log("Calling register function...")
      const { confirmPassword, ...registrationData } = formData
      const success = await register({
        ...registrationData,
        role,
        language,
      })

      console.log("Register result:", success)

      if (success) {
        setSuccess(language === "ar" ? "تم إنشاء الحساب بنجاح!" : "Account created successfully!")
        // Small delay to show success message
        setTimeout(() => {
          router.push(`/dashboard/${role}`)
        }, 1500)
      } else {
        setError(language === "ar" ? "فشل في إنشاء الحساب" : "Failed to create account")
      }
    } catch (err) {
      console.error("Registration error:", err)
      setError(language === "ar" ? "حدث خطأ غير متوقع" : "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    console.log(`Updating ${field} to:`, value)
    setFormData((prev) => ({ ...prev, [field]: value }))
    
    // Check password strength when password changes
    if (field === "password") {
      checkPasswordStrength(value)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    console.log("Uploading file:", file.name)

    const formData = new FormData()
    formData.append("file", file)
    formData.append("userId", "temp") // Will be updated after user creation

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      console.log("Upload response:", data)

      if (data.success) {
        setUploadedFile(data.fileUrl)
      } else {
        console.error("Upload failed:", data)
      }
    } catch (error) {
      console.error("Upload error:", error)
    }
  }

  const availableSkills = [
    { id: "luxury-events", label: language === "ar" ? "الأحداث الفاخرة" : "Luxury Events" },
    { id: "hospitality", label: language === "ar" ? "الضيافة" : "Hospitality" },
    { id: "bartending", label: language === "ar" ? "تحضير المشروبات" : "Bartending" },
    { id: "customer-service", label: language === "ar" ? "خدمة العملاء" : "Customer Service" },
    { id: "crowd-control", label: language === "ar" ? "إدارة الحشود" : "Crowd Control" },
    { id: "event-coordination", label: language === "ar" ? "تنسيق الأحداث" : "Event Coordination" },
    { id: "multilingual", label: language === "ar" ? "متعدد اللغات" : "Multilingual" },
  ]

  const toggleSkill = (skillId: string) => {
    console.log("Toggling skill:", skillId)
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.includes(skillId) ? prev.skills.filter((s) => s !== skillId) : [...prev.skills, skillId],
    }))
  }

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 ${isRTL ? "font-arabic" : ""}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="flex items-center justify-center gap-2 mb-4">
                          <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-400 dark:to-amber-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">A</span>
              </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Aura</h1>
          </Link>
          <div className="flex justify-center items-center gap-4">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-center gap-4 mb-4">
              <Button
                type="button"
                variant={role === "usher" ? "default" : "outline"}
                onClick={() => {
                  console.log("Switching to usher role")
                  setRole("usher")
                }}
                className="flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                {language === "ar" ? "مضيف" : "Usher"}
              </Button>
              <Button
                type="button"
                variant={role === "brand" ? "default" : "outline"}
                onClick={() => {
                  console.log("Switching to brand role")
                  setRole("brand")
                }}
                className="flex items-center gap-2"
              >
                <Building className="h-4 w-4" />
                {language === "ar" ? "علامة تجارية" : "Brand"}
              </Button>
            </div>
            <CardTitle className="text-center">
              {language === "ar" ? "إنشاء حساب جديد" : "Create New Account"}
            </CardTitle>
            <p className="text-center text-sm text-muted-foreground">
              {role === "usher"
                ? language === "ar"
                  ? "انضم كمضيف محترف في أحداث الساحل الشمالي"
                  : "Join as a professional usher for North Coast events"
                : language === "ar"
                  ? "سجل علامتك التجارية لإيجاد أفضل المضيفين"
                  : "Register your brand to find the best ushers"}
            </p>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-6" variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-green-600">{success}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  {language === "ar" ? "المعلومات الأساسية" : "Basic Information"}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">{language === "ar" ? "رقم الهاتف" : "Phone Number"} *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+20 1XX XXX XXXX"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">
                      {role === "usher"
                        ? language === "ar"
                          ? "الاسم الكامل"
                          : "Full Name"
                        : language === "ar"
                          ? "اسم جهة الاتصال"
                          : "Contact Name"}{" "}
                      *
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{language === "ar" ? "البريد الإلكتروني" : "Email"}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">{language === "ar" ? "كلمة المرور" : "Password"} *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      placeholder={language === "ar" ? "مزيج من الأحرف والأرقام والرموز" : "Mix of letters, numbers & symbols"}
                      required
                    />
                    {formData.password && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <div
                                key={i}
                                className={`h-1 w-4 rounded ${
                                  i <= passwordStrength.score
                                    ? passwordStrength.score >= 4
                                      ? "bg-green-500"
                                      : passwordStrength.score >= 3
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
                                    : "bg-gray-200"
                                }`}
                              />
                            ))}
                          </div>
                          <span className={`text-xs ${
                            passwordStrength.isStrong ? "text-green-600" : "text-red-600"
                          }`}>
                            {passwordStrength.isStrong 
                              ? (language === "ar" ? "قوية" : "Strong")
                              : (language === "ar" ? "ضعيفة" : "Weak")
                            }
                          </span>
                        </div>
                        {!passwordStrength.isStrong && passwordStrength.feedback.length > 0 && (
                          <div className="text-xs text-red-600 space-y-1">
                            {passwordStrength.feedback.map((item, index) => (
                              <div key={index}>• {item}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{language === "ar" ? "تأكيد كلمة المرور" : "Confirm Password"} *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      placeholder={language === "ar" ? "أعد إدخال كلمة المرور" : "Re-enter password"}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Role-specific fields */}
              {role === "usher" ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    {language === "ar" ? "معلومات المضيف" : "Usher Information"}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="experience">{language === "ar" ? "سنوات الخبرة" : "Years of Experience"}</Label>
                      <Input
                        id="experience"
                        type="number"
                        min="0"
                        value={formData.experienceYears}
                        onChange={(e) => handleInputChange("experienceYears", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="vcash">{language === "ar" ? "رقم فودافون كاش" : "Vodafone Cash Number"}</Label>
                      <Input
                        id="vcash"
                        placeholder="01XXXXXXXXX"
                        value={formData.vcashNumber}
                        onChange={(e) => handleInputChange("vcashNumber", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{language === "ar" ? "المهارات" : "Skills"}</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {availableSkills.map((skill) => (
                        <div key={skill.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={skill.id}
                            checked={formData.skills.includes(skill.id)}
                            onCheckedChange={() => toggleSkill(skill.id)}
                          />
                          <Label htmlFor={skill.id} className="text-sm">
                            {skill.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="id-upload">{language === "ar" ? "صورة البطاقة الشخصية" : "ID Document"}</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        id="id-upload"
                        accept="image/*,.pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <label htmlFor="id-upload" className="cursor-pointer">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          {uploadedFile
                            ? language === "ar"
                              ? "تم رفع الملف بنجاح"
                              : "File uploaded successfully"
                            : language === "ar"
                              ? "اضغط لرفع صورة البطاقة"
                              : "Click to upload ID document"}
                        </p>
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    {language === "ar" ? "معلومات الشركة" : "Company Information"}
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="company">{language === "ar" ? "اسم الشركة" : "Company Name"} *</Label>
                    <Input
                      id="company"
                      value={formData.companyName}
                      onChange={(e) => handleInputChange("companyName", e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="industry">{language === "ar" ? "المجال" : "Industry"}</Label>
                      <Input
                        id="industry"
                        value={formData.industry}
                        onChange={(e) => handleInputChange("industry", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tax-id">{language === "ar" ? "الرقم الضريبي" : "Tax ID"}</Label>
                      <Input
                        id="tax-id"
                        value={formData.taxId}
                        onChange={(e) => handleInputChange("taxId", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {language === "ar" ? "جاري الإنشاء..." : "Creating Account..."}
                  </>
                ) : (
                  <>
                    {language === "ar" ? "إنشاء الحساب" : "Create Account"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {language === "ar" ? "لديك حساب بالفعل؟" : "Already have an account?"}
              </p>
              <Link href="/auth/login">
                <Button variant="link">{language === "ar" ? "تسجيل الدخول" : "Login"}</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
