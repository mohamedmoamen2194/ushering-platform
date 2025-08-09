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
import { useTranslation } from "@/lib/i18n"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { Plus, DollarSign, Users, Calendar, LogOut, Bell, FileText } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import Link from "next/link"

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
    if (!user) {
      router.push("/auth/login")
      return
    }

    if (user.role !== "brand") {
      router.push(`/dashboard/${user.role}`)
      return
    }

    fetchGigs()
    fetchBrandStats()
  }, [user, router])

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

  // Update the handleCreateGig function to handle both old and new schema
  const handleCreateGig = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Prepare the data based on what's available
      const gigData = {
        ...newGig,
        brandId: user?.id,
        duration_hours: Number.parseInt(newGig.duration_hours),
        pay_rate: Number.parseFloat(newGig.pay_rate),
        total_ushers_needed: Number.parseInt(newGig.total_ushers_needed),
      }

      const response = await fetch("/api/gigs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gigData),
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
        fetchBrandStats() // Refresh stats
      }
    } catch (error) {
      console.error("Failed to create gig:", error)
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${isRTL ? "font-arabic" : ""}`} dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{user.profile?.company_name || user.name}</h1>
                <p className="text-sm text-gray-600">
                  {language === "ar" ? "لوحة تحكم العلامة التجارية" : "Brand Dashboard"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {language === "ar" ? "رصيد المحفظة" : "Wallet Balance"}
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.walletBalance} {language === "ar" ? "ج.م" : "EGP"}
              </div>
              <p className="text-xs text-muted-foreground">
                {language === "ar" ? "متاح للدفع" : "Available for payments"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {language === "ar" ? "الوظائف النشطة" : "Active Gigs"}
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeGigs}</div>
              <p className="text-xs text-muted-foreground">{language === "ar" ? "تحتاج مضيفين" : "Need ushers"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {language === "ar" ? "إجمالي المضيفين" : "Total Ushers"}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUshersHired}</div>
              <p className="text-xs text-muted-foreground">{language === "ar" ? "مضيف معتمد" : "Hired ushers"}</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link href="/dashboard/brand/applications">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{language === "ar" ? "إدارة الطلبات" : "Manage Applications"}</h3>
                    <p className="text-sm text-gray-600">
                      {language === "ar" ? "مراجعة طلبات المضيفين" : "Review usher applications"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowCreateGig(true)}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Plus className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">{language === "ar" ? "إنشاء وظيفة جديدة" : "Create New Gig"}</h3>
                  <p className="text-sm text-gray-600">
                    {language === "ar" ? "أضف وظيفة جديدة للمضيفين" : "Add a new gig for ushers"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gigs Management */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">{language === "ar" ? "إدارة الوظائف" : "Manage Gigs"}</h2>
            <Dialog open={showCreateGig} onOpenChange={setShowCreateGig}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {language === "ar" ? "إنشاء وظيفة جديدة" : "Create New Gig"}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{language === "ar" ? "إنشاء وظيفة جديدة" : "Create New Gig"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateGig} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">{language === "ar" ? "عنوان الوظيفة" : "Gig Title"}</Label>
                      <Input
                        id="title"
                        value={newGig.title}
                        onChange={(e) => setNewGig({ ...newGig, title: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">{language === "ar" ? "الموقع" : "Location"}</Label>
                      <Input
                        id="location"
                        value={newGig.location}
                        onChange={(e) => setNewGig({ ...newGig, location: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">{language === "ar" ? "الوصف" : "Description"}</Label>
                    <Textarea
                      id="description"
                      value={newGig.description}
                      onChange={(e) => setNewGig({ ...newGig, description: e.target.value })}
                      rows={3}
                    />
                  </div>

                  {/* Date Range Section */}
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="font-medium">{language === "ar" ? "فترة العمل" : "Work Period"}</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="start_date">{language === "ar" ? "تاريخ البداية" : "Start Date"}</Label>
                        <Input
                          id="start_date"
                          type="date"
                          value={newGig.start_date}
                          onChange={(e) => setNewGig({ ...newGig, start_date: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end_date">{language === "ar" ? "تاريخ النهاية" : "End Date"}</Label>
                        <Input
                          id="end_date"
                          type="date"
                          value={newGig.end_date}
                          onChange={(e) => setNewGig({ ...newGig, end_date: e.target.value })}
                          min={newGig.start_date}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="start_datetime">
                        {language === "ar" ? "وقت البداية اليومي" : "Daily Start Time"}
                      </Label>
                      <Input
                        id="start_datetime"
                        type="time"
                        value={newGig.start_datetime}
                        onChange={(e) => setNewGig({ ...newGig, start_datetime: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="duration">{language === "ar" ? "ساعات العمل اليومية" : "Daily Hours"}</Label>
                      <Input
                        id="duration"
                        type="number"
                        min="1"
                        max="24"
                        value={newGig.duration_hours}
                        onChange={(e) => setNewGig({ ...newGig, duration_hours: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pay_rate">{language === "ar" ? "الأجر/ساعة (ج.م)" : "Pay Rate/hour (EGP)"}</Label>
                      <Input
                        id="pay_rate"
                        type="number"
                        min="50"
                        step="0.01"
                        value={newGig.pay_rate}
                        onChange={(e) => setNewGig({ ...newGig, pay_rate: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ushers_needed">
                        {language === "ar" ? "عدد المضيفين المطلوب" : "Number of Ushers Needed"}
                      </Label>
                      <Input
                        id="ushers_needed"
                        type="number"
                        min="1"
                        value={newGig.total_ushers_needed}
                        onChange={(e) => setNewGig({ ...newGig, total_ushers_needed: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowCreateGig(false)}>
                      {language === "ar" ? "إلغاء" : "Cancel"}
                    </Button>
                    <Button type="submit">{language === "ar" ? "إنشاء الوظيفة" : "Create Gig"}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>{language === "ar" ? "جاري التحميل..." : "Loading..."}</p>
            </div>
          ) : gigs.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500 mb-4">
                  {language === "ar" ? "لم تقم بإنشاء أي وظائف بعد" : "You haven't created any gigs yet"}
                </p>
                <Button onClick={() => setShowCreateGig(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {language === "ar" ? "إنشاء أول وظيفة" : "Create Your First Gig"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {gigs.map((gig: any) => (
                <Card key={gig.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{gig.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">{gig.location}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
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
                        <p className="font-medium">{language === "ar" ? "التاريخ" : "Date"}</p>
                        <p className="text-muted-foreground">
                          {gig.start_date && gig.end_date
                            ? `${new Date(gig.start_date).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US")} - ${new Date(gig.end_date).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US")}`
                            : new Date(gig.start_datetime).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US")}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">{language === "ar" ? "ساعات يومية" : "Daily Hours"}</p>
                        <p className="text-muted-foreground">{gig.duration_hours}h</p>
                      </div>
                      <div>
                        <p className="font-medium">{language === "ar" ? "الأجر" : "Pay Rate"}</p>
                        <p className="text-muted-foreground">{gig.pay_rate} EGP/h</p>
                      </div>
                      <div>
                        <p className="font-medium">{language === "ar" ? "الحالة" : "Status"}</p>
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
  )
}
