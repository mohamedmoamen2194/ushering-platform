"use client"

import type React from "react"
import { useMemo, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useTranslation } from "@/lib/i18n"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { Plus, DollarSign, Users, Calendar, FileText, MessageCircle, Star, Sparkles, ArrowRight, RefreshCw, Bell, AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import Link from "next/link"

export default function BrandHome() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const { language, isRTL } = useLanguage()
  const [stats, setStats] = useState({ walletBalance: 0, activeGigs: 0, totalUshersHired: 0 })
  const { t } = useTranslation(language)
  const [showCreateGig, setShowCreateGig] = useState(false)

  const [newGig, setNewGig] = useState({
    title: "", description: "", location: "", start_datetime: "", start_date: "",
    end_date: "", duration_hours: "", pay_rate: "", total_ushers_needed: "",
    skills_required: [] as string[], is_recurring: false,
  })

  const getPreviewStartISO = () => {
    if (!newGig.start_date && !newGig.start_datetime) return ""
    if (newGig.start_date && newGig.start_datetime) return `${newGig.start_date}T${newGig.start_datetime}:00`
    return newGig.start_datetime || ""
  }
  const previewStartISO = useMemo(() => getPreviewStartISO(), [newGig.start_date, newGig.start_datetime])
  const isDateOnly = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s)
  const isTimeOnly = (s: string) => /^\d{2}:\d{2}$/.test(s)

  const formatStartTime = (startDatetime: string) => {
    if (!startDatetime) return "N/A"
    try {
      if (isTimeOnly(startDatetime)) return startDatetime
      if (isDateOnly(startDatetime)) {
        const [y, m, d] = startDatetime.split("-").map(Number)
        const dateUtc = new Date(Date.UTC(y, m - 1, d))
        return dateUtc.toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", {
          month: "short", day: "numeric", timeZone: "Africa/Cairo",
        })
      }
      const d = new Date(startDatetime)
      if (isNaN(d.getTime())) return "Invalid Time"
      return d.toLocaleTimeString(language === "ar" ? "ar-EG" : "en-US", {
        hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Africa/Cairo",
      })
    } catch { return "Invalid Time" }
  }

  useEffect(() => {
    if (user?.id) fetchBrandStats()
  }, [user?.id])

  const fetchBrandStats = async () => {
    try {
      const res = await fetch(`/api/users/${user?.id}/stats?t=${Date.now()}`)
      const data = await res.json()
      if (data.success !== false) {
        const s = data.stats || {}
        setStats({
          walletBalance: s.wallet_balance || 0,
          activeGigs: s.active_gigs || 0,
          totalUshersHired: s.total_ushers_hired || 0,
        })
      }
    } catch (e) { console.error(e) }
  }

  const handleCreateGig = async () => {
    try {
      if (!newGig.title || !newGig.location || !newGig.start_date || !newGig.start_datetime ||
          !newGig.duration_hours || !newGig.pay_rate || !newGig.total_ushers_needed) {
        alert(language === "ar" ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill in all required fields")
        return
      }
      const startDateISO = previewStartISO || (newGig.start_date && newGig.start_datetime ? `${newGig.start_date}T${newGig.start_datetime}:00` : "")
      const startDate = startDateISO ? new Date(startDateISO) : null
      if (!startDate || isNaN(startDate.getTime())) {
        alert(language === "ar" ? "تاريخ/وقت بداية غير صالح" : "Invalid start date/time")
        return
      }
      if (startDate < new Date()) {
        alert(language === "ar" ? "تاريخ البداية لا يمكن أن يكون في الماضي" : "Start date cannot be in the past")
        return
      }
      const response = await fetch("/api/gigs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newGig, brand_id: user?.id }),
      })
      if (response.ok) {
        setShowCreateGig(false)
        setNewGig({
          title: "", description: "", location: "", start_datetime: "", start_date: "",
          end_date: "", duration_hours: "", pay_rate: "", total_ushers_needed: "",
          skills_required: [], is_recurring: false,
        })
        alert(language === "ar" ? "تم إنشاء الوظيفة بنجاح!" : "Gig created successfully!")
      } else {
        const errorData = await response.json()
        alert(errorData.error || (language === "ar" ? "فشل إنشاء الوظيفة" : "Failed to create gig"))
      }
    } catch (e) { console.error(e); alert(language === "ar" ? "حدث خطأ" : "Error") }
  }

  const statCards = [
    { icon: DollarSign, value: `${stats.walletBalance.toLocaleString()} EGP`, label: language === "ar" ? "المحفظة" : "Wallet", color: "text-primary" },
    { icon: Calendar, value: String(stats.activeGigs), label: language === "ar" ? "الوظائف النشطة" : "Active Gigs", color: "text-secondary" },
    { icon: Users, value: String(stats.totalUshersHired), label: language === "ar" ? "إجمالي المضيفين" : "Total Ushers", color: "text-accent" },
  ]

  const quickActions = [
    { href: "/dashboard/brand/gigs", icon: Calendar, label: language === "ar" ? "كل الوظائف" : "All Gigs", desc: language === "ar" ? "إدارة وعرض الوظائف" : "Manage all gigs", gradient: "from-primary to-[#cc0066]" },
    { href: "/dashboard/brand/applications", icon: FileText, label: language === "ar" ? "الطلبات" : "Applications", desc: language === "ar" ? "مراجعة طلبات المضيفين" : "Review usher applications", gradient: "from-secondary to-[#88cc00]" },
    { href: "/dashboard/brand/chats", icon: MessageCircle, label: language === "ar" ? "المحادثات" : "Chats", desc: language === "ar" ? "تواصل مع المضيفين" : "Message your ushers", gradient: "from-accent to-[#00c4cc]" },
  ]

  const [notifs, setNotifs] = useState<any[]>([])
  useEffect(() => {
    if (user?.id) {
      fetch(`/api/notifications?userId=${user?.id}&limit=3&t=${Date.now()}`)
        .then((r) => r.json())
        .then((d) => { if (d.success) setNotifs(d.notifications || []) })
        .catch(() => {})
    }
  }, [user?.id])
  const unreadNotifs = notifs.filter((n: any) => !n.is_read)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
        <div className="flex items-center gap-3 mb-1">
          <Sparkles className="h-5 w-5 text-secondary" />
          <h1 className="text-xl sm:text-3xl font-light tracking-tight">
            {language === "ar" ? "مرحباً" : "Welcome"}{" "}
            <span className="font-black bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              {user?.name || (language === "ar" ? "العلامة التجارية" : "Brand")}
            </span>
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground font-light tracking-wide ml-8">
          {language === "ar" ? "لوحة تحكم العلامة التجارية" : "Brand Dashboard"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
        {statCards.map((s) => (
          <Card key={s.label} className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
              <CardTitle className="text-[10px] font-mono font-semibold text-muted-foreground/60 tracking-[0.15em] uppercase">
                {s.label.split(" ")[0]}
              </CardTitle>
              <s.icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${s.color}`} />
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
              <div className="text-xl sm:text-2xl font-mono font-black tracking-tight">{s.value}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground/70 font-light mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Notifications */}
      {unreadNotifs.length > 0 && (
        <div className="animate-fade-in-up" style={{ animationDelay: "0.13s" }}>
          <div className="flex items-center gap-2 mb-2 px-1">
            <Bell className="h-3.5 w-3.5 text-primary" />
            <h2 className="text-xs font-mono font-bold text-muted-foreground/40 tracking-[0.2em] uppercase">
              {language === "ar" ? "إشعارات حديثة" : "Recent Updates"}
            </h2>
          </div>
          <div className="space-y-1.5">
            {unreadNotifs.slice(0, 2).map((n: any) => (
              <div key={n.id} className="flex items-start gap-2.5 p-3 rounded-xl bg-primary/5 border border-primary/10">
                <Bell className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold">{n.title}</p>
                  <p className="text-[11px] text-muted-foreground/70 font-light truncate">{n.message}</p>
                </div>
              </div>
            ))}
            <Link href="/dashboard/brand/notifications" className="block">
              <p className="text-[10px] font-mono font-semibold text-accent text-center py-1 hover:underline">
                {language === "ar" ? "عرض الكل" : "View all"}
              </p>
            </Link>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
        <h2 className="text-xs font-mono font-bold text-muted-foreground/40 tracking-[0.2em] uppercase mb-3 px-1">
          {language === "ar" ? "إجراءات سريعة" : "Quick Actions"}
        </h2>
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card className="card-hover h-full group">
                <CardContent className="p-3 sm:p-4 flex flex-col items-start gap-2 sm:gap-3">
                  <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                    <action.icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold">{action.label}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground/60 font-light">{action.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          <Dialog open={showCreateGig} onOpenChange={setShowCreateGig}>
            <DialogTrigger asChild>
              <Card className="card-hover h-full group cursor-pointer border-dashed border-secondary/30 bg-secondary/[0.02]">
                <CardContent className="p-3 sm:p-4 flex flex-col items-center justify-center h-full gap-1.5">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl border-2 border-dashed border-secondary/40 flex items-center justify-center">
                    <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-secondary" />
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-secondary">
                    {language === "ar" ? "وظيفة جديدة" : "New Gig"}
                  </p>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-card-foreground">{language === "ar" ? "إنشاء وظيفة جديدة" : "Create New Gig"}</DialogTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {language === "ar" ? "سيتم ربط الوظيفة بحساب علامتك التجارية" : "Linked to your brand account"}
                </p>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="title" className="text-xs text-card-foreground">{language === "ar" ? "العنوان" : "Title"}</Label>
                  <Input id="title" value={newGig.title} onChange={(e) => setNewGig({ ...newGig, title: e.target.value })} className="bg-background border-border h-10 text-sm" />
                </div>
                <div>
                  <Label htmlFor="desc" className="text-xs text-card-foreground">{language === "ar" ? "الوصف" : "Description"}</Label>
                  <Textarea id="desc" value={newGig.description} onChange={(e) => setNewGig({ ...newGig, description: e.target.value })} className="bg-background border-border text-sm" rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="loc" className="text-xs text-card-foreground">{language === "ar" ? "الموقع" : "Location"}</Label>
                    <Input id="loc" value={newGig.location} onChange={(e) => setNewGig({ ...newGig, location: e.target.value })} className="bg-background border-border h-10 text-sm" />
                  </div>
                  <div>
                    <Label htmlFor="rate" className="text-xs text-card-foreground">{language === "ar" ? "الأجر" : "Pay Rate"}</Label>
                    <Input id="rate" type="number" value={newGig.pay_rate} onChange={(e) => setNewGig({ ...newGig, pay_rate: e.target.value })} className="bg-background border-border h-10 text-sm" placeholder="EGP/h" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="sd" className="text-xs text-card-foreground">{language === "ar" ? "تاريخ البداية" : "Start Date"}</Label>
                    <Input id="sd" type="date" value={newGig.start_date} onChange={(e) => setNewGig({ ...newGig, start_date: e.target.value })} className="bg-background border-border h-10 text-sm" />
                  </div>
                  <div>
                    <Label htmlFor="st" className="text-xs text-card-foreground">{language === "ar" ? "وقت البداية" : "Start Time"}</Label>
                    <Input id="st" type="time" value={newGig.start_datetime} onChange={(e) => setNewGig({ ...newGig, start_datetime: e.target.value })} className="bg-background border-border h-10 text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="ed" className="text-xs text-card-foreground">{language === "ar" ? "تاريخ النهاية" : "End Date"}</Label>
                    <Input id="ed" type="date" value={newGig.end_date} onChange={(e) => setNewGig({ ...newGig, end_date: e.target.value })} className="bg-background border-border h-10 text-sm" />
                  </div>
                  <div>
                    <Label htmlFor="dh" className="text-xs text-card-foreground">{language === "ar" ? "ساعات/يوم" : "Hours/Day"}</Label>
                    <Input id="dh" type="number" value={newGig.duration_hours} onChange={(e) => setNewGig({ ...newGig, duration_hours: e.target.value })} className="bg-background border-border h-10 text-sm" />
                  </div>
                  <div>
                    <Label htmlFor="un" className="text-xs text-card-foreground">{language === "ar" ? "عدد المضيفين" : "Ushers"}</Label>
                    <Input id="un" type="number" value={newGig.total_ushers_needed} onChange={(e) => setNewGig({ ...newGig, total_ushers_needed: e.target.value })} className="bg-background border-border h-10 text-sm" />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleCreateGig} className="flex-1 h-10 text-sm">
                    {language === "ar" ? "إنشاء" : "Create"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateGig(false)} className="flex-1 h-10 text-sm">
                    {language === "ar" ? "إلغاء" : "Cancel"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tip */}
      <div className="animate-fade-in-up" style={{ animationDelay: "0.25s" }}>
        <div className="rounded-xl border border-secondary/20 bg-gradient-to-r from-secondary/5 to-accent/5 p-4 flex items-start gap-3">
          <Star className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold">
              {language === "ar" ? "💡 إنشاء رموز QR" : "💡 Create QR Codes"}
            </p>
            <p className="text-xs text-muted-foreground font-light mt-0.5">
              {language === "ar"
                ? "بعد إنشاء وظيفة جديدة، يمكنك إنشاء رموز QR لتسجيل حضور المضيفين"
                : "After creating a gig, generate QR codes for usher attendance"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
