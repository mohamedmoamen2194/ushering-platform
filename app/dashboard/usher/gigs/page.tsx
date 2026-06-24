"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { GigCard } from "@/components/gig-card"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import {
  Search, RefreshCw, Briefcase, MapPin, Calendar,
  DollarSign, Clock, Star, UserCheck, CheckCircle,
  XCircle, Hourglass, ArrowRight, CheckCheck,
} from "lucide-react"
import Link from "next/link"

export default function UsherGigsPage() {
  const { user } = useAuth()
  const { language, isRTL } = useLanguage()
  const [gigs, setGigs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [tab, setTab] = useState<"available" | "applied">("available")

  // Applied gigs state
  const [appliedGigs, setAppliedGigs] = useState<any[]>([])
  const [appliedLoading, setAppliedLoading] = useState(false)

  const fetchGigs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ userId: String(user?.id), role: "usher", t: String(Date.now()) })
      if (searchQuery.trim()) params.set("search", searchQuery.trim())
      const res = await fetch(`/api/gigs?${params}`)
      const data = await res.json()
      if (data.success !== false) setGigs(data.gigs || [])
      else setGigs([])
    } catch (e) { console.error(e); setGigs([]) }
    finally { setLoading(false) }
  }

  const fetchAppliedGigs = async () => {
    if (!user?.id) return
    try {
      setAppliedLoading(true)
      const res = await fetch(`/api/applications/usher/${user.id}?t=${Date.now()}`)
      const data = await res.json()
      if (data.success) setAppliedGigs(data.applications || [])
      else setAppliedGigs([])
    } catch (e) { console.error(e); setAppliedGigs([]) }
    finally { setAppliedLoading(false) }
  }

  useEffect(() => {
    if (user?.id && tab === "available") fetchGigs()
  }, [user?.id, tab])

  useEffect(() => {
    if (user?.id && tab === "applied") fetchAppliedGigs()
  }, [user?.id, tab])

  const filteredGigs = gigs.filter((g: any) =>
    !searchQuery || g.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const isGigPast = (app: any) => {
    if (!app.start_datetime && !app.start_date) return false
    const now = new Date()
    let endDate: Date
    if (app.end_date) {
      endDate = new Date(app.end_date + "T23:59:59")
    } else if (app.start_datetime) {
      const start = new Date(app.start_datetime)
      endDate = new Date(start.getTime() + (app.duration_hours || 8) * 60 * 60 * 1000)
    } else {
      return false
    }
    return endDate < now
  }

  const activeApplied = appliedGigs.filter((a: any) =>
    a.status === "approved" && !isGigPast(a)
  )
  const pastApplied = appliedGigs.filter((a: any) =>
    a.status === "rejected" || a.status === "completed" || isGigPast(a) || a.gig_status === "completed"
  )

  const formatDate = (d: string) => {
    if (!d) return ""
    return new Date(d).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", {
      year: "numeric", month: "short", day: "numeric",
    })
  }

  const formatTime = (t: string | null | undefined) => {
    if (!t) return ""
    const d = new Date(t)
    if (isNaN(d.getTime())) return ""
    return d.toLocaleTimeString(language === "ar" ? "ar-EG" : "en-US", {
      hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Africa/Cairo",
    })
  }

  const parseDateStr = (val: any): string | null => {
    if (!val) return null
    if (typeof val === "string") return val.split("T")[0] || val
    if (val instanceof Date) {
      const y = val.getFullYear()
      const m = String(val.getMonth() + 1).padStart(2, "0")
      const d = String(val.getDate()).padStart(2, "0")
      return `${y}-${m}-${d}`
    }
    return null
  }

  const parseAttendance = (val: any): any[] => {
    if (!val) return []
    if (Array.isArray(val)) return val
    if (typeof val === "string") { try { return JSON.parse(val) } catch { return [] } }
    return []
  }

  const getAttendanceDays = (app: any) => {
    const days: { label: string; checked: boolean; time: string }[] = []
    const rawDt = app.start_datetime || app.datetime
    let startDate = app.start_date || parseDateStr(rawDt)
    let endDate = app.end_date || startDate

    const attendanceData = parseAttendance(app.daily_attendance)
    const attendanceMap: Record<string, any> = {}
    attendanceData.forEach((da: any) => {
      const dateKey = parseDateStr(da.date || da.attendance_date)
      if (dateKey) attendanceMap[dateKey] = da
    })

    // If no date range from gig, use earliest and latest attendance dates
    if (!startDate && attendanceData.length > 0) {
      const dates = attendanceData.map((da: any) => parseDateStr(da.date || da.attendance_date)).filter(Boolean)
      if (dates.length > 0) {
        dates.sort()
        startDate = dates[0]
        endDate = dates[dates.length - 1]
      }
    }

    if (!startDate) return days

    const start = new Date(startDate + "T00:00:00")
    const end = new Date(endDate + "T00:00:00")
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return days

    let dayIndex = 1
    const current = new Date(start)
    while (current <= end) {
      const dateKey = current.toISOString().split("T")[0]
      const record = attendanceMap[dateKey]
      days.push({
        label: `${language === "ar" ? "اليوم" : "Day"} ${dayIndex}`,
        checked: record?.present === true || !!record?.check_in,
        time: record?.check_in ? formatTime(record.check_in) : "",
      })
      current.setDate(current.getDate() + 1)
      dayIndex++
    }
    return days
  }

  const getStatusBadge = (status: string, isPast: boolean) => {
    if (isPast) {
      return (
        <Badge className="shrink-0 text-[10px] font-mono bg-muted text-muted-foreground">
          {language === "ar" ? "سابق" : "Past"}
        </Badge>
      )
    }
    switch (status) {
      case "approved":
        return (
          <Badge className="shrink-0 text-[10px] font-mono bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle className="h-3 w-3 mr-0.5" />
            {language === "ar" ? "مقبول" : "Active"}
          </Badge>
        )
      case "pending":
        return (
          <Badge className="shrink-0 text-[10px] font-mono bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
            <Hourglass className="h-3 w-3 mr-0.5" />
            {language === "ar" ? "قيد المراجعة" : "Pending"}
          </Badge>
        )
      case "rejected":
        return (
          <Badge className="shrink-0 text-[10px] font-mono bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
            <XCircle className="h-3 w-3 mr-0.5" />
            {language === "ar" ? "مرفوض" : "Rejected"}
          </Badge>
        )
      default:
        return (
          <Badge className="shrink-0 text-[10px] font-mono">
            {status}
          </Badge>
        )
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight">
          <span className="bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
            {language === "ar" ? "الوظائف" : "Gigs"}
          </span>
        </h1>
        <p className="text-xs text-muted-foreground font-light mt-0.5">
          {language === "ar" ? "تصفح وتقدم للوظائف" : "Browse and apply for gigs"}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
        <button
          onClick={() => setTab("available")}
          className={`flex-1 text-center py-2.5 rounded-xl text-xs font-mono font-bold tracking-wide transition-all ${
            tab === "available"
              ? "bg-secondary/20 text-secondary shadow-sm"
              : "bg-muted/30 text-muted-foreground/60 hover:bg-muted/50"
          }`}
        >
          {language === "ar" ? "الوظائف المتاحة" : "Available Gigs"}
        </button>
        <button
          onClick={() => setTab("applied")}
          className={`flex-1 text-center py-2.5 rounded-xl text-xs font-mono font-bold tracking-wide transition-all ${
            tab === "applied"
              ? "bg-secondary/20 text-secondary shadow-sm"
              : "bg-muted/30 text-muted-foreground/60 hover:bg-muted/50"
          }`}
        >
          {language === "ar" ? "وظائفي" : "Applied Gigs"}
          {appliedGigs.length > 0 && (
            <span className="ml-1 text-[10px] opacity-70">({appliedGigs.length})</span>
          )}
        </button>
      </div>

      {/* Search Bar (only for available) */}
      {tab === "available" && (
        <div className="flex gap-2 animate-fade-in-up" style={{ animationDelay: "0.12s" }}>
          <div className="relative flex-1">
            <Search className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50`} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") fetchGigs() }}
              placeholder={language === "ar" ? "بحث عن وظيفة..." : "Search gigs..."}
              className={`${isRTL ? "pr-10" : "pl-10"} h-10 bg-muted/30 border-muted text-sm font-light`}
            />
          </div>
          <Button variant="outline" size="sm" onClick={fetchGigs} className="h-10 w-10 p-0 border-muted">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Available Gigs */}
      {tab === "available" && (
        <>
          {loading ? (
            <div className="space-y-3 animate-fade-in-up">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4 sm:p-6">
                    <div className="h-5 w-48 bg-muted rounded mb-3" />
                    <div className="h-3 w-32 bg-muted rounded mb-2" />
                    <div className="h-3 w-24 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredGigs.length === 0 ? (
            <Card className="animate-fade-in-up border-dashed" style={{ animationDelay: "0.15s" }}>
              <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16">
                <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                  <Briefcase className="h-7 w-7 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-semibold text-muted-foreground">
                  {searchQuery
                    ? (language === "ar" ? "لا توجد نتائج للبحث" : "No results found")
                    : (language === "ar" ? "لا توجد وظائف متاحة حالياً" : "No gigs available right now")}
                </p>
                <p className="text-xs text-muted-foreground/50 font-light mt-1">
                  {language === "ar" ? "حاول تغيير معايير البحث" : "Try adjusting your search"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              <p className="text-xs font-mono text-muted-foreground/50 animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
                {language === "ar" ? `عرض ${filteredGigs.length} وظيفة` : `Showing ${filteredGigs.length} gigs`}
              </p>
              {filteredGigs.map((gig, i) => (
                <div key={gig.id} className="animate-fade-in-up" style={{ animationDelay: `${0.15 + i * 0.05}s` }}>
                  <GigCard gig={gig} language={language} userRole="usher" href={`/dashboard/usher/gigs/${gig.id}`} />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Applied Gigs */}
      {tab === "applied" && (
        <>
          {appliedLoading ? (
            <div className="space-y-3 animate-fade-in-up">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4 sm:p-6">
                    <div className="h-5 w-48 bg-muted rounded mb-3" />
                    <div className="h-3 w-32 bg-muted rounded mb-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : appliedGigs.length === 0 ? (
            <Card className="animate-fade-in-up border-dashed" style={{ animationDelay: "0.15s" }}>
              <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16">
                <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                  <UserCheck className="h-7 w-7 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-semibold text-muted-foreground">
                  {language === "ar" ? "لم تتقدم لأي وظيفة بعد" : "You haven't applied to any gigs yet"}
                </p>
                <p className="text-xs text-muted-foreground/50 font-light mt-1">
                  {language === "ar" ? "تصفح الوظائف المتاحة وقدم طلبك" : "Browse available gigs and apply"}
                </p>
                <Button variant="outline" size="sm" className="mt-4 text-xs" onClick={() => setTab("available")}>
                  {language === "ar" ? "عرض الوظائف المتاحة" : "View Available Gigs"}
                  <ArrowRight className={`h-3 w-3 ${isRTL ? "mr-1 rotate-180" : "ml-1"}`} />
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Active Applied */}
              {activeApplied.length > 0 && (
                <div className="space-y-2">
                  <h2 className="text-xs font-mono font-bold text-muted-foreground/40 tracking-[0.2em] uppercase px-1">
                    {language === "ar" ? "النشطة" : "Active"}
                    <span className="ml-1.5 text-[10px] opacity-50">({activeApplied.length})</span>
                  </h2>
                  {activeApplied.map((app: any, i: number) => (
                    <Link key={app.id} href={`/dashboard/usher/gigs/${app.gig_id}`} className="block">
                      <Card className="animate-fade-in-up cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all duration-200" style={{ animationDelay: `${i * 0.05}s` }}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <h3 className="text-sm font-bold truncate">{app.gig_title}</h3>
                              <p className="text-xs text-muted-foreground mt-0.5">{app.company_name || app.brand_name}</p>
                            </div>
                            {getStatusBadge(app.status, false)}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground/70 font-mono mt-2">
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{app.gig_location}</span>
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(app.start_datetime)}</span>
                            <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{app.pay_rate} EGP/h</span>
                          </div>
                          {app.role && (
                            <div className="mt-2 flex items-center gap-1.5">
                              <Badge variant="secondary" className="text-[10px] font-mono">
                                <Star className="h-3 w-3 mr-0.5 text-yellow-500" />
                                {language === "ar" ? "الدور:" : "Role:"} {app.role}
                              </Badge>
                            </div>
                          )}
                          {(() => {
                            const days = getAttendanceDays(app)
                            if (days.length === 0) return null
                            return (
                              <div className="mt-2 pt-2 border-t border-border/30">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                                  {days.map((day, di) => (
                                    <div
                                      key={di}
                                      className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-mono ${
                                        day.checked
                                          ? "bg-green-100/50 text-green-700 dark:bg-green-900/10 dark:text-green-400"
                                          : "bg-muted/30 text-muted-foreground/60"
                                      }`}
                                    >
                                      {day.checked ? (
                                        <CheckCheck className="h-3 w-3 shrink-0" />
                                      ) : (
                                        <Clock className="h-3 w-3 shrink-0" />
                                      )}
                                      <span className="truncate">{day.label}</span>
                                      {day.checked && day.time && (
                                        <span className="ml-auto text-[9px] opacity-75">{day.time}</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          })()}
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}

              {/* Past Applied */}
              {pastApplied.length > 0 && (
                <div className="space-y-2">
                  <h2 className="text-xs font-mono font-bold text-muted-foreground/40 tracking-[0.2em] uppercase px-1">
                    {language === "ar" ? "السابقة" : "Past"}
                    <span className="ml-1.5 text-[10px] opacity-50">({pastApplied.length})</span>
                  </h2>
                  {pastApplied.map((app: any, i: number) => (
                    <Link key={app.id} href={`/dashboard/usher/gigs/${app.gig_id}`} className="block">
                      <Card className="animate-fade-in-up cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all duration-200 opacity-75 hover:opacity-100" style={{ animationDelay: `${i * 0.03}s` }}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <h3 className="text-sm font-bold truncate">{app.gig_title}</h3>
                              <p className="text-xs text-muted-foreground mt-0.5">{app.company_name || app.brand_name}</p>
                            </div>
                            {getStatusBadge(app.status, true)}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground/70 font-mono mt-2">
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{app.gig_location}</span>
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(app.start_datetime)}</span>
                            <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{app.pay_rate} EGP/h</span>
                          </div>
                          {app.role && (
                            <div className="mt-2 flex items-center gap-1.5">
                              <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
                                <Star className="h-3 w-3 mr-0.5" />
                                {language === "ar" ? "الدور:" : "Role:"} {app.role}
                              </Badge>
                            </div>
                          )}
                          {(() => {
                            const days = getAttendanceDays(app)
                            if (days.length === 0) return null
                            return (
                              <div className="mt-2 pt-2 border-t border-border/20">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                                  {days.map((day, di) => (
                                    <div
                                      key={di}
                                      className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-mono ${
                                        day.checked
                                          ? "bg-green-100/50 text-green-700 dark:bg-green-900/10 dark:text-green-400"
                                          : "bg-muted/30 text-muted-foreground/60"
                                      }`}
                                    >
                                      {day.checked ? (
                                        <CheckCheck className="h-3 w-3 shrink-0" />
                                      ) : (
                                        <Clock className="h-3 w-3 shrink-0" />
                                      )}
                                      <span className="truncate">{day.label}</span>
                                      {day.checked && day.time && (
                                        <span className="ml-auto text-[9px] opacity-75">{day.time}</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          })()}
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
