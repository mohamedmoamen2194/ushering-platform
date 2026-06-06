"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { Briefcase, MapPin, Calendar, DollarSign, Users, RefreshCw, MessageCircle, UserCheck, Star, QrCode } from "lucide-react"
import Link from "next/link"

export default function BrandGigsPage() {
  const { user } = useAuth()
  const { language, isRTL } = useLanguage()
  const [gigs, setGigs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchGigs() }, [user?.id])

  const fetchGigs = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/gigs?role=brand&userId=${user?.id}&t=${Date.now()}`)
      const data = await res.json()
      if (data.success !== false) setGigs(data.gigs || [])
      else setGigs([])
    } catch (e) { console.error(e); setGigs([]) }
    finally { setLoading(false) }
  }

  const formatStartTime = (startDatetime: string) => {
    if (!startDatetime) return "N/A"
    try {
      if (/^\d{2}:\d{2}$/.test(startDatetime)) return startDatetime
      if (/^\d{4}-\d{2}-\d{2}$/.test(startDatetime)) return startDatetime
      const d = new Date(startDatetime)
      if (isNaN(d.getTime())) return "Invalid"
      return d.toLocaleTimeString(language === "ar" ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Africa/Cairo" })
    } catch { return "Invalid" }
  }

  const formatDate = (d: string) =>
    d ? new Date(d).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "Africa/Cairo" }) : "Ã¢â‚¬â€"

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight">
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {language === "ar" ? "وظائفي" : "My Gigs"}
          </span>
        </h1>
        <p className="text-xs text-muted-foreground font-light mt-0.5">
          {language === "ar" ? "إدارة وعرض جميع وظائفك" : "Manage and view all your gigs"}
        </p>
      </div>

      <div className="flex justify-between items-center animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
        <p className="text-xs font-mono text-muted-foreground/50">
          {language === "ar" ? `لديك ${gigs.length} وظيفة` : `${gigs.length} gigs total`}
        </p>
        <Button variant="ghost" size="sm" onClick={fetchGigs}>
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 sm:p-5"><div className="h-5 w-48 bg-muted rounded mb-3" /><div className="h-3 w-32 bg-muted rounded" /></CardContent>
            </Card>
          ))}
        </div>
      ) : gigs.length === 0 ? (
        <Card className="animate-fade-in-up border-dashed" style={{ animationDelay: "0.15s" }}>
          <CardContent className="flex flex-col items-center py-14">
            <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
              <Briefcase className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-semibold text-muted-foreground">
              {language === "ar" ? "لا توجد وظائف بعد" : "No gigs yet"}
            </p>
            <p className="text-xs text-muted-foreground/50 font-light mt-1">
              {language === "ar" ? "قم بإنشاء وظيفة جديدة من الصفحة الرئيسية" : "Create a new gig from the home page"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {gigs.map((g, i) => {
            const statusColor = g.status === "active" ? "bg-secondary/20 text-secondary" : g.status === "completed" ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary"
            return (
              <Card key={g.id} className="animate-fade-in-up" style={{ animationDelay: `${0.1 + i * 0.05}s` }}>
                <div className={`h-1 w-full ${g.status === "active" ? "bg-secondary" : g.status === "completed" ? "bg-accent" : "bg-primary"}`} />
                <CardContent className="p-4 sm:p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold">{g.title}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" /> {g.location}
                      </p>
                    </div>
                    <Badge className={`shrink-0 text-[10px] font-mono font-semibold ${statusColor}`}>
                      {g.status === "active" ? (language === "ar" ? "نشط" : "Active") : g.status === "completed" ? (language === "ar" ? "مكتمل" : "Completed") : g.status}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground/70 font-mono">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(g.start_date)}{g.end_date && g.end_date !== g.start_date ? ` Ã¢â‚¬â€ ${formatDate(g.end_date)}` : ""}</span>
                    <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{g.pay_rate} EGP/h</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" />{g.approved_ushers || 0}/{g.total_ushers_needed}</span>
                    <span>{g.duration_hours}h/day</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/50">
                    <Link href={`/dashboard/brand/applications?gigId=${g.id}`}>
                      <Button variant="outline" size="sm" className="text-xs h-8"><UserCheck className="h-3 w-3 mr-1" />{language === "ar" ? "الطلبات" : "Apps"}</Button>
                    </Link>
                    {g.approved_ushers > 0 && (
                      <Link href={`/gig-chat/${g.id}`}>
                        <Button variant="outline" size="sm" className="text-xs h-8"><MessageCircle className="h-3 w-3 mr-1" />{language === "ar" ? "محادثة" : "Chat"}</Button>
                      </Link>
                    )}
                    <Link href={`/dashboard/brand/rate-ushers?gigId=${g.id}`}>
                      <Button variant="outline" size="sm" className="text-xs h-8"><Star className="h-3 w-3 mr-1" />{language === "ar" ? "تقييم" : "Rate"}</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
