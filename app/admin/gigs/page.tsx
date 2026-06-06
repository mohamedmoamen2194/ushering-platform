"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/lib/language-context"
import { Search, Briefcase, RefreshCw, MapPin, Calendar, Users, DollarSign } from "lucide-react"

interface ManagedGig {
  id: number
  title: string
  location: string
  start_date: string
  end_date: string
  duration_hours: number
  pay_rate: number
  total_ushers_needed: number
  approved_ushers: number
  status: string
  brand_name?: string
  company_name?: string
  created_at: string
}

export default function AdminGigsPage() {
  const { language, isRTL } = useLanguage()
  const [gigs, setGigs] = useState<ManagedGig[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => { fetchGigs() }, [])

  const fetchGigs = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/gigs?all=true&t=" + Date.now())
      const data = await res.json()
      if (data.success !== false) setGigs(data.gigs || [])
      else setGigs([])
    } catch (e) { console.error(e); setGigs([]) }
    finally { setLoading(false) }
  }

  const filtered = gigs.filter((g) => {
    const matchSearch = !search || g.title?.toLowerCase().includes(search.toLowerCase()) || g.location?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === "all" || g.status === statusFilter
    return matchSearch && matchStatus
  })

  const statusBadge = (status: string) => {
    const config: Record<string, { class: string; label: string }> = {
      active: { class: "bg-secondary/20 text-secondary", label: language === "ar" ? "نشط" : "Active" },
      completed: { class: "bg-accent/20 text-accent", label: language === "ar" ? "مكتمل" : "Completed" },
      cancelled: { class: "bg-primary/20 text-primary", label: language === "ar" ? "ملغي" : "Cancelled" },
    }
    return config[status] || { class: "bg-muted text-muted-foreground", label: status }
  }

  const formatDate = (d: string) =>
    d ? new Date(d).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", {
      year: "numeric", month: "short", day: "numeric", timeZone: "Africa/Cairo",
    }) : "Ã¢â‚¬â€"

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight">
          <span className="bg-gradient-to-r from-accent to-secondary bg-clip-text text-transparent">
            {language === "ar" ? "إدارة الوظائف" : "Gig Management"}
          </span>
        </h1>
        <p className="text-xs text-muted-foreground font-light mt-0.5">
          {language === "ar" ? "الإشراف على جميع الوظائف في المنصة" : "Oversee all gigs on the platform"}
        </p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-wrap gap-2 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
        <div className="relative flex-1 min-w-[200px]">
          <Search className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50`} />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={language === "ar" ? "بحث بالعنوان أو الموقع..." : "Search by title or location..."}
            className={`${isRTL ? "pr-10" : "pl-10"} h-10 bg-muted/30 border-muted text-sm font-light`}
          />
        </div>
        {["all", "active", "completed", "cancelled"].map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(s)}
            className="text-xs font-mono font-semibold tracking-tight"
          >
            {s === "all" ? (language === "ar" ? "الكل" : "All") : s.charAt(0).toUpperCase() + s.slice(1)}
          </Button>
        ))}
        <Button variant="ghost" size="sm" onClick={fetchGigs}>
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4"><div className="h-5 w-48 bg-muted rounded mb-3" /><div className="h-3 w-32 bg-muted rounded" /></CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="animate-fade-in-up border-dashed" style={{ animationDelay: "0.15s" }}>
          <CardContent className="flex flex-col items-center py-14">
            <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
              <Briefcase className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-semibold text-muted-foreground">
              {language === "ar" ? "لا توجد وظائف" : "No gigs found"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-mono text-muted-foreground/50 animate-fade-in-up">
            {language === "ar" ? `عرض ${filtered.length} وظيفة` : `Showing ${filtered.length} gigs`}
          </p>
          {filtered.map((g, i) => {
            const sb = statusBadge(g.status)
            return (
              <Card key={g.id} className="animate-fade-in-up" style={{ animationDelay: `${0.1 + i * 0.03}s` }}>
                <div className={`h-1 w-full ${
                  g.status === "active" ? "bg-secondary" : g.status === "completed" ? "bg-accent" : "bg-primary"
                }`} />
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm sm:text-base font-bold truncate">{g.title}</h3>
                        <Badge className={`shrink-0 text-[10px] font-mono font-semibold ${sb.class}`}>{sb.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" /> {g.location}
                      </p>
                    </div>
                    {g.company_name && (
                      <p className="text-xs text-muted-foreground/60 font-mono">{g.company_name}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 sm:gap-5 mt-3 text-xs text-muted-foreground/70">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {formatDate(g.start_date)}
                      {g.end_date && g.end_date !== g.start_date && ` Ã¢â‚¬â€ ${formatDate(g.end_date)}`}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" /> {g.pay_rate} EGP/h
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" /> {g.approved_ushers || 0}/{g.total_ushers_needed}
                    </span>
                    <span className="font-mono">{g.duration_hours}h/day</span>
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
