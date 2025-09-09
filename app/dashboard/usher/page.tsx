"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GigCard } from "@/components/gig-card"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { QRScanner } from "@/components/qr-scanner"
import { useTranslation } from "@/lib/i18n"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { Search, Filter, DollarSign, Calendar, Star, LogOut, Bell, Clock, QrCode, RefreshCw } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { ProtectedRoute } from "@/components/protected-route"
import Link from "next/link"
import { FileText } from "lucide-react"

export default function UsherDashboard() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const { language, isRTL } = useLanguage()
  const [gigs, setGigs] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalEarnings: 0,
    completedGigs: 0,
    rating: 0,
  })
  const [statsLoading, setStatsLoading] = useState(false)
  const { t } = useTranslation(language)
  const [appliedGigs, setAppliedGigs] = useState([])

  const fetchGigs = async () => {
    try {
      setLoading(true)
      console.log("🔄 Fetching fresh available gigs from database...")
      
      const response = await fetch(`/api/gigs?userId=${user?.id}&role=usher&t=${Date.now()}`)
      const data = await response.json()
      
      if (data.success !== false) {
        console.log("✅ Fresh available gigs fetched:", data.gigs?.length || 0, "gigs")
        setGigs(data.gigs || [])
      } else {
        console.error("❌ Failed to fetch available gigs:", data.error)
        setGigs([])
      }
    } catch (error) {
      console.error("❌ Error fetching available gigs:", error)
      setGigs([])
    } finally {
      setLoading(false)
    }
  }

  const fetchAppliedGigs = async () => {
    try {
      console.log("🔄 Fetching fresh applied gigs from database...")
      
      const response = await fetch(`/api/applications/usher/${user?.id}?t=${Date.now()}`)
      const data = await response.json()
      
      if (data.success) {
        console.log(
          "✅ Fresh applied gigs fetched:",
          (data.applications || []).length,
          "applications",
          (data.applications || []).map((a: any) => ({ id: a.id, status: a.status, reviewed_at: a.reviewed_at }))
        )
        setAppliedGigs(data.applications || [])
      } else {
        console.error("❌ Failed to fetch applied gigs:", data.error)
        setAppliedGigs([])
      }
    } catch (error) {
      console.error("❌ Error fetching applied gigs:", error)
      setAppliedGigs([])
    }
  }

  const fetchUserStats = async () => {
    try {
      setStatsLoading(true)
      console.log("🔄 Fetching fresh usher stats from database...")
      
      const response = await fetch(`/api/users/${user?.id}/stats?t=${Date.now()}`)
      const data = await response.json()
      
      if (data.success !== false) {
        console.log("✅ Fresh usher stats fetched:", data)
        setStats({
          totalEarnings: data.totalEarnings || 0,
          completedGigs: data.completedGigs || 0,
          rating: data.rating || 0,
        })
      } else {
        console.error("❌ Failed to fetch usher stats:", data.error)
      }
    } catch (error) {
      console.error("❌ Error fetching usher stats:", error)
    } finally {
      setStatsLoading(false)
    }
  }

  const ensureProfile = async () => {
    try {
      if (user?.id) {
        const response = await fetch(`/api/users/${user.id}/ensure-profile`, {
          method: "POST"
        })
        const data = await response.json()
        if (data.success && data.profileCreated) {
          console.log("Profile ensured for user:", user.id)
        }
      }
    } catch (error) {
      console.error("Failed to ensure profile:", error)
    }
  }

  useEffect(() => {
    if (!user?.id) return

    const intervalId = setInterval(() => {
      fetchAppliedGigs()
    }, 30000) // refresh every 30s

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchAppliedGigs()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [user?.id])

  useEffect(() => {
    if (user?.id) {
      ensureProfile()
      fetchUserStats()
      fetchGigs()
      fetchAppliedGigs()
    }
  }, [user?.id])

  const handleApply = async (gigId: number) => {
    try {
      console.log("Applying to gig:", gigId, "for user:", user?.id)

      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gigId, usherId: user?.id }),
      })

      const data = await response.json()
      console.log("Application response:", data)

      if (data.success) {
        alert(language === "ar" ? "تم تقديم الطلب بنجاح!" : "Application submitted successfully!")
        fetchGigs()
        fetchAppliedGigs()
      } else {
        alert(data.error || (language === "ar" ? "فشل في تقديم الطلب" : "Failed to submit application"))
      }
    } catch (error) {
      console.error("Application failed:", error)
      alert(language === "ar" ? "حدث خطأ في تقديم الطلب" : "Error submitting application")
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: 'Africa/Cairo',
    })
  }

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <ProtectedRoute requiredRole="usher">
      <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${isRTL ? "font-arabic" : ""}`} dir={isRTL ? "rtl" : "ltr"}>
  <header className="bg-card shadow-sm border-b border-border">
  <div className="container mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 max-w-4xl flex flex-col items-center">
    {/* Logo */}
    <div className="w-16 h-16 rounded-lg overflow-hidden flex items-center justify-center mx-auto mb-2">
      <img src="/logo.png" alt="logo" className="w-full h-full object-cover" />
    </div>
    {/* Header Text */}
    <div className="text-center mb-2">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-card-foreground">{user.name}</h1>
      <p className="text-sm sm:text-base text-muted-foreground">
        {language === "ar" ? "لوحة تحكم المضيف" : "Usher Dashboard"}
      </p>
    </div>
    {/* Header Actions */}
    <div className="flex flex-wrap justify-center items-center gap-2 mt-2 w-full">
      <ThemeToggle />
      <Button variant="ghost" size="sm">
        <Bell className="h-4 w-4" />
      </Button>
      <LanguageSwitcher />
      <Button variant="ghost" size="sm" onClick={handleLogout}>
        <LogOut className="h-4 w-4" />
        {language === "ar" ? "خروج" : "Logout"}
      </Button>
    </div>
  </div>
</header>
  <div className="container mx-auto px-4 py-8"> 
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("totalEarnings")}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              ) : (
                <div className="text-2xl font-bold">
                  {stats.totalEarnings} {language === "ar" ? "ج.م" : "EGP"}
                </div>
              )}
              <p className="text-xs text-muted-foreground">{language === "ar" ? "إجمالي الأرباح" : "Total earnings"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {language === "ar" ? "الوظائف المكتملة" : "Completed Gigs"}
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              ) : (
                <div className="text-2xl font-bold">{stats.completedGigs}</div>
              )}
              <p className="text-xs text-muted-foreground">{language === "ar" ? "وظائف مكتملة" : "Completed gigs"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{language === "ar" ? "التقييم" : "Rating"}</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              ) : (
                <div className="text-2xl font-bold">{stats.rating > 0 ? stats.rating.toFixed(1) : "0.0"}</div>
              )}
              <p className="text-xs text-muted-foreground">{language === "ar" ? "متوسط التقييم" : "Average rating"}</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end mb-4">
          <Button 
            onClick={() => {
              console.log("🔄 Manual refresh requested for usher dashboard...")
              fetchUserStats()
              fetchGigs()
              fetchAppliedGigs()
            }}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {language === "ar" ? "تحديث البيانات" : "Refresh Data"}
          </Button>
        </div>

        {/* QR Scanner Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2 text-center">
            <QrCode className="h-5 w-5" />
            {language === "ar" ? "ماسح رمز QR" : "QR Code Scanner"}
          </h2>
          <div className="max-w-md">
            <QRScanner />
          </div>
        </div>

        <div className="space-y-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white text-center">{language === "ar" ? "طلباتي" : "My Applications"}</h2>
          <p className="text-center text-xs text-muted-foreground">
            {language === 'ar' ? 'عدد الطلبات:' : 'Applications:'} {appliedGigs.length}
          </p>
          {appliedGigs.length === 0 ? (
            <Card>
              <CardContent className="text-center py-6">
                <p className="text-muted-foreground">
                  {language === 'ar' ? 'لا توجد طلبات حتى الآن' : 'No applications yet'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {appliedGigs.map((application: any) => {
                const normalizedStatus = (application.status && typeof application.status === 'string') ? application.status.toLowerCase() : undefined
                const computedStatus = application.reviewed_at ? 'approved' : (normalizedStatus || 'pending')
                return (
                  <Card key={application.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white">{application.gig_title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">{application.gig_location}</p>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300 mb-2">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {application.duration_hours}h {language === "ar" ? "يومياً" : "daily"}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {application.pay_rate} {language === "ar" ? "ج.م/ساعة" : "EGP/hr"}
                            </span>
                            {application.start_datetime && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(application.start_datetime).toLocaleTimeString(language === "ar" ? "ar-EG" : "en-US", {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: false,
                                  timeZone: 'Africa/Cairo',
                                })}
                              </span>
                            )}
                          </div>

                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                            {application.start_date && application.end_date
                              ? `${new Date(application.start_date).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US")} - ${new Date(application.end_date).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US")}`
                              : formatDate(application.gig_datetime)}
                          </p>
                          
                          {application.start_datetime && (
                            <div className="flex items-center gap-2 mb-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                🕐 {(application.start_time_24h || new Date(application.start_datetime).toLocaleTimeString(language === "ar" ? "ar-EG" : "en-US", {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: false,
                                  timeZone: 'Africa/Cairo',
                                }))} (24h)
                              </span>
                              <span className="text-xs text-gray-500">
                                {application.start_date_display || new Date(application.start_datetime).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", { timeZone: 'Africa/Cairo' })}
                              </span>
                            </div>
                          )}

                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {language === "ar" ? "تقدمت في:" : "Applied on:"}{" "}
                            {new Date(application.applied_at).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", { timeZone: 'Africa/Cairo' })}
                          </p>
                          {(typeof application.attended_days === 'number' && typeof application.total_days === 'number') && (
                            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                              {language === 'ar' ? 'الحضور:' : 'Attendance:'} {application.attended_days}/{application.total_days}
                            </p>
                          )}
                        </div>
                        <Badge
                          className={
                            computedStatus === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : computedStatus === "approved"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                          }
                        >
                          {computedStatus === "pending"
                            ? (language === "ar" ? "قيد المراجعة" : "Pending")
                            : computedStatus === "approved"
                              ? (language === "ar" ? "مقبول" : "Approved")
                              : (language === "ar" ? "مرفوض" : "Rejected")}
                        </Badge>
                      </div>
                      
                      {application.start_date && application.end_date && application.start_date !== application.end_date && (
                        <div className="mt-3 p-2 bg-blue-50 rounded text-sm">
                          <span className="font-medium text-blue-800">
                            {language === "ar" ? "إجمالي الأرباح المتوقعة:" : "Total Expected Earnings:"}{" "}
                          </span>
                          <span className="font-bold text-blue-900">
                            {(
                              application.pay_rate *
                              application.duration_hours *
                              (Math.ceil(
                                (new Date(application.end_date).getTime() - new Date(application.start_date).getTime()) / (1000 * 60 * 60 * 24),
                              ) + 1)
                            ).toLocaleString()} {language === "ar" ? "ج.م" : "EGP"}
                          </span>
                        </div>
                      )}

                      {computedStatus === "approved" && application.brand_email && (
                        <div className="mt-3 p-3 bg-green-50 rounded">
                          <p className="text-sm text-green-800 font-medium mb-1">
                            {language === "ar" ? "معلومات التواصل:" : "Contact Information:"}
                          </p>
                          <p className="text-sm text-green-700">
                            <strong>{language === "ar" ? "الشركة:" : "Company:"}</strong> {application.company_name}
                          </p>
                          <p className="text-sm text-green-700">
                            <strong>{language === "ar" ? "البريد الإلكتروني:" : "Email:"}</strong> {application.brand_email}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white text-center">{language === "ar" ? "الوظائف المتاحة" : "Available Gigs"}</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Search className="h-4 w-4 mr-2" />
                {language === "ar" ? "بحث" : "Search"}
              </Button>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                {language === "ar" ? "فلتر" : "Filter"}
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-900 dark:text-white">{language === "ar" ? "جاري التحميل..." : "Loading..."}</p>
            </div>
          ) : gigs.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  {language === "ar" ? "لا توجد وظائف متاحة حالياً" : "No gigs available at the moment"}
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  {language === "ar"
                    ? "سيتم إخفاء الوظائف التي تم قبولك فيها من هذه القائمة"
                    : "Gigs you've been approved for are hidden from this list"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                {language === "ar"
                  ? `عرض ${gigs.length} وظيفة متاحة • الوظائف المقبولة مخفية`
                  : `Showing ${gigs.length} available gigs • Approved gigs are hidden`}
              </div>
              <div className="grid gap-6">
                {gigs.map((gig: any) => (
                  <GigCard key={gig.id} gig={gig} language={language} userRole="usher" onApply={handleApply} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </ProtectedRoute>
  )
}
