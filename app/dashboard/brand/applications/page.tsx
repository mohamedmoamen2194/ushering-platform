"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LanguageSwitcher } from "@/components/language-switcher"
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
  usher_name: string
  usher_phone: string
  usher_email: string
  usher_rating: number
  usher_experience_years: number
  usher_skills: string[]
  usher_vcash_number: string
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
      const data = await response.json()
      setApplications(data.applications || [])
    } catch (error) {
      console.error("Failed to fetch applications:", error)
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

      const data = await response.json()

      if (data.success) {
        // If we're not showing rejected applications and this was rejected, remove it from the list
        if (status === "rejected" && statusFilter === "active") {
          setApplications((prev) => prev.filter((app) => app.id !== applicationId))
        } else {
          // Otherwise update the status
          setApplications((prev) => prev.map((app) => (app.id === applicationId ? { ...app, status } : app)))
        }

        alert(
          status === "approved"
            ? language === "ar"
              ? "تم قبول الطلب بنجاح!"
              : "Application approved successfully!"
            : language === "ar"
              ? "تم رفض الطلب"
              : "Application rejected",
        )
      } else {
        alert(data.error || (language === "ar" ? "فشل في تحديث الطلب" : "Failed to update application"))
      }
    } catch (error) {
      console.error("Failed to update application:", error)
      alert(language === "ar" ? "حدث خطأ في تحديث الطلب" : "Error updating application")
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return language === "ar" ? "قيد المراجعة" : "Pending"
      case "approved":
        return language === "ar" ? "مقبول" : "Approved"
      case "rejected":
        return language === "ar" ? "مرفوض" : "Rejected"
      default:
        return status
    }
  }

  const getFilterText = (filter: string) => {
    switch (filter) {
      case "active":
        return language === "ar" ? "النشطة" : "Active"
      case "pending":
        return language === "ar" ? "قيد المراجعة" : "Pending"
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <ProtectedRoute requiredRole="brand">
      <div className={`min-h-screen bg-gray-50 ${isRTL ? "font-arabic" : ""}`} dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/brand">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {language === "ar" ? "العودة" : "Back"}
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {language === "ar" ? "إدارة الطلبات" : "Manage Applications"}
                </h1>
                <p className="text-sm text-gray-600">
                  {language === "ar" ? "مراجعة وإدارة طلبات المضيفين" : "Review and manage usher applications"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
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
        {/* Filters */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">{language === "ar" ? "فلتر:" : "Filter:"}</span>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">{getFilterText("active")}</SelectItem>
                <SelectItem value="pending">{getFilterText("pending")}</SelectItem>
                <SelectItem value="approved">{getFilterText("approved")}</SelectItem>
                <SelectItem value="rejected">{getFilterText("rejected")}</SelectItem>
                <SelectItem value="all">{getFilterText("all")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={fetchApplications} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            {language === "ar" ? "تحديث" : "Refresh"}
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>{language === "ar" ? "جاري التحميل..." : "Loading..."}</p>
          </div>
        ) : applications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-yellow-600">
                    {applications.filter((app) => app.status === "pending").length}
                  </div>
                  <p className="text-sm text-gray-600">{language === "ar" ? "طلبات معلقة" : "Pending Applications"}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {applications.filter((app) => app.status === "approved").length}
                  </div>
                  <p className="text-sm text-gray-600">
                    {language === "ar" ? "طلبات مقبولة" : "Approved Applications"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-red-600">
                    {applications.filter((app) => app.status === "rejected").length}
                  </div>
                  <p className="text-sm text-gray-600">
                    {language === "ar" ? "طلبات مرفوضة" : "Rejected Applications"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Applications List */}
            <div className="space-y-4">
              {applications.map((application) => (
                <Card key={application.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{application.gig_title}</CardTitle>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {application.gig_location}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(application.gig_datetime)}
                          </div>
                        </div>
                      </div>
                      <Badge className={getStatusColor(application.status)}>{getStatusText(application.status)}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{application.usher_name}</h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              {application.usher_rating > 0 ? application.usher_rating.toFixed(1) : "0.0"}
                            </div>
                            <span>
                              {application.usher_experience_years}{" "}
                              {language === "ar" ? "سنوات خبرة" : "years experience"}
                            </span>
                          </div>

                          {/* Contact Information */}
                          {application.status === "approved" && (
                            <div className="bg-green-50 p-3 rounded-lg mb-3">
                              <h5 className="font-medium text-green-800 mb-2">
                                {language === "ar" ? "معلومات الاتصال" : "Contact Information"}
                              </h5>
                              <div className="space-y-1 text-sm">
                                <div className="flex items-center gap-2 text-green-700">
                                  <Phone className="h-4 w-4" />
                                  <span>{application.usher_phone}</span>
                                </div>
                                {application.usher_email && (
                                  <div className="flex items-center gap-2 text-green-700">
                                    <Mail className="h-4 w-4" />
                                    <span>{application.usher_email}</span>
                                  </div>
                                )}
                                {application.usher_vcash_number && (
                                  <div className="text-green-700">
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
                              {application.usher_skills.map((skill, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {application.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApplicationAction(application.id, "rejected")}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <X className="h-4 w-4 mr-1" />
                            {language === "ar" ? "رفض" : "Reject"}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApplicationAction(application.id, "approved")}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            {language === "ar" ? "قبول" : "Approve"}
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 text-xs text-gray-500">
                      <div className="flex justify-between">
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
  )
}
