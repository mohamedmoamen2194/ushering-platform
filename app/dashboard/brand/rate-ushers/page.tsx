"use client"

export const dynamic = 'force-dynamic'
export const revalidate = 0

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Star, ArrowLeft, RefreshCw } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { ProtectedRoute } from "@/components/protected-route"
import Link from "next/link"

interface RateableUsher {
  usherId: number
  usherName: string
  attendanceStatus: string | null
  checkInTime: string | null
  checkOutTime: string | null
  hoursWorked: number | null
  payoutAmount: number | null
  existingRating: number | null
  existingFeedback: string | null
}

export default function RateUshersPage() {
  const params = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const { language, isRTL } = useLanguage()

  const gigId = params.get("gigId") || ""

  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [ushers, setUshers] = useState<RateableUsher[]>([])
  const [ratings, setRatings] = useState<Record<number, { rating: number; feedback: string }>>({})
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const t = (en: string, ar: string) => (language === "ar" ? ar : en)

  const isReady = useMemo(() => Boolean(gigId && user?.id), [gigId, user?.id])

  const fetchUshers = async () => {
    if (!isReady) return
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)
      const res = await fetch(`/api/gigs/${gigId}/rate-ushers?brandId=${user?.id}`)
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data?.error || t("Failed to load ushers", "فشل تحميل المضيفين"))
        setUshers([])
        return
      }
      setUshers(data.ushers || [])
      // seed ratings with existing values
      const seed: Record<number, { rating: number; feedback: string }> = {}
      ;(data.ushers || []).forEach((u: RateableUsher) => {
        seed[u.usherId] = {
          rating: u.existingRating || 0,
          feedback: u.existingFeedback || "",
        }
      })
      setRatings(seed)
    } catch (e) {
      setError(t("Unexpected error", "حدث خطأ غير متوقع"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUshers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady])

  const submitRatings = async () => {
    if (!isReady) return
    try {
      setSubmitting(true)
      setError(null)
      setSuccess(null)

      const payload = Object.entries(ratings)
        .filter(([usherId, r]) => r.rating && r.rating >= 1 && r.rating <= 5)
        .map(([usherId, r]) => ({ usherId: Number(usherId), rating: r.rating, feedback: r.feedback || null }))

      if (payload.length === 0) {
        setError(t("Please provide at least one rating", "يرجى إدخال تقييم واحد على الأقل"))
        return
      }

      const res = await fetch(`/api/gigs/${gigId}/rate-ushers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId: user?.id, ratings: payload })
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data?.error || t("Failed to submit ratings", "فشل إرسال التقييمات"))
        return
      }
      setSuccess(t("Ratings saved", "تم حفظ التقييمات"))
      fetchUshers()
    } catch (e) {
      setError(t("Unexpected error", "حدث خطأ غير متوقع"))
    } finally {
      setSubmitting(false)
    }
  }

  const setUsherRating = (usherId: number, value: number) => {
    setRatings(prev => ({
      ...prev,
      [usherId]: { rating: value, feedback: prev[usherId]?.feedback || "" }
    }))
  }

  const setUsherFeedback = (usherId: number, value: string) => {
    setRatings(prev => ({
      ...prev,
      [usherId]: { rating: prev[usherId]?.rating || 0, feedback: value }
    }))
  }

  return (
    <ProtectedRoute requiredRole="brand">
      <div className={`min-h-screen bg-background ${isRTL ? "font-arabic" : ""}`} dir={isRTL ? "rtl" : "ltr"}>
        <div className="container mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-6 max-w-4xl">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl sm:text-2xl font-bold text-card-foreground">{t("Rate Ushers", "تقييم المضيفين")}</h1>
            <Link href="/dashboard/brand" className="inline-flex items-center text-sm">
              <ArrowLeft className="h-4 w-4 mr-1" /> {t("Back", "رجوع")}
            </Link>
          </div>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">{t("Gig Ushers", "مضيفو الوظيفة")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">{error}</div>
              )}
              {success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">{success}</div>
              )}

              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : ushers.length === 0 ? (
                <div className="text-sm text-muted-foreground py-6">{t("No ushers to rate for this gig", "لا يوجد مضيفون لتقييمهم لهذه الوظيفة")}</div>
              ) : (
                <div className="space-y-4">
                  {ushers.map(u => (
                    <div key={u.usherId} className="rounded-lg border border-border p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <div className="font-semibold text-card-foreground">{u.usherName}</div>
                          <div className="text-xs text-muted-foreground">
                            {u.attendanceStatus ? t("Attendance:", "الحضور:") + " " + u.attendanceStatus : t("Attendance:", "الحضور:") + " N/A"}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {[1,2,3,4,5].map(n => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => setUsherRating(u.usherId, n)}
                              className={`p-1 rounded ${ (ratings[u.usherId]?.rating || 0) >= n ? "text-yellow-500" : "text-muted-foreground"}`}
                              aria-label={`rate-${n}`}
                            >
                              <Star className="h-5 w-5" fill={(ratings[u.usherId]?.rating || 0) >= n ? "currentColor" : "none"} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="mt-3">
                        <Textarea
                          value={ratings[u.usherId]?.feedback || ""}
                          onChange={(e) => setUsherFeedback(u.usherId, e.target.value)}
                          placeholder={t("Optional feedback (visible to admin)", "ملاحظات اختيارية (مرئية للمشرف)")}
                          className="bg-background border-border text-foreground"
                        />
                      </div>
                      {u.existingRating ? (
                        <div className="mt-2 text-xs text-muted-foreground">
                          {t("Existing:", "الحالي:")} {u.existingRating}★{u.existingFeedback ? ` — ${u.existingFeedback}` : ""}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={fetchUshers} disabled={loading || submitting}>
                  <RefreshCw className={`${loading ? "animate-spin" : ""} h-4 w-4 mr-2`} /> {t("Refresh", "تحديث")}
                </Button>
                <Button onClick={submitRatings} disabled={submitting || loading || ushers.length === 0}>
                  {t("Save Ratings", "حفظ التقييمات")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
} 