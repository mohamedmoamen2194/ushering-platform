"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import {
  Clock, DollarSign, FileText, RefreshCw, MapPin, Calendar,
  CheckCircle, XCircle, Hourglass, Building, Mail
} from "lucide-react"

type Tab = "all" | "pending" | "approved" | "rejected"

export default function UsherApplicationsPage() {
  const { user } = useAuth()
  const { language, isRTL } = useLanguage()
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>("all")

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/applications/usher/${user?.id}?t=${Date.now()}`, { cache: "no-store" })
      const data = await res.json()
      if (data.success) setApplications(data.applications || [])
      else setApplications([])
    } catch (e) { console.error(e); setApplications([]) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (user?.id) fetchApplications()
  }, [user?.id])

  useEffect(() => {
    const interval = setInterval(fetchApplications, 60000)
    return () => clearInterval(interval)
  }, [user?.id])

  const getStatus = (app: any) => {
    if (app.reviewed_at) return "approved"
    const s = app.status?.toLowerCase()
    if (s === "approved" || s === "rejected") return s
    return "pending"
  }

  const filtered = applications.filter((a) => {
    if (activeTab === "all") return true
    return getStatus(a) === activeTab
  })

  const counts = {
    all: applications.length,
    pending: applications.filter((a) => getStatus(a) === "pending").length,
    approved: applications.filter((a) => getStatus(a) === "approved").length,
    rejected: applications.filter((a) => getStatus(a) === "rejected").length,
  }

  const tabs: { key: Tab; label: string; arLabel: string }[] = [
    { key: "all", label: "All", arLabel: "الكل" },
    { key: "pending", label: "Pending", arLabel: "قيد الانتظار" },
    { key: "approved", label: "Approved", arLabel: "مقبول" },
    { key: "rejected", label: "Rejected", arLabel: "مرفوض" },
  ]

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", {
      year: "numeric", month: "short", day: "numeric", timeZone: "Africa/Cairo",
    })

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight">
          <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
            {language === "ar" ? "طلباتي" : "My Applications"}
          </span>
        </h1>
        <p className="text-xs text-muted-foreground font-light mt-0.5">
          {language === "ar" ? "تابع حالة طلبات التقديم على الوظائف" : "Track your gig application status"}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
        {tabs.map((tab) => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab(tab.key)}
            className={`text-xs font-mono font-semibold tracking-tight whitespace-nowrap ${
              activeTab === tab.key ? "" : "border-muted text-muted-foreground/70"
            }`}
          >
            {language === "ar" ? tab.arLabel : tab.label}
            <span className={`ml-1.5 text-[10px] ${activeTab === tab.key ? "opacity-80" : "text-muted-foreground/50"}`}>
              ({counts[tab.key]})
            </span>
          </Button>
        ))}
        <Button variant="ghost" size="sm" onClick={fetchApplications} className="ml-auto shrink-0">
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4"><div className="h-5 w-40 bg-muted rounded mb-3" /><div className="h-3 w-28 bg-muted rounded" /></CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="animate-fade-in-up border-dashed" style={{ animationDelay: "0.15s" }}>
          <CardContent className="flex flex-col items-center py-14">
            <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
              <FileText className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-semibold text-muted-foreground">
              {language === "ar" ? "لا توجد طلبات" : "No applications"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((app: any, i) => {
            const status = getStatus(app)
            const statusConfig = {
              pending: { icon: Hourglass, class: "bg-amber-100 text-amber-800 border-amber-200", label: language === "ar" ? "قيد الانتظار" : "Pending" },
              approved: { icon: CheckCircle, class: "bg-green-100 text-green-800 border-green-200", label: language === "ar" ? "مقبول" : "Approved" },
              rejected: { icon: XCircle, class: "bg-red-100 text-red-800 border-red-200", label: language === "ar" ? "مرفوض" : "Rejected" },
            }
            const sc = statusConfig[status]

            return (
              <Card key={app.id} className="animate-fade-in-up overflow-hidden" style={{ animationDelay: `${0.1 + i * 0.05}s` }}>
                <div className={`h-1 w-full ${
                  status === "pending" ? "bg-amber-400" : status === "approved" ? "bg-secondary" : "bg-red-400"
                }`} />
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-base font-bold">{app.gig_title || app.title}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" />
                        {app.gig_location || app.location}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground/70 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {app.duration_hours}h
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" /> {app.pay_rate} EGP/h
                        </span>
                        {app.start_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {formatDate(app.start_date)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge className={`shrink-0 text-[10px] font-mono font-semibold ${sc.class}`}>
                      <sc.icon className="h-3 w-3 mr-1" />
                      {sc.label}
                    </Badge>
                  </div>

                  {/* Extra info for approved */}
                  {status === "approved" && app.company_name && (
                    <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-2 text-xs text-muted-foreground">
                      <Building className="h-3 w-3" />
                      <span className="font-medium">{app.company_name}</span>
                      {app.brand_email && (
                        <>
                          <span className="text-muted-foreground/30">Ã‚Â·</span>
                          <Mail className="h-3 w-3" />
                          <span className="font-mono text-[11px]">{app.brand_email}</span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Earnings preview */}
                  {app.start_date && app.end_date && app.start_date !== app.end_date && status === "approved" && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <p className="text-xs font-mono text-secondary font-semibold">
                        {language === "ar" ? "الأرباح المتوقعة:" : "Expected earnings:"}{" "}
                        {(app.pay_rate * app.duration_hours *
                          (Math.ceil((new Date(app.end_date).getTime() - new Date(app.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1)
                        ).toLocaleString()} EGP
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
  )
}
