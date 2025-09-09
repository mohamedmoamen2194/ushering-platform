"use client"

import type React from "react"
import { useMemo } from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { QRCodeDisplay } from "@/components/qr-code-display"
import { useTranslation } from "@/lib/i18n"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { Plus, DollarSign, Users, Calendar, LogOut, Bell, FileText, MapPin, Clock, Wallet, Briefcase, UserCheck, QrCode, Star, RefreshCw } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import Link from "next/link"
import { ProtectedRoute } from "@/components/protected-route"
import { Badge } from "@/components/ui/badge"

export default function BrandDashboard() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const { language, isRTL } = useLanguage()
  const [gigs, setGigs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateGig, setShowCreateGig] = useState(false)
  const [stats, setStats] = useState({
    walletBalance: 0,
    activeGigs: 0,
    totalUshersHired: 0,
  })
  const { t } = useTranslation(language)

  const [newGig, setNewGig] = useState({
    title: "",
    description: "",
    location: "",
    start_datetime: "",
    start_date: "",
    end_date: "",
    duration_hours: "",
    pay_rate: "",
    total_ushers_needed: "",
    skills_required: [],
    is_recurring: false,
  })

  const getPreviewStartISO = () => {
    if (!newGig.start_date && !newGig.start_datetime) return ""
    if (newGig.start_date && newGig.start_datetime) {
      return `${newGig.start_date}T${newGig.start_datetime}:00`
    }
    return newGig.start_datetime || ""
  }
  
  const previewStartISO = useMemo(() => getPreviewStartISO(), [newGig.start_date, newGig.start_datetime])
  
  // Helper: check if string looks like YYYY-MM-DD
  const isDateOnly = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s)

  // Helper: check if string looks like time-only HH:MM (24h)
  const isTimeOnly = (s: string) => /^\d{2}:\d{2}$/.test(s)

  // Format time (Cairo)
  const formatStartTime = (startDatetime: string) => {
    if (!startDatetime) return "N/A"
    try {
      // time-only => show as-is (safe)
      if (isTimeOnly(startDatetime)) return startDatetime

      // date-only => show midnight time as 00:00 (or return N/A for time)
      if (isDateOnly(startDatetime)) {
        const [y, m, d] = startDatetime.split("-").map(Number)
        // construct a UTC midnight for that date (unambiguous)
        const dateUtc = new Date(Date.UTC(y, m - 1, d))
        return dateUtc.toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", {
          month: "short",
          day: "numeric",
          timeZone: "Africa/Cairo",
        })
      }

      // full datetime / ISO
      const d = new Date(startDatetime)
      if (isNaN(d.getTime())) return "Invalid Time"
      return d.toLocaleTimeString(language === "ar" ? "ar-EG" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Africa/Cairo",
      })
    } catch {
      return "Invalid Time"
    }
  }

  // Format date + time (Cairo). If input is date-only, show only date (no time).
  const formatDateTime = (startDatetime: string) => {
    if (!startDatetime) return "N/A"
    try {
      if (isDateOnly(startDatetime)) {
        const [y, m, d] = startDatetime.split("-").map(Number)
        const dateObj = new Date(y, m - 1, d) // local midnight
        return dateObj.toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", { timeZone: "Africa/Cairo" })
      }

      if (isTimeOnly(startDatetime)) {
        // show time-only
        return startDatetime
      }

      const d = new Date(startDatetime)
      if (isNaN(d.getTime())) return "Invalid Date/Time"
      return d.toLocaleString(language === "ar" ? "ar-EG" : "en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Africa/Cairo",
      })
    } catch {
      return "Invalid Date/Time"
    }
  }

  useEffect(() => {
    if (user?.id) {
      fetchBrandStats()
      fetchGigs()
    }
  }, [user?.id])

  const fetchBrandStats = async () => {
    try {
      console.log("🔄 Fetching fresh brand stats from database...")
      
      const response = await fetch(`/api/users/${user?.id}/stats?t=${Date.now()}`)
      const data = await response.json()
      
      if (data.success !== false) {
        console.log("✅ Fresh stats fetched:", data)
        setStats(data)
      } else {
        console.error("❌ Failed to fetch stats:", data.error)
      }
    } catch (error) {
      console.error("❌ Error fetching stats:", error)
    }
  }

  // Update the fetchGigs function to check for new columns
  const fetchGigs = async () => {
    try {
      setLoading(true)
      console.log("🔄 Fetching fresh gigs from database...")
      
      const response = await fetch(`/api/gigs?role=brand&userId=${user?.id}&t=${Date.now()}`)
      const data = await response.json()
      
      if (data.success !== false) {
        console.log("✅ Fresh gigs fetched:", data.gigs?.length || 0, "gigs")
        setGigs(data.gigs || [])
      } else {
        console.error("❌ Failed to fetch gigs:", data.error)
        setGigs([])
      }
    } catch (error) {
      console.error("❌ Error fetching gigs:", error)
      setGigs([])
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const handleCreateGig = async () => {
    try {
      // Validate required fields
      if (!newGig.title || !newGig.location || !newGig.start_date || !newGig.start_datetime || 
          !newGig.duration_hours || !newGig.pay_rate || !newGig.total_ushers_needed) {
        alert(language === "ar" 
          ? "يرجى ملء جميع الحقول المطلوبة" 
          : "Please fill in all required fields")
        return
      }

      // Validate that start date is not in the past
      const startDateISO = previewStartISO || (newGig.start_date && newGig.start_datetime ? `${newGig.start_date}T${newGig.start_datetime}:00` : "")
      const startDate = startDateISO ? new Date(startDateISO) : null
      if (!startDate || isNaN(startDate.getTime())) {
        alert(language === "ar" ? "تنسيق تاريخ/وقت غير صالح" : "Invalid start date/time")
        return
      }
      if (startDate < new Date()) {
        alert(language === "ar" ? "تاريخ البداية لا يمكن أن يكون في الماضي" : "Start date cannot be in the past")
        return
      }

      // Create gig with automatic brand ID from authenticated user
      const response = await fetch("/api/gigs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newGig,
          brand_id: user?.id, // Automatically set from the authenticated user
        }),
      })

      if (response.ok) {
        setShowCreateGig(false)
        setNewGig({
          title: "",
          description: "",
          location: "",
          start_datetime: "",
          start_date: "",
          end_date: "",
          duration_hours: "",
          pay_rate: "",
          total_ushers_needed: "",
          skills_required: [],
          is_recurring: false,
        })
        fetchGigs()
        alert(language === "ar" 
          ? "تم إنشاء الوظيفة بنجاح!" 
          : "Gig created successfully!")
      } else {
        const errorData = await response.json()
        alert(errorData.error || (language === "ar" 
          ? "فشل في إنشاء الوظيفة" 
          : "Failed to create gig"))
      }
    } catch (error) {
      console.error("Failed to create gig:", error)
      alert(language === "ar" 
        ? "حدث خطأ في إنشاء الوظيفة" 
        : "Error creating gig")
    }
  }

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <ProtectedRoute requiredRole="brand">
      <div className={`min-h-screen bg-background ${isRTL ? "font-arabic" : ""}`} dir={isRTL ? "rtl" : "ltr"}>
        {/* Header */}
        <header className="bg-card shadow-sm border-b border-border">
          <div className="container mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 max-w-4xl flex flex-col items-center">
            {/* Logo */}
            <div className="w-16 h-16 rounded-lg overflow-hidden flex items-center justify-center mx-auto mb-2">
              <img src="/logo.png" alt="logo" className="w-full h-full object-cover" />
            </div>
            {/* Header Text */}
            <div className="text-center mb-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-card-foreground">{user.profile?.company_name || user.name}</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                {language === "ar" ? "لوحة تحكم العلامة التجارية" : "Brand Dashboard"}
              </p>
            </div>
            {/* Header Actions */}
            <div className="flex flex-wrap justify-center items-center gap-2 mt-2 w-full">
              <ThemeToggle />
              <Link href="/dashboard/brand/applications">
                <Button variant="ghost" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  {language === "ar" ? "الطلبات" : "Applications"}
                </Button>
              </Link>
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
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-card-foreground">
                  {language === "ar" ? "رصيد المحفظة" : "Wallet Balance"}
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-card-foreground">
                  {stats.walletBalance} {language === "ar" ? "ج.م" : "EGP"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {language === "ar" ? "متاح للدفع" : "Available for payments"}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-card-foreground">
                  {language === "ar" ? "الوظائف النشطة" : "Active Gigs"}
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-card-foreground">{stats.activeGigs}</div>
                <p className="text-xs text-muted-foreground">{language === "ar" ? "تحتاج مضيفين" : "Need ushers"}</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-card-foreground">
                  {language === "ar" ? "إجمالي المضيفين" : "Total Ushers"}
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-card-foreground">{stats.totalUshersHired}</div>
                <p className="text-xs text-muted-foreground">{language === "ar" ? "مضيف معتمد" : "Hired ushers"}</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Link href="/dashboard/brand/applications">
              <Card className="cursor-pointer hover:shadow-md transition-shadow bg-card border-border">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-card-foreground">{language === "ar" ? "إدارة الطلبات" : "Manage Applications"}</h3>
                      <p className="text-sm text-muted-foreground">
                        {language === "ar" ? "مراجعة طلبات المضيفين" : "Review usher applications"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Dialog open={showCreateGig} onOpenChange={setShowCreateGig}>
              <DialogTrigger asChild>
                <Card className="cursor-pointer hover:shadow-md transition-shadow bg-card border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Plus className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-card-foreground">{language === "ar" ? "إنشاء وظيفة جديدة" : "Create New Gig"}</h3>
                        <p className="text-sm text-muted-foreground">
                          {language === "ar" ? "أضف وظيفة جديدة للمضيفين" : "Add a new gig for ushers"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="text-card-foreground">{language === "ar" ? "إنشاء وظيفة جديدة" : "Create New Gig"}</DialogTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    {language === "ar" 
                      ? "سيتم ربط الوظيفة تلقائياً بحسابك كعلامة تجارية" 
                      : "The gig will be automatically linked to your brand account"}
                  </p>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="text-card-foreground">{language === "ar" ? "عنوان الوظيفة" : "Gig Title"}</Label>
                    <Input
                      id="title"
                      value={newGig.title}
                      onChange={(e) => setNewGig({ ...newGig, title: e.target.value })}
                      className="bg-background border-border text-foreground"
                      placeholder={language === "ar" ? "مثال: مضيف لحدث تجاري" : "e.g., Usher for Business Event"}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description" className="text-card-foreground">{language === "ar" ? "وصف الوظيفة" : "Description"}</Label>
                    <Textarea
                      id="description"
                      value={newGig.description}
                      onChange={(e) => setNewGig({ ...newGig, description: e.target.value })}
                      className="bg-background border-border text-foreground"
                      placeholder={language === "ar" ? "وصف تفصيلي للوظيفة والمتطلبات" : "Detailed description of the gig and requirements"}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="location" className="text-card-foreground">{language === "ar" ? "الموقع" : "Location"}</Label>
                      <Input
                        id="location"
                        value={newGig.location}
                        onChange={(e) => setNewGig({ ...newGig, location: e.target.value })}
                        className="bg-background border-border text-foreground"
                        placeholder={language === "ar" ? "الموقع" : "Location"}
                      />
                    </div>
                    <div>
                      <Label htmlFor="pay_rate" className="text-card-foreground">{language === "ar" ? "معدل الأجر" : "Pay Rate"}</Label>
                      <Input
                        id="pay_rate"
                        type="number"
                        value={newGig.pay_rate}
                        onChange={(e) => setNewGig({ ...newGig, pay_rate: e.target.value })}
                        className="bg-background border-border text-foreground"
                        placeholder="EGP/h"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="start_date" className="text-card-foreground">{language === "ar" ? "تاريخ البداية" : "Start Date"}</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={newGig.start_date}
                        onChange={(e) => setNewGig({ ...newGig, start_date: e.target.value })}
                        className="bg-background border-border text-foreground"
                      />
                    </div>
                    <div>
                      <Label htmlFor="start_datetime" className="text-card-foreground">{language === "ar" ? "وقت البداية" : "Start Time"}</Label>
                      <Input
                        id="start_datetime"
                        type="time"
                        value={newGig.start_datetime}
                        onChange={(e) => setNewGig({ ...newGig, start_datetime: e.target.value })}
                        className="bg-background border-border text-foreground"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {language === "ar" ? "مطلوب لإنشاء رمز QR" : "Required for QR code generation"}
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="end_date" className="text-card-foreground">{language === "ar" ? "تاريخ النهاية" : "End Date"}</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={newGig.end_date}
                        onChange={(e) => setNewGig({ ...newGig, end_date: e.target.value })}
                        className="bg-background border-border text-foreground"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {language === "ar" ? "اختياري - إذا لم يتم تحديده، سيتم استخدام تاريخ البداية" : "Optional - if not set, start date will be used"}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="duration_hours" className="text-card-foreground">{language === "ar" ? "ساعات يومية" : "Daily Hours"}</Label>
                      <Input
                        id="duration_hours"
                        type="number"
                        value={newGig.duration_hours}
                        onChange={(e) => setNewGig({ ...newGig, duration_hours: e.target.value })}
                        className="bg-background border-border text-foreground"
                        placeholder="8"
                      />
                    </div>
                    <div>
                      <Label htmlFor="total_ushers_needed" className="text-card-foreground">{language === "ar" ? "عدد المضيفين المطلوب" : "Ushers Needed"}</Label>
                      <Input
                        id="total_ushers_needed"
                        type="number"
                        value={newGig.total_ushers_needed}
                        onChange={(e) => setNewGig({ ...newGig, total_ushers_needed: e.target.value })}
                        className="bg-background border-border text-foreground"
                        placeholder="5"
                      />
                    </div>
                  </div>
                  
                  {/* Live Preview */}
                  {(newGig.start_date || newGig.start_datetime) && (
                    <div className="border-t pt-4 mt-4">
                      <h4 className="text-sm font-medium text-card-foreground mb-3">
                        {language === "ar" ? "معاينة الجدول الزمني" : "Schedule Preview"}
                      </h4>
                      <div className="bg-muted/50 rounded-lg p-3 text-sm">
                      {newGig.start_datetime && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-flex ...">
                            🕐 {formatStartTime(newGig.start_datetime)}
                          </span>
                          <span className="text-muted-foreground">
                            {newGig.start_date
                              ? formatDateTime(newGig.start_date)
                              : "No date set"}
                          </span>
                        </div>
                      )}
                        {newGig.start_date && newGig.end_date && newGig.start_date !== newGig.end_date && (
                          <p className="text-muted-foreground">
                            <span className="font-medium">{language === "ar" ? "المدة:" : "Duration:"}</span>{" "}
                            {new Date(newGig.start_date).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", { timeZone: "Africa/Cairo" })} - {new Date(newGig.end_date).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", { timeZone: "Africa/Cairo" })}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleCreateGig} className="flex-1">
                      {language === "ar" ? "إنشاء الوظيفة" : "Create Gig"}
                    </Button>
                    <Button variant="outline" onClick={() => setShowCreateGig(false)} className="flex-1">
                      {language === "ar" ? "إلغاء" : "Cancel"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Gigs Section */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-card-foreground">
                {language === "ar" ? "الوظائف الحالية" : "Current Gigs"}
              </h2>
              <div className="flex justify-end mb-4">
                <Button 
                  variant="outline" 
                  className="mr-2"
                  onClick={() => {
                    console.log("🔄 Manual refresh requested...")
                    fetchBrandStats()
                    fetchGigs()
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {language === "ar" ? "تحديث" : "Refresh"}
                </Button>
                <Button onClick={() => setShowCreateGig(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {language === "ar" ? "إنشاء وظيفة جديدة" : "Create New Gig"}
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : gigs.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-card-foreground mb-2">
                    {language === "ar" ? "لا توجد وظائف بعد" : "No gigs yet"}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {language === "ar" 
                      ? "ابدأ بإنشاء وظيفة جديدة لجذب المضيفين الموهوبين"
                      : "Start by creating a new gig to attract talented ushers"
                    }
                  </p>
                  <Button onClick={() => setShowCreateGig(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {language === "ar" ? "إنشاء وظيفة جديدة" : "Create New Gig"}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {gigs.map((gig: any) => (
                  <Card key={gig.id} className="bg-card border-border">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg text-card-foreground">{gig.title}</CardTitle>
                          <p className="text-sm text-muted-foreground">{gig.location}</p>
                          {gig.start_datetime && (
                            <div className="flex items-center gap-2 mt-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                                🕐 {gig.start_time_24h || formatStartTime(gig.start_datetime)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {gig.start_date_display || new Date(gig.start_datetime).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US",{ timeZone: "Africa/Cairo" })}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-card-foreground">
                            {gig.approved_ushers || 0}/{gig.total_ushers_needed} {language === "ar" ? "مضيف" : "ushers"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {gig.pending_applications || 0} {language === "ar" ? "طلب معلق" : "pending"}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm mb-4">
                        <div>
                          <p className="font-medium text-card-foreground">{language === "ar" ? "التاريخ" : "Date"}</p>
                          <p className="text-muted-foreground">
                            {gig.start_date && gig.end_date
                              ? `${new Date(gig.start_date).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", { timeZone: "Africa/Cairo" })} - ${new Date(gig.end_date).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", { timeZone: "Africa/Cairo" })}`
                              : gig.start_datetime 
                                ? (gig.start_date_display || new Date(gig.start_datetime).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", { timeZone: "Africa/Cairo" }))
                                : "N/A"
                            }
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-card-foreground">{language === "ar" ? "وقت البداية" : "Start Time"}</p>
                          <p className="text-muted-foreground">
                            {gig.start_datetime && !isNaN(new Date(gig.start_datetime).getTime())
                              ? formatStartTime(gig.start_datetime) + " (24h)"
                              : "Not set"
                            }
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-card-foreground">{language === "ar" ? "ساعات يومية" : "Daily Hours"}</p>
                          <p className="text-muted-foreground">{gig.duration_hours}h</p>
                        </div>
                        <div>
                          <p className="font-medium text-card-foreground">{language === "ar" ? "الأجر" : "Pay Rate"}</p>
                          <p className="text-muted-foreground">{gig.pay_rate} EGP/h</p>
                        </div>
                        <div>
                          <p className="font-medium text-card-foreground">{language === "ar" ? "الحالة" : "Status"}</p>
                          <p className="text-muted-foreground capitalize">{gig.status}</p>
                        </div>
                      </div>
                      
                      {/* Schedule Details */}
                      {gig.start_datetime && (
                        <div className="border-t pt-4 mb-4">
                          <h4 className="text-sm font-medium text-card-foreground mb-2">
                            {language === "ar" ? "تفاصيل الجدول الزمني" : "Schedule Details"}
                          </h4>
                          <div className="text-sm text-muted-foreground">
                            <p>
                              <span className="font-medium">{language === "ar" ? "يبدأ في:" : "Starts at:"}</span>{" "}
                              {gig.start_date_display && gig.start_time_24h ? `${gig.start_date_display} ${gig.start_time_24h}` : formatDateTime(gig.start_datetime)}
                            </p>
                            {gig.start_date && gig.end_date && (
                              <p className="mt-1">
                                <span className="font-medium">{language === "ar" ? "المدة:" : "Duration:"}</span>{" "}
                                {new Date(gig.start_date).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", { timeZone: "Africa/Cairo" })} - {new Date(gig.end_date).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", { timeZone: "Africa/Cairo" })}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* QR Code Section */}
                      {gig.status === 'active' && (
                        <div className="border-t pt-4">
                          <h4 className="text-sm font-medium text-card-foreground mb-3 flex items-center gap-2">
                            <QrCode className="h-4 w-4" />
                            {language === "ar" ? "رمز QR للحدث" : "Event QR Code"}
                          </h4>
                          <QRCodeDisplay
                            gigId={gig.id}
                            brandId={user?.id || 0}
                            gigTitle={gig.title}
                            startTime={formatDateTime(gig.start_datetime || gig.start_date)}
                            durationHours={gig.duration_hours}
                          />
                        </div>
                      )}
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-4 pt-4 border-t">
                        <Link href={`/dashboard/brand/applications?gigId=${gig.id}`}>
                          <Button variant="outline" size="sm">
                            <UserCheck className="h-4 w-4 mr-2" />
                            {language === "ar" ? "عرض الطلبات" : "View Applications"}
                          </Button>
                        </Link>
                        {gig.status === 'active' && (
                          <Link href={`/dashboard/brand/rate-ushers?gigId=${gig.id}`}>
                            <Button variant="outline" size="sm">
                              <Star className="h-4 w-4 mr-2" />
                              {language === "ar" ? "تقييم المضيفين" : "Rate Ushers"}
                            </Button>
                          </Link>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
