"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { UsherHistory } from "@/components/usher-history"
import { useTranslation } from "@/lib/i18n"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import {
  ArrowLeft,
  Check,
  X,
  User,
  Star,
  Calendar,
  MapPin,
  Filter,
  RefreshCw,
  Phone,
  Mail,
  History,
  Eye,
  Clock,
} from "lucide-react"
import Link from "next/link"
import { ProtectedRoute } from "@/components/protected-route"

interface Application {
  id: number
  gig_id: number
  usher_id: number
  status: string
  applied_at: string
  reviewed_at?: string
  gig_title: string
  gig_location: string
  gig_datetime: string
  gig_duration_hours: number
  usher_name: string
  usher_phone: string
  usher_email: string
  usher_rating: number
  usher_experience_years: number
  usher_skills: string[]
  usher_vcash_number: string
  usher_profile_photo_url?: string | null
}

export default function ApplicationsPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { language, isRTL } = useLanguage()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("active")
  const [gigFilter, setGigFilter] = useState<string>(searchParams.get("gigId") || "all")
  const [expandedGigs, setExpandedGigs] = useState<Set<number>>(new Set())
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const { t } = useTranslation(language)

  // Derive unique gigs
  const uniqueGigs = Array.from(new Map(applications.map(a => [a.gig_id, { id: a.gig_id, title: a.gig_title, location: a.gig_location, datetime: a.gig_datetime }])).values())

  // Group applications by gig_id
  const gigGroups = uniqueGigs.map(gig => ({
    ...gig,
    applications: applications.filter(a => a.gig_id === gig.id),
  }))

  // Filtered applications when a specific gig is selected
  const filteredApps = gigFilter === "all" ? null : applications.filter(a => a.gig_id === parseInt(gigFilter))

  useEffect(() => {
    // Only fetch data when user is available
    if (user) {
      fetchApplications()
    }
  }, [user, statusFilter])

  const fetchApplications = async () => {
    setLoading(true)
    try {
      let url = `/api/applications/brand/${user?.id}`
      const params = new URLSearchParams()

      if (statusFilter === "active") {
        // Default: show pending and approved, hide rejected
        params.set("includeRejected", "false")
      } else if (statusFilter === "all") {
        params.set("status", "all")
      } else {
        params.set("status", statusFilter)
      }

      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        // Ensure all applications have required fields with defaults
        const processedApplications = (data.applications || []).map((app: any) => ({
          ...app,
          gig_duration_hours: parseInt(app.gig_duration_hours) || 8,
          usher_rating: parseFloat(app.usher_rating) || 0,
          usher_experience_years: parseInt(app.usher_experience_years) || 0,
          usher_skills: Array.isArray(app.usher_skills) ? app.usher_skills : [],
          usher_vcash_number: app.usher_vcash_number || '',
          usher_profile_photo_url: app.usher_profile_photo_url || null
        }))
        
        setApplications(processedApplications)
      } else {
        throw new Error(data.error || 'Failed to fetch applications')
      }
    } catch (error) {
      console.error("Failed to fetch applications:", error)
      setApplications([])
    } finally {
      setLoading(false)
    }
  }

  const handleApplicationAction = async (applicationId: number, status: "approved" | "rejected") => {
    try {
      const response = await fetch("/api/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, status }),
      })

      if (response.ok) {
        // Refresh the applications list
        fetchApplications()
      }
    } catch (error) {
      console.error("Failed to update application:", error)
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return language === "ar" ? "غير محدد" : "Not specified"
      
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return language === "ar" ? "تاريخ غير صحيح" : "Invalid date"
      }
      
      return date.toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch (error) {
      console.error("Date formatting error:", error)
      return language === "ar" ? "خطأ في التاريخ" : "Date error"
    }
  }

  const getStatusColor = (status: string, gigDateTime?: string, durationHours?: number) => {
    try {
      // Check if gig is old (end date has passed)
      let isOldGig = false
      if (gigDateTime && durationHours && !isNaN(durationHours)) {
        const startDate = new Date(gigDateTime)
        if (!isNaN(startDate.getTime())) {
          const endDate = new Date(startDate.getTime() + (durationHours * 60 * 60 * 1000))
          const now = new Date()
          isOldGig = endDate < now
        }
      }

      // Override status if gig is old
      const effectiveStatus = isOldGig ? 'old' : status

      switch (effectiveStatus) {
        case "pending":
          return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
        case "approved":
          return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
        case "rejected":
          return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
        case "old":
          return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
        default:
          return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
      }
    } catch (error) {
      console.error("Status color error:", error)
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  const getStatusText = (status: string, gigDateTime?: string, durationHours?: number) => {
    try {
      // Check if gig is old (end date has passed)
      let isOldGig = false
      if (gigDateTime && durationHours && !isNaN(durationHours)) {
        const startDate = new Date(gigDateTime)
        if (!isNaN(startDate.getTime())) {
          const endDate = new Date(startDate.getTime() + (durationHours * 60 * 60 * 1000))
          const now = new Date()
          isOldGig = endDate < now
        }
      }

      // Override status if gig is old
      const effectiveStatus = isOldGig ? 'old' : status

      switch (effectiveStatus) {
        case "pending":
          return language === "ar" ? "معلق" : "Pending"
        case "approved":
          return language === "ar" ? "مقبول" : "Approved"
        case "rejected":
          return language === "ar" ? "مرفوض" : "Rejected"
        case "old":
          return language === "ar" ? "وظيفة قديمة" : "Old Gig"
        default:
          return effectiveStatus || (language === "ar" ? "غير معروف" : "Unknown")
      }
    } catch (error) {
      console.error("Status text error:", error)
      return language === "ar" ? "خطأ" : "Error"
    }
  }

  const getFilterText = (filter: string) => {
    switch (filter) {
      case "active":
        return language === "ar" ? "نشطة" : "Active"
      case "pending":
        return language === "ar" ? "معلقة" : "Pending"
      case "approved":
        return language === "ar" ? "مقبولة" : "Approved"
      case "rejected":
        return language === "ar" ? "مرفوضة" : "Rejected"
      case "all":
        return language === "ar" ? "الكل" : "All"
      default:
        return filter
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <Link href="/dashboard/brand">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {language === "ar" ? "العودة" : "Back"}
                  </Button>
                </Link>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-card-foreground">
                    {language === "ar" ? "إدارة الطلبات" : "Manage Applications"}
                  </h1>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-4 sm:py-8">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-card-foreground">{language === "ar" ? "فلتر:" : "Filter:"}</span>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40 bg-background border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="active">{getFilterText("active")}</SelectItem>
                  <SelectItem value="pending">{getFilterText("pending")}</SelectItem>
                  <SelectItem value="approved">{getFilterText("approved")}</SelectItem>
                  <SelectItem value="rejected">{getFilterText("rejected")}</SelectItem>
                  <SelectItem value="all">{getFilterText("all")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" onClick={fetchApplications} disabled={loading} className="w-full sm:w-auto">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              {language === "ar" ? "تحديث" : "Refresh"}
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">{language === "ar" ? "جاري التحميل..." : "Loading..."}</p>
            </div>
          ) : applications.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">
                  {statusFilter === "active"
                    ? language === "ar"
                      ? "لا توجد طلبات نشطة حالياً"
                      : "No active applications at the moment"
                    : language === "ar"
                      ? `لا توجد طلبات ${getFilterText(statusFilter)} حالياً`
                      : `No ${getFilterText(statusFilter).toLowerCase()} applications at the moment`}
                </p>
                {statusFilter !== "active" && (
                  <Button variant="outline" className="mt-4" onClick={() => setStatusFilter("active")}>
                    {language === "ar" ? "عرض الطلبات النشطة" : "View Active Applications"}
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <Card className="card-hover animate-fade-in-up">
                  <CardContent className="p-4">
                    <div className="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {applications.filter((app) => app.status === "pending").length}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">{language === "ar" ? "طلبات معلقة" : "Pending Applications"}</p>
                  </CardContent>
                </Card>
                <Card className="card-hover animate-fade-in-up">
                  <CardContent className="p-4">
                    <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                      {applications.filter((app) => app.status === "approved").length}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {language === "ar" ? "طلبات مقبولة" : "Approved Applications"}
                    </p>
                  </CardContent>
                </Card>
                <Card className="card-hover animate-fade-in-up col-span-2 lg:col-span-1">
                  <CardContent className="p-4">
                    <div className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">
                      {applications.filter((app) => app.status === "rejected").length}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">{language === "ar" ? "طلبات مرفوضة" : "Rejected Applications"}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Gig Filter */}
              {uniqueGigs.length > 1 && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-card-foreground">{language === "ar" ? "الحدث:" : "Event:"}</span>
                  </div>
                  <Select value={gigFilter} onValueChange={setGigFilter}>
                    <SelectTrigger className="w-full sm:w-56 bg-background border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="all">{language === "ar" ? "كل الأحداث" : "All Events"}</SelectItem>
                      {uniqueGigs.map(gig => (
                        <SelectItem key={gig.id} value={String(gig.id)}>{gig.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Gig-grouped view (when no specific gig selected) */}
              {gigFilter === "all" ? (
                <div className="space-y-6">
                  {gigGroups.map((group) => {
                    const isExpanded = expandedGigs.has(group.id)
                    const displayApps = isExpanded ? group.applications : group.applications.slice(0, 3)
                    const pendingCount = group.applications.filter(a => a.status === "pending").length
                    return (
                      <Card key={group.id} className="bg-card border-border overflow-hidden">
                        {/* Gig header */}
                        <div className="border-b border-border/60 bg-muted/10 px-4 sm:px-5 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="font-bold text-sm sm:text-base text-card-foreground break-words">{group.title}</h3>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{group.location}</span>
                                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(group.datetime)}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge variant="outline" className="text-xs font-mono">
                                {group.applications.length} {language === "ar" ? "متقدم" : "applicants"}
                              </Badge>
                              {pendingCount > 0 && (
                                <Badge className="bg-yellow-100 text-yellow-800 text-xs font-mono">
                                  {pendingCount} {language === "ar" ? "معلق" : "pending"}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Usher list */}
                        <CardContent className="p-3 sm:p-4">
                          <div className="space-y-2">
                            {displayApps.map((app) => (
                              <button
                                key={app.id}
                                onClick={() => setSelectedApplication(app)}
                                className="flex items-center gap-3 w-full text-left p-3 rounded-xl border border-border/60 hover:border-primary/30 hover:bg-muted/20 transition-all"
                              >
                                {/* Photo */}
                                <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-xl shrink-0 border border-border/50 relative overflow-hidden bg-muted">
                                  <div className="w-full h-full flex items-center justify-center">
                                    <User className="h-5 w-5 text-muted-foreground/60" />
                                  </div>
                                  {app.usher_profile_photo_url && (
                                    <img
                                      src={app.usher_profile_photo_url}
                                      alt=""
                                      className="absolute inset-0 w-full h-full object-cover"
                                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                    />
                                  )}
                                </div>
                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-semibold text-sm sm:text-base truncate">{app.usher_name}</span>
                                    <Badge className={`shrink-0 text-[10px] font-mono ${getStatusColor(app.status, app.gig_datetime, app.gig_duration_hours)}`}>
                                      {getStatusText(app.status, app.gig_datetime, app.gig_duration_hours)}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <div className="flex items-center gap-0.5">
                                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                      <span className="text-xs text-muted-foreground">{app.usher_rating > 0 ? app.usher_rating.toFixed(1) : "0.0"}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground/50">|</span>
                                    <span className="text-xs text-muted-foreground">
                                      {app.usher_experience_years} {language === "ar" ? "سنوات خبرة" : "yrs exp"}
                                    </span>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>

                          {/* Expand / Collapse */}
                          {group.applications.length > 3 && (
                            <div className="mt-3 text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const next = new Set(expandedGigs)
                                  isExpanded ? next.delete(group.id) : next.add(group.id)
                                  setExpandedGigs(next)
                                }}
                                className="text-xs text-accent hover:text-accent/80 font-semibold"
                              >
                                {isExpanded
                                  ? (language === "ar" ? "إخفاء الباقي" : "Show Less")
                                  : (language === "ar" ? `عرض الكل (${group.applications.length})` : `View All (${group.applications.length})`)}
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                /* Per-application view when a specific gig is selected */
                <div className="space-y-3">
                  {filteredApps!.length === 0 ? (
                    <Card className="bg-card border-border">
                      <CardContent className="text-center py-8">
                        <p className="text-muted-foreground text-sm">{language === "ar" ? "لا توجد طلبات لهذا الحدث" : "No applications for this event"}</p>
                      </CardContent>
                    </Card>
                  ) : (
                    filteredApps!.map((app) => (
                      <button
                        key={app.id}
                        onClick={() => setSelectedApplication(app)}
                        className="flex items-center gap-3 w-full text-left p-4 rounded-xl border border-border/60 hover:border-primary/30 hover:bg-muted/20 transition-all animate-fade-in-up"
                      >
                                  {/* Photo */}
                                  <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-xl shrink-0 border border-border/50 relative overflow-hidden bg-muted">
                                    <div className="w-full h-full flex items-center justify-center">
                                      <User className="h-5 w-5 text-muted-foreground/60" />
                                    </div>
                                    {app.usher_profile_photo_url && (
                                      <img
                                        src={app.usher_profile_photo_url}
                                        alt=""
                                        className="absolute inset-0 w-full h-full object-cover"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                      />
                                    )}
                                  </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-sm sm:text-base truncate">{app.usher_name}</span>
                            <Badge className={`shrink-0 text-[10px] font-mono ${getStatusColor(app.status, app.gig_datetime, app.gig_duration_hours)}`}>
                              {getStatusText(app.status, app.gig_datetime, app.gig_duration_hours)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex items-center gap-0.5">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs text-muted-foreground">{app.usher_rating > 0 ? app.usher_rating.toFixed(1) : "0.0"}</span>
                            </div>
                            <span className="text-xs text-muted-foreground/50">|</span>
                            <span className="text-xs text-muted-foreground">{app.usher_experience_years} {language === "ar" ? "سنوات خبرة" : "yrs exp"}</span>
                          </div>
                          {app.usher_skills && app.usher_skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {app.usher_skills.slice(0, 3).map((s, j) => (
                                <Badge key={j} variant="outline" className="text-[10px] border-border text-muted-foreground">{s}</Badge>
                              ))}
                              {app.usher_skills.length > 3 && (
                                <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">+{app.usher_skills.length - 3}</Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Usher Detail Dialog */}
              <Dialog open={!!selectedApplication} onOpenChange={(open) => { if (!open) setSelectedApplication(null) }}>
                <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] p-0 overflow-hidden">
                  {selectedApplication && (
                    <div className="flex flex-col h-full max-h-[85vh]">
                      <div className="px-6 pt-6 pb-2">
                        <DialogHeader>
                          <DialogTitle className="text-sm sm:text-base">
                            {language === "ar" ? `ملف ${selectedApplication.usher_name}` : `${selectedApplication.usher_name}'s Profile`}
                          </DialogTitle>
                        </DialogHeader>
                      </div>
                      <div className="flex-1 overflow-y-auto px-6 pb-4">
                        <UsherHistory usherId={selectedApplication.usher_id} showInModal={true} />
                      </div>
                      {selectedApplication.status === "pending" && (
                        <div className="flex flex-col sm:flex-row gap-3 px-6 py-4 border-t border-border/50 bg-muted/10">
                          <Button
                            variant="outline"
                            onClick={() => { handleApplicationAction(selectedApplication.id, "rejected"); setSelectedApplication(null) }}
                            className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20 flex-1 h-11"
                          >
                            <X className="h-4 w-4 mr-2" />
                            {language === "ar" ? "رفض الطلب" : "Reject Application"}
                          </Button>
                          <Button
                            onClick={() => { handleApplicationAction(selectedApplication.id, "approved"); setSelectedApplication(null) }}
                            className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 flex-1 h-11"
                          >
                            <Check className="h-4 w-4 mr-2" />
                            {language === "ar" ? "قبول الطلب" : "Approve Application"}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
        </div>
      </ProtectedRoute>
  )
}
