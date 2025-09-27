"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { LanguageSwitcher } from "@/components/language-switcher"
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
  LogOut,
  Bell,
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
import { ErrorBoundary } from "@/components/error-boundary"

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
  const { language, isRTL } = useLanguage()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("active") // 'active', 'pending', 'approved', 'rejected', 'all'
  const { t } = useTranslation(language)

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
    <ErrorBoundary>
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
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button variant="ghost" size="sm">
                  <Bell className="h-4 w-4" />
                </Button>
                <div className="hidden sm:block">
                  <LanguageSwitcher />
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">{language === "ar" ? "خروج" : "Logout"}</span>
                </Button>
              </div>
            </div>
            {/* Mobile Language Switcher */}
            <div className="block sm:hidden mt-2">
              <LanguageSwitcher />
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {applications.filter((app) => app.status === "pending").length}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">{language === "ar" ? "طلبات معلقة" : "Pending Applications"}</p>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                      {applications.filter((app) => app.status === "approved").length}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {language === "ar" ? "طلبات مقبولة" : "Approved Applications"}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border sm:col-span-2 lg:col-span-1">
                  <CardContent className="p-4">
                    <div className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">
                      {applications.filter((app) => app.status === "rejected").length}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">{language === "ar" ? "طلبات مرفوضة" : "Rejected Applications"}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Applications List */}
              <div className="space-y-4">
                {applications.map((application) => (
                  <Card key={application.id} className="bg-card border-border">
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base sm:text-lg text-card-foreground break-words">{application.gig_title}</CardTitle>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground mt-2">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{application.gig_location}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 flex-shrink-0" />
                              <span>{formatDate(application.gig_datetime)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <Badge className={getStatusColor(application.status, application.gig_datetime, application.gig_duration_hours)}>
                            {/* Add clock icon for old gigs */}
                            {(() => {
                              const startDate = new Date(application.gig_datetime)
                              const endDate = new Date(startDate.getTime() + (application.gig_duration_hours * 60 * 60 * 1000))
                              const isOldGig = endDate < new Date()
                              return isOldGig ? (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span className="hidden sm:inline">{getStatusText(application.status, application.gig_datetime, application.gig_duration_hours)}</span>
                                </div>
                              ) : (
                                <span className="text-xs sm:text-sm">{getStatusText(application.status, application.gig_datetime, application.gig_duration_hours)}</span>
                              )
                            })()}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="flex items-start gap-3 sm:gap-4 w-full">
                          <div className="relative flex-shrink-0">
                            {application.usher_profile_photo_url ? (
                              <img
                                src={application.usher_profile_photo_url}
                                alt={application.usher_name}
                                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-primary/20"
                              />
                            ) : (
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                <User className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                              <h4 className="font-medium text-card-foreground truncate">{application.usher_name}</h4>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                                    <History className="h-4 w-4 mr-2" />
                                    <span className="hidden sm:inline">{language === "ar" ? "عرض التاريخ" : "View History"}</span>
                                    <span className="sm:hidden">{language === "ar" ? "التاريخ" : "History"}</span>
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle className="text-sm sm:text-base">
                                      {language === "ar" ? `تاريخ عمل ${application.usher_name}` : `${application.usher_name}'s Work History`}
                                    </DialogTitle>
                                  </DialogHeader>
                                  <UsherHistory usherId={application.usher_id} showInModal={true} />
                                </DialogContent>
                              </Dialog>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground mb-2">
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span>{application.usher_rating > 0 ? parseFloat(application.usher_rating).toFixed(1) : "0.0"}</span>
                              </div>
                              <span className="text-xs sm:text-sm">
                                {application.usher_experience_years}{" "}
                                {language === "ar" ? "سنوات خبرة" : "years experience"}
                              </span>
                            </div>

                            {/* Contact Information */}
                            {application.status === "approved" && (
                              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg mb-3">
                                <h5 className="font-medium text-green-800 dark:text-green-400 mb-2">
                                  {language === "ar" ? "معلومات الاتصال" : "Contact Information"}
                                </h5>
                                <div className="space-y-1 text-sm">
                                  <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                                    <Phone className="h-4 w-4" />
                                    <span>{application.usher_phone}</span>
                                  </div>
                                  {application.usher_email && (
                                    <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                                      <Mail className="h-4 w-4" />
                                      <span>{application.usher_email}</span>
                                    </div>
                                  )}
                                  {application.usher_vcash_number && (
                                    <div className="text-green-700 dark:text-green-300">
                                      <span className="font-medium">
                                        {language === "ar" ? "فودافون كاش:" : "Vodafone Cash:"}{" "}
                                      </span>
                                      {application.usher_vcash_number}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {application.usher_skills && application.usher_skills.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {application.usher_skills.slice(0, 3).map((skill, index) => (
                                  <Badge key={index} variant="outline" className="text-xs border-border text-muted-foreground">
                                    {skill}
                                  </Badge>
                                ))}
                                {application.usher_skills.length > 3 && (
                                  <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                                    +{application.usher_skills.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {application.status === "pending" && (
                          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApplicationAction(application.id, "rejected")}
                              className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20 w-full sm:w-auto"
                            >
                              <X className="h-4 w-4 mr-1" />
                              {language === "ar" ? "رفض" : "Reject"}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleApplicationAction(application.id, "approved")}
                              className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 w-full sm:w-auto"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              {language === "ar" ? "قبول" : "Approve"}
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 text-xs text-muted-foreground">
                        <div className="flex flex-col sm:flex-row justify-between gap-1">
                          <span>
                            {language === "ar" ? "تاريخ التقديم:" : "Applied on:"} {formatDate(application.applied_at)}
                          </span>
                          {application.reviewed_at && (
                            <span>
                              {language === "ar" ? "تاريخ المراجعة:" : "Reviewed on:"}{" "}
                              {formatDate(application.reviewed_at)}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
        </div>
      </ProtectedRoute>
    </ErrorBoundary>
  )
}
