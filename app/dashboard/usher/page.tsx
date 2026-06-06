"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { GigCard } from "@/components/gig-card"
import { useTranslation } from "@/lib/i18n"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import {
  DollarSign, Calendar, Star, Briefcase, FileText, QrCode,
  MessageCircle, AlertCircle, Bell, Search, SlidersHorizontal,
  RefreshCw, Sparkles, BellRing, ArrowRight, CheckCircle, XCircle,
  Hourglass, CreditCard, User, X
} from "lucide-react"
import Link from "next/link"

export default function UsherHome() {
  const { user } = useAuth()
  const { language, isRTL } = useLanguage()
  const { t } = useTranslation(language)
  const [gigs, setGigs] = useState<any[]>([])
  const [gigsLoading, setGigsLoading] = useState(true)
  const [stats, setStats] = useState({ totalEarnings: 0, completedGigs: 0, rating: 0 })
  const [searchQuery, setSearchQuery] = useState("")
  const [notifs, setNotifs] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    if (user?.id) { fetchGigs(); fetchStats(); fetchNotifications(); fetchProfile() }
  }, [user?.id])

  const fetchGigs = async () => {
    try {
      setGigsLoading(true)
      const res = await fetch(`/api/gigs?userId=${user?.id}&role=usher&t=${Date.now()}`)
      const data = await res.json()
      if (data.success !== false) setGigs(data.gigs || [])
    } catch (e) { console.error(e); setGigs([]) }
    finally { setGigsLoading(false) }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/users/${user?.id}/stats?t=${Date.now()}`)
      const data = await res.json()
      if (data.success !== false) {
        const s = data.stats || {}
        setStats({
          totalEarnings: s.total_earnings || s.totalEarnings || 0,
          completedGigs: s.completed_gigs || s.completedGigs || 0,
          rating: s.rating || 0,
        })
      }
    } catch (e) { console.error(e) }
  }

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`/api/notifications?userId=${user?.id}&limit=3&t=${Date.now()}`)
      const data = await res.json()
      if (data.success) setNotifs(data.notifications || [])
    } catch (e) { console.error(e) }
  }

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/users/${user?.id}/profile`)
      const data = await res.json()
      if (data.success) setProfile(data.profile || {})
    } catch (e) { console.error(e) }
  }

  const handleApply = async (gigId: number) => {
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gigId, usherId: user?.id }),
      })
      const data = await res.json()
      if (data.success) {
        alert(language === "ar" ? "تم تقديم الطلب بنجاح!" : "Application submitted!")
        fetchGigs()
      } else {
        alert(data.error || (language === "ar" ? "فشل التقديم" : "Failed to apply"))
      }
    } catch (e) { console.error(e); alert(language === "ar" ? "حدث خطأ" : "Error") }
  }

  const pm = profile?.payment_method
  const paymentSet = profile?.payment_method_set || (pm && pm !== "{}")
  const hasPhoto = profile?.profile_photo_url
  const hasId = profile?.id_photo_url
  const missingItems: string[] = []
  if (!hasPhoto) missingItems.push(language === "ar" ? "الصورة الشخصية" : "Profile Photo")
  if (!hasId) missingItems.push(language === "ar" ? "صورة الهوية" : "ID Photo")
  if (!paymentSet) missingItems.push(language === "ar" ? "طريقة الدفع" : "Payment Method")
  if (!user?.name) missingItems.push(language === "ar" ? "الاسم" : "Name")

  const unreadNotifs = notifs.filter((n: any) => !n.is_read)

  const filteredGigs = gigs.filter((g: any) =>
    !searchQuery || g.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.location?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="max-w-4xl mx-auto space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
        <div className="flex items-center gap-3 mb-1">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-xl sm:text-3xl font-light tracking-tight">
            {language === "ar" ? "مرحباً" : "Hi"}{" "}
            <span className="font-black bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              {user?.name || (language === "ar" ? "مضيف" : "Usher")}
            </span>
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground font-light tracking-wide ml-8">
          {language === "ar" ? "تصفح الوظائف المتاحة" : "Browse available gigs"}
        </p>
      </div>

      {/* Urgent Alerts */}
      {missingItems.length > 0 && (
        <div className="animate-fade-in-up" style={{ animationDelay: "0.08s" }}>
          <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-950/20 to-amber-900/10 p-4 space-y-2">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5 shrink-0 animate-pulse" />
              <div>
                <p className="text-sm font-bold text-amber-300">
                  {language === "ar" ? `🔔 ${missingItems.length} عناصر غير مكتملة` : `⚠️ ${missingItems.length} incomplete items`}
                </p>
                <p className="text-xs text-amber-400/70 font-light mt-0.5">
                  {language === "ar" ? "أكمل ملفك الشخصي لتتمكن من التقديم على الوظائف" : "Complete your profile to apply for gigs"}
                </p>
              </div>
              <Link href="/dashboard/usher/profile" className="ml-auto shrink-0">
                <Button variant="outline" size="sm" className="border-amber-500/40 text-amber-300 text-xs h-8">
                  {language === "ar" ? "إكمال" : "Fix"}
                  <ArrowRight className={`h-3 w-3 ${isRTL ? "mr-1 rotate-180" : "ml-1"}`} />
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap gap-1.5 pl-8">
              {missingItems.map((item) => (
                <span key={item} className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-amber-950/30 text-amber-300 border border-amber-500/20">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stats Mini Row */}
      <div className="grid grid-cols-3 gap-2.5 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
        {[
          { icon: DollarSign, value: `${stats.totalEarnings.toLocaleString()}`, suffix: " EGP", color: "text-primary", label: language === "ar" ? "الأرباح" : "Earnings" },
          { icon: Calendar, value: String(stats.completedGigs), suffix: "", color: "text-secondary", label: language === "ar" ? "مكتملة" : "Done" },
          { icon: Star, value: stats.rating > 0 ? stats.rating.toFixed(1) : "0.0", suffix: "", color: "text-accent", label: language === "ar" ? "التقييم" : "Rating" },
        ].map((s) => (
          <Card key={s.label} className="card-hover">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono font-semibold text-muted-foreground/50 uppercase tracking-wider">{s.label}</span>
                <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
              </div>
              <div className="text-lg sm:text-2xl font-mono font-black tracking-tight">
                {s.value}{s.suffix && <span className="text-[10px] font-medium text-muted-foreground">{s.suffix}</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Notifications */}
      {unreadNotifs.length > 0 && (
        <div className="animate-fade-in-up" style={{ animationDelay: "0.12s" }}>
          <div className="flex items-center gap-2 mb-2 px-1">
            <BellRing className="h-3.5 w-3.5 text-primary" />
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
            <Link href="/dashboard/usher/notifications" className="block">
              <p className="text-[10px] font-mono font-semibold text-accent text-center py-1 hover:underline">
                {language === "ar" ? "عرض كل الإشعارات" : "View all notifications"}
              </p>
            </Link>
          </div>
        </div>
      )}

      {/* Available Gigs */}
      <div className="animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-mono font-bold text-muted-foreground/40 tracking-[0.2em] uppercase">
            {language === "ar" ? "الوظائف المتاحة" : "Available Gigs"}
          </h2>
          <div className="flex gap-1">
            <div className="relative">
              <Search className={`absolute ${isRTL ? "right-2" : "left-2"} top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50`} />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === "ar" ? "بحث..." : "Search..."}
                className="h-8 w-32 sm:w-44 text-xs pl-7 bg-muted/30 border-muted"
              />
            </div>
            <Button variant="ghost" size="sm" onClick={fetchGigs} className="h-8 w-8 p-0">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {gigsLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Card key={i} className="animate-pulse"><CardContent className="p-4"><div className="h-5 w-48 bg-muted rounded mb-3" /><div className="h-3 w-32 bg-muted rounded" /></CardContent></Card>
            ))}
          </div>
        ) : filteredGigs.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center py-10">
              <Briefcase className="h-7 w-7 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-semibold text-muted-foreground">
                {searchQuery
                  ? (language === "ar" ? "لا توجد نتائج" : "No results")
                  : (language === "ar" ? "لا توجد وظائف متاحة" : "No gigs available")}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredGigs.map((gig, i) => (
              <div key={gig.id} className="animate-fade-in-up" style={{ animationDelay: `${0.15 + i * 0.05}s` }}>
                <GigCard gig={gig} language={language} userRole="usher" onApply={handleApply} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
