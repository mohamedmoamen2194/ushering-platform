"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import {
  User, Phone, Mail, Save, CheckCircle, AlertCircle, Camera,
  CreditCard, DollarSign, Calendar, Star, IdCard, Upload,
  ExternalLink, ArrowRight, X, Image
} from "lucide-react"
import Link from "next/link"

export default function UsherProfilePage() {
  const { user } = useAuth()
  const { language, isRTL } = useLanguage()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [stats, setStats] = useState({ totalEarnings: 0, completedGigs: 0, rating: 0 })
  const [profile, setProfile] = useState<any>(null)

  const [form, setForm] = useState({ name: "", email: "", phone: "" })

  // Upload state
  const [uploading, setUploading] = useState<"profile_photo" | "id_photo" | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [preview, setPreview] = useState<{ type: "profile_photo" | "id_photo"; url: string; file: File } | null>(null)

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || "", email: user.email || "", phone: user.phone || "" })
      fetchStats()
      fetchProfile()
    }
  }, [user])

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
    } catch (e) { /* silent */ }
  }

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/users/${user?.id}/profile`)
      const data = await res.json()
      if (data.success) setProfile(data.profile || {})
    } catch (e) { /* silent */ }
  }

  const pm = profile?.payment_method
  const paymentSet = profile?.payment_method_set || (pm && pm !== "{}" && pm !== "null")
  const hasPhoto = !!profile?.profile_photo_url
  const hasId = !!profile?.id_photo_url

  const missing: string[] = []
  if (!form.name) missing.push(language === "ar" ? "الاسم" : "Name")
  if (!form.email) missing.push(language === "ar" ? "البريد الإلكتروني" : "Email")
  if (!hasPhoto) missing.push(language === "ar" ? "الصورة الشخصية" : "Profile Photo")
  if (!hasId) missing.push(language === "ar" ? "صورة الهوية" : "ID Photo")
  if (!paymentSet) missing.push(language === "ar" ? "طريقة الدفع" : "Payment Method")

  const isComplete = missing.length === 0

  const handleSave = async () => {
    try {
      setSaving(true)
      const res = await fetch(`/api/users/${user?.id}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, phone: form.phone }),
      })
      const data = await res.json()
      if (data.success) { setSaved(true); setTimeout(() => setSaved(false), 3000) }
    } catch (e) { /* silent */ }
    finally { setSaving(false) }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "profile_photo" | "id_photo") => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreview({ type, url, file })
  }

  const confirmUpload = async () => {
    if (!preview) return
    const file = preview.file
    const type = preview.type
    const fd = new FormData()
    fd.append("photo", file)
    fd.append("userId", String(user?.id))
    fd.append("userRole", "usher")
    fd.append("photoType", type)

    setUploading(type)
    setUploadProgress(0)

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 15, 85))
    }, 200)

    try {
      const res = await fetch("/api/upload/photo", { method: "POST", body: fd })
      clearInterval(progressInterval)
      setUploadProgress(100)
      const data = await res.json()
      if (data.success) {
        setTimeout(() => {
          setPreview(null)
          setUploading(null)
          setUploadProgress(0)
          fetchProfile()
        }, 400)
      } else {
        setUploading(null)
        setUploadProgress(0)
      }
    } catch (e) {
      clearInterval(progressInterval)
      setUploading(null)
      setUploadProgress(0)
    }
  }

  const cancelPreview = () => {
    if (preview) URL.revokeObjectURL(preview.url)
    setPreview(null)
  }

  const t = (en: string, ar: string) => language === "ar" ? ar : en

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight">
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {t("My Profile", "ملفي الشخصي")}
          </span>
        </h1>
        <p className="text-xs text-muted-foreground font-light mt-0.5">
          {t("Personal info & statistics", "المعلومات الشخصية والإحصائيات")}
        </p>
      </div>

      {/* Completion Status */}
      <div className="animate-fade-in-up" style={{ animationDelay: "0.08s" }}>
        {isComplete ? (
          <div className="flex items-center gap-3 rounded-xl border border-secondary/30 bg-secondary/5 p-4">
            <CheckCircle className="h-5 w-5 text-secondary shrink-0" />
            <p className="text-sm font-bold text-secondary">{t("All Set", "مكتمل")}</p>
          </div>
        ) : (
          <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-950/20 to-amber-900/10 p-4 space-y-2">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5 shrink-0 animate-pulse" />
              <div>
                <p className="text-sm font-bold text-amber-300">
                  {t(`${missing.length} items missing`, `${missing.length} عناصر ناقصة`)}
                </p>
                <p className="text-xs text-amber-400/70 font-light">{t("Complete these items:", "أكمل هذه العناصر:")}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 pl-8">
              {missing.map((f) => (
                <span key={f} className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-amber-950/30 text-amber-300 border border-amber-500/20">{f}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2.5 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
        {[
          { icon: DollarSign, value: `${stats.totalEarnings.toLocaleString()}`, suffix: " EGP", label: t("Earnings", "الأرباح"), color: "text-primary" },
          { icon: Calendar, value: String(stats.completedGigs), suffix: "", label: t("Gigs", "الوظائف"), color: "text-secondary" },
          { icon: Star, value: stats.rating > 0 ? stats.rating.toFixed(1) : "0.0", suffix: "", label: t("Rating", "التقييم"), color: "text-accent" },
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

      {/* Photo Upload Preview Card */}
      {preview && (
        <Card className="animate-fade-in-up border-primary/30" style={{ animationDelay: "0s" }}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-primary/30 shrink-0">
                <img src={preview.url} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{t("Confirm Upload", "تأكيد الرفع")}</p>
                <p className="text-xs text-muted-foreground/70 font-light mt-0.5 line-clamp-2">{preview.file.name}</p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" onClick={confirmUpload} disabled={uploading === preview.type} className="text-xs">
                    {uploading === preview.type ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary-foreground mr-1.5" />
                        {t("Uploading...", "جاري الرفع...")}
                      </>
                    ) : (
                      <>
                        <Upload className="h-3 w-3 mr-1.5" />
                        {t("Confirm", "تأكيد")}
                      </>
                    )}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={cancelPreview} disabled={uploading === preview.type} className="text-xs">
                    <X className="h-3 w-3 mr-1.5" />
                    {t("Cancel", "إلغاء")}
                  </Button>
                </div>
                {uploading === preview.type && (
                  <div className="mt-3 h-1 rounded-full bg-muted/50 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photo & ID Upload */}
      <div className="grid grid-cols-2 gap-3 animate-fade-in-up" style={{ animationDelay: "0.12s" }}>
        <Card className={!hasPhoto ? "border-dashed border-amber-500/30" : ""}>
          <CardContent className="p-4 flex flex-col items-center gap-2">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden border-2 ${hasPhoto ? "border-secondary/50" : "border-dashed border-muted"}`}>
              {hasPhoto ? (
                <img src={profile.profile_photo_url || "/placeholder.svg"} alt="Profile" className="w-full h-full object-cover" style={{ cursor: "pointer" }} onClick={() => window.open(profile.profile_photo_url, "_blank")} />
              ) : (
                <Camera className="h-8 w-8 text-muted-foreground/40" />
              )}
            </div>
            <p className="text-xs font-semibold">{t("Profile Photo", "الصورة الشخصية")}</p>
            {hasPhoto ? (
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="text-[10px] h-7" onClick={() => window.open(profile.profile_photo_url, "_blank")}>
                  <ExternalLink className="h-3 w-3 mr-1" />{t("View", "عرض")}
                </Button>
                <label className="text-[10px] font-mono font-semibold cursor-pointer text-accent hover:underline px-2 py-1">
                  {t("Change", "تغيير")}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, "profile_photo")} />
                </label>
              </div>
            ) : (
              <label className="text-[10px] font-mono font-semibold cursor-pointer text-primary hover:underline flex items-center gap-1">
                <Image className="h-3 w-3" />{t("Upload photo", "رفع صورة")}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, "profile_photo")} />
              </label>
            )}
          </CardContent>
        </Card>
        <Card className={!hasId ? "border-dashed border-amber-500/30" : ""}>
          <CardContent className="p-4 flex flex-col items-center gap-2">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden border-2 ${hasId ? "border-accent/50" : "border-dashed border-muted"}`}>
              {hasId ? (
                <img src={profile.id_photo_url || "/placeholder.svg"} alt="ID" className="w-full h-full object-cover" onClick={() => window.open(profile.id_photo_url, "_blank")} style={{ cursor: "pointer" }} />
              ) : (
                <IdCard className="h-8 w-8 text-muted-foreground/40" />
              )}
            </div>
            <p className="text-xs font-semibold">{t("ID Photo", "صورة الهوية")}</p>
            {hasId ? (
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="text-[10px] h-7" onClick={() => window.open(profile.id_photo_url, "_blank")}>
                  <ExternalLink className="h-3 w-3 mr-1" />{t("View", "عرض")}
                </Button>
                <label className="text-[10px] font-mono font-semibold cursor-pointer text-accent hover:underline px-2 py-1">
                  {t("Change", "تغيير")}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, "id_photo")} />
                </label>
              </div>
            ) : (
              <label className="text-[10px] font-mono font-semibold cursor-pointer text-primary hover:underline flex items-center gap-1">
                <Image className="h-3 w-3" />{t("Upload ID", "رفع الهوية")}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, "id_photo")} />
              </label>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Method Status */}
      <Card className={`animate-fade-in-up ${!paymentSet ? "border-dashed border-amber-500/30" : ""}`} style={{ animationDelay: "0.14s" }}>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${paymentSet ? "bg-secondary/20" : "bg-amber-950/30"}`}>
              <CreditCard className={`h-5 w-5 ${paymentSet ? "text-secondary" : "text-amber-400"}`} />
            </div>
            <div>
              <p className="text-sm font-semibold">{t("Payment Method", "طريقة الدفع")}</p>
              <p className="text-xs text-muted-foreground font-light">
                {paymentSet ? t("Set up", "تم الإعداد") : t("Not set up", "لم يتم الإعداد")}
              </p>
            </div>
          </div>
          <Link href="/dashboard/usher/payment">
            <Button variant="outline" size="sm" className="text-xs">
              {paymentSet ? t("Edit", "تعديل") : t("Set Up", "إعداد")}
              <ArrowRight className={`h-3 w-3 ${isRTL ? "mr-1 rotate-180" : "ml-1"}`} />
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Separator className="animate-fade-in-up" style={{ animationDelay: "0.16s" }} />

      {/* Personal Info Form */}
      <Card className="animate-fade-in-up" style={{ animationDelay: "0.18s" }}>
        <CardHeader>
          <CardTitle className="text-sm font-mono font-semibold text-muted-foreground/60 tracking-wider uppercase flex items-center gap-2">
            <User className="h-4 w-4" />{t("Basic Info", "المعلومات الأساسية")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs font-mono font-semibold text-muted-foreground/80">{t("Full Name", "الاسم الكامل")}</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-muted/30 border-muted mt-1.5" />
          </div>
          <div>
            <Label className="text-xs font-mono font-semibold text-muted-foreground/80">{t("Email", "البريد الإلكتروني")}</Label>
            <div className="relative mt-1.5">
              <Mail className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50`} />
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={`bg-muted/30 border-muted ${isRTL ? "pr-10" : "pl-10"}`} />
            </div>
          </div>
          <div>
            <Label className="text-xs font-mono font-semibold text-muted-foreground/80">{t("Phone", "رقم الهاتف")}</Label>
            <div className="relative mt-1.5">
              <Phone className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50`} />
              <Input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={`bg-muted/30 border-muted font-mono text-sm ${isRTL ? "pr-10" : "pl-10"}`} />
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" /> : saved ? <CheckCircle className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            {saved ? t("Saved!", "تم الحفظ!") : t("Save", "حفظ")}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
