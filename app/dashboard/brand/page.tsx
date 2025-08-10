"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { useTranslation } from "@/lib/i18n"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { Plus, DollarSign, Users, Calendar, LogOut, Bell, FileText, MapPin, Clock, Wallet, Briefcase, UserCheck } from "lucide-react"
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

  useEffect(() => {
    // Only fetch data when user is available
    if (user) {
      fetchGigs()
      fetchBrandStats()
    }
  }, [user])

  const fetchBrandStats = async () => {
    try {
      const response = await fetch(`/api/users/${user?.id}/stats`)
      const data = await response.json()

      if (data.success) {
        setStats({
          walletBalance: data.stats.wallet_balance || 0,
          activeGigs: data.stats.active_gigs || 0,
          totalUshersHired: data.stats.total_ushers_hired || 0,
        })
      }
    } catch (error) {
      console.error("Failed to fetch brand stats:", error)
    }
  }

  // Update the fetchGigs function to check for new columns
  const fetchGigs = async () => {
    try {
      const response = await fetch(`/api/gigs?role=brand&userId=${user?.id}`)
      const data = await response.json()
      setGigs(data.gigs || [])
    } catch (error) {
      console.error("Failed to fetch gigs:", error)
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
      const response = await fetch("/api/gigs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newGig,
          brand_id: user?.id,
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
      }
    } catch (error) {
      console.error("Failed to create gig:", error)
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
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-amber-600 dark:from-custom-gold dark:to-amber-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">A</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-card-foreground">{user.profile?.company_name || user.name}</h1>
                  <p className="text-sm text-muted-foreground">
                    {language === "ar" ? "لوحة تحكم العلامة التجارية" : "Brand Dashboard"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
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
                  <div className="grid grid-cols-2 gap-4">
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
                      <Label htmlFor="end_date" className="text-card-foreground">{language === "ar" ? "تاريخ النهاية" : "End Date"}</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={newGig.end_date}
                        onChange={(e) => setNewGig({ ...newGig, end_date: e.target.value })}
                        className="bg-background border-border text-foreground"
                      />
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
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-card-foreground">{language === "ar" ? "التاريخ" : "Date"}</p>
                          <p className="text-muted-foreground">
                            {gig.start_date && gig.end_date
                              ? `${new Date(gig.start_date).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US")} - ${new Date(gig.end_date).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US")}`
                              : new Date(gig.start_datetime).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US")}
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
