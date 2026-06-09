"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import {
  MapPin, Clock, DollarSign, Users, Shirt, ArrowLeft,
  Briefcase, Calendar, ExternalLink, FileText, Map,
} from "lucide-react"

export default function GigDetailPage() {
  const { user } = useAuth()
  const { language, isRTL } = useLanguage()
  const params = useParams()
  const router = useRouter()
  const [gig, setGig] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    if (params.id) fetchGig()
  }, [params.id])

  const fetchGig = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/gigs/${params.id}${user?.id ? `?userId=${user.id}` : ""}`)
      if (!res.ok) {
        if (res.status === 404) setError(language === "ar" ? "الوظيفة غير موجودة" : "Gig not found")
        else setError(language === "ar" ? "فشل تحميل البيانات" : "Failed to load")
        return
      }
      const data = await res.json()
      setGig(data.gig)
    } catch {
      setError(language === "ar" ? "حدث خطأ" : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async () => {
    if (!user?.id || !gig) return
    try {
      setApplying(true)
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gigId: gig.id, usherId: user.id }),
      })
      const data = await res.json()
      if (data.success) {
        alert(language === "ar" ? "تم تقديم الطلب بنجاح!" : "Application submitted!")
        fetchGig()
      } else {
        alert(data.error || (language === "ar" ? "فشل التقديم" : "Failed to apply"))
      }
    } catch {
      alert(language === "ar" ? "حدث خطأ" : "An error occurred")
    } finally {
      setApplying(false)
    }
  }

  const formatDate = (d: string) => {
    if (!d) return ""
    return new Date(d).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", {
      year: "numeric", month: "long", day: "numeric",
    })
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: "bg-secondary/20 text-secondary",
      completed: "bg-accent/20 text-accent",
      cancelled: "bg-destructive/20 text-destructive",
    }
    const labels: Record<string, string> = {
      active: language === "ar" ? "نشط" : "Active",
      completed: language === "ar" ? "مكتمل" : "Completed",
      cancelled: language === "ar" ? "ملغي" : "Cancelled",
    }
    return (
      <Badge className={`text-[10px] font-mono font-semibold ${styles[status] || "bg-muted text-muted-foreground"}`}>
        {labels[status] || status}
      </Badge>
    )
  }

  const getMapEmbedUrl = (link: string | null | undefined, location: string | null | undefined) => {
    if (link) {
      try {
        const url = new URL(link)
        if (url.hostname.includes('google') && url.pathname.includes('/maps')) {
          const q = url.searchParams.get('q')
          if (q) return `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`
        }
      } catch {}
    }
    return location ? `https://www.google.com/maps?q=${encodeURIComponent(location)}&output=embed` : ""
  }

  const mapEmbedUrl = getMapEmbedUrl(gig?.location_link, gig?.location)
  const mapOpenUrl = gig?.location_link || (gig?.location ? `https://www.google.com/maps?q=${encodeURIComponent(gig.location)}` : "")

  const daysCount = gig?.start_date && gig?.end_date && gig.start_date !== gig.end_date
    ? Math.ceil((new Date(gig.end_date).getTime() - new Date(gig.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1
    : null

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="h-48 bg-muted rounded-xl" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-16">
            <Briefcase className="h-10 w-10 text-muted-foreground/30 mb-4" />
            <p className="text-sm font-semibold text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              {language === "ar" ? "رجوع" : "Go Back"}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5 p-4">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-foreground transition-colors font-mono"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {language === "ar" ? "رجوع" : "Back"}
      </button>

      {/* Hero */}
      <Card>
        <div className="h-1.5 w-full rounded-t-xl bg-gradient-to-r from-secondary via-accent to-primary" />
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">{gig.title}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">{gig.company_name || gig.brand_name}</p>
            </div>
            {getStatusBadge(gig.status)}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{gig.location}</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>
                {gig.start_date && gig.end_date
                  ? `${formatDate(gig.start_date)}${gig.start_time_24h ? ` ${gig.start_time_24h}` : ""} - ${formatDate(gig.end_date)}`
                  : gig.start_date_display
                    ? `${gig.start_date_display} ${gig.start_time_24h || ""}`
                    : `${formatDate(gig.start_datetime)}${gig.start_time_24h ? ` ${gig.start_time_24h}` : ""}`}
              </span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>
                {gig.duration_hours}h {language === "ar" ? "يومياً" : "daily"}
                {daysCount && <span className="text-xs text-muted-foreground ml-1">({daysCount} {language === "ar" ? "أيام" : "days"})</span>}
              </span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl">
              <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>
                {gig.pay_rate} {language === "ar" ? "ج.م/ساعة" : "EGP/hr"}
                {daysCount && (
                  <span className="text-xs text-muted-foreground ml-1">
                    ({(gig.pay_rate * gig.duration_hours * daysCount).toLocaleString()} {language === "ar" ? "ج.م إجمالي" : "EGP total"})
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl">
              <Users className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>
                {gig.approved_ushers || 0}/{gig.total_ushers_needed} {language === "ar" ? "مضيف" : "ushers"}
              </span>
            </div>
            {gig.dress_code && (
              <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl">
                <Shirt className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{language === "ar" ? "قواعد اللبس:" : "Dress Code:"} <strong>{gig.dress_code}</strong></span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      {gig.description && (
        <Card>
          <CardContent className="p-5">
            <h2 className="text-sm font-bold mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              {language === "ar" ? "الوصف" : "Description"}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{gig.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Skills */}
      {gig.skills_required && gig.skills_required.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <h2 className="text-sm font-bold mb-3">
              {language === "ar" ? "المهارات المطلوبة" : "Skills Required"}
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {gig.skills_required.map((s: string, i: number) => (
                <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Requirements */}
      {gig.additional_requirements && (
        <Card>
          <CardContent className="p-5">
            <h2 className="text-sm font-bold mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              {language === "ar" ? "متطلبات إضافية" : "Additional Requirements"}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{gig.additional_requirements}</p>
          </CardContent>
        </Card>
      )}

      {/* Apply */}
      {user?.id && gig && (
        <div className="sticky bottom-20 z-10">
          <Card>
            <CardContent className="p-4">
              {gig.approved_ushers >= gig.total_ushers_needed ? (
                <Button disabled className="w-full h-11 text-sm">
                  {language === "ar" ? "مكتمل" : "Full"}
                </Button>
              ) : gig.application_status === "approved" ? (
                <Button disabled variant="secondary" className="w-full h-11 text-sm">
                  {language === "ar" ? "مقبول" : "Approved"}
                </Button>
              ) : gig.application_status === "pending" ? (
                <Button disabled variant="secondary" className="w-full h-11 text-sm">
                  {language === "ar" ? "قيد المراجعة" : "Pending Review"}
                </Button>
              ) : (
                <Button onClick={handleApply} disabled={applying} className="w-full h-11 text-sm">
                  {applying
                    ? (language === "ar" ? "جاري التقديم..." : "Applying...")
                    : (language === "ar" ? "تقديم طلب" : "Apply Now")}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Map */}
      {mapEmbedUrl && (
        <Card>
          <CardContent className="p-0 overflow-hidden rounded-xl">
            <div className="relative">
              <iframe
                src={mapEmbedUrl}
                width="100%"
                height="280"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={gig.location}
                className="w-full"
              />
              <div className="absolute inset-0 pointer-events-none" />
            </div>
            <div className="p-4 flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-mono truncate max-w-[60%]">{gig.location}</p>
              <a href={mapOpenUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="default" size="sm" className="text-xs h-9 gap-1.5">
                  <Map className="h-3.5 w-3.5" />
                  {language === "ar" ? "عرض على الخريطة" : "Show on Map"}
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
