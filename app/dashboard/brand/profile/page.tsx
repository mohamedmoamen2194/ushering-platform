"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import {
  User, Phone, Mail, Save, CheckCircle, AlertCircle, Building,
  Globe, FileText, Wallet, Camera, ExternalLink, Upload, ArrowRight,
  Briefcase
} from "lucide-react"
import Link from "next/link"

export default function BrandProfilePage() {
  const { user } = useAuth()
  const { language, isRTL } = useLanguage()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [brandProfile, setBrandProfile] = useState<any>(null)
  const [logo, setLogo] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    company_name: "", company_description: "", company_website: "",
    industry: "", tax_id: "", contact_person: "",
  })

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev, name: user.name || "", email: user.email || "", phone: user.phone || "",
      }))
      fetchBrandProfile()
    }
  }, [user])

  const fetchBrandProfile = async () => {
    try {
      const res = await fetch(`/api/users/${user?.id}/profile`)
      const data = await res.json()
      if (data.success && data.profile) {
        const p = data.profile
        setBrandProfile(p)
        setLogo(p.logo_url || null)
        setForm((prev) => ({
          ...prev,
          company_name: p.company_name || "",
          company_description: p.company_description || "",
          company_website: p.company_website || "",
          industry: p.industry || "",
          tax_id: p.tax_id || "",
          contact_person: p.contact_person || "",
        }))
      }
    } catch (e) { console.error(e) }
  }

  const missing: string[] = []
  if (!form.company_name) missing.push(language === "ar" ? "اسم الشركة" : "Company Name")
  if (!form.email) missing.push(language === "ar" ? "البريد الإلكتروني" : "Email")
  if (!form.phone) missing.push(language === "ar" ? "رقم الهاتف" : "Phone")
  if (!logo) missing.push(language === "ar" ? "شعار الشركة" : "Company Logo")

  const isComplete = missing.length === 0

  const handleSave = async () => {
    try {
      setSaving(true)
      const res = await fetch(`/api/users/${user?.id}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) { setSaved(true); setTimeout(() => setSaved(false), 3000) }
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const uploadLogo = async (file: File) => {
    const fd = new FormData()
    fd.append("photo", file)
    fd.append("userId", String(user?.id))
    fd.append("userRole", "brand")
    fd.append("photoType", "profile_photo")
    try {
      const res = await fetch("/api/upload/photo", { method: "POST", body: fd })
      const data = await res.json()
      if (data.success) { setLogo(data.photoUrl); fetchBrandProfile(); alert(data.message) }
      else alert(data.error)
    } catch (e) { console.error(e) }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight">
          <span className="bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
            {language === "ar" ? "الملف الشخصي للشركة" : "Company Profile"}
          </span>
        </h1>
        <p className="text-xs text-muted-foreground font-light mt-0.5">
          {language === "ar" ? "بيانات التسجيل ومعلومات الشركة" : "Registration info & company details"}
        </p>
      </div>

      {/* Completion */}
      <div className="animate-fade-in-up" style={{ animationDelay: "0.08s" }}>
        {isComplete ? (
          <div className="flex items-center gap-3 rounded-xl border border-secondary/30 bg-secondary/5 p-4">
            <CheckCircle className="h-5 w-5 text-secondary shrink-0" />
            <p className="text-sm font-bold text-secondary">{language === "ar" ? "✅ مكتمل بالكامل" : "✅ All Complete"}</p>
          </div>
        ) : (
          <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-950/20 to-amber-900/10 p-4 space-y-2">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5 shrink-0 animate-pulse" />
              <div>
                <p className="text-sm font-bold text-amber-300">{language === "ar" ? `⚠️ ${missing.length} عناصر ناقصة` : `⚠️ ${missing.length} missing`}</p>
                <p className="text-xs text-amber-400/70 font-light">{language === "ar" ? "أكمل هذه:" : "Complete these:"}</p>
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

      {/* Logo Upload */}
      <Card className={`animate-fade-in-up ${!logo ? "border-dashed border-amber-500/30" : ""}`} style={{ animationDelay: "0.1s" }}>
        <CardContent className="p-4 flex items-center gap-4">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden border-2 shrink-0 ${logo ? "border-secondary/50" : "border-dashed border-muted"}`}>
            {logo ? (
              <img src={logo || "/placeholder.svg"} alt="Logo" className="w-full h-full object-cover" onClick={() => window.open(logo, "_blank")} style={{ cursor: "pointer" }} />
            ) : (
              <Building className="h-8 w-8 text-muted-foreground/40" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">{language === "ar" ? "شعار الشركة" : "Company Logo"}</p>
            <p className="text-xs text-muted-foreground font-light">{language === "ar" ? "يستخدم لعرض وظائفك" : "Displayed on your gig listings"}</p>
            <div className="flex gap-2 mt-2">
              {logo ? (
                <>
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => window.open(logo, "_blank")}>
                    <ExternalLink className="h-3 w-3 mr-1" />{language === "ar" ? "عرض" : "View"}
                  </Button>
                  <label className="text-xs font-mono font-semibold cursor-pointer text-accent hover:underline px-2 py-1">
                    {language === "ar" ? "تغيير" : "Change"}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogo(f) }} />
                  </label>
                </>
              ) : (
                <label className="text-xs font-mono font-semibold cursor-pointer text-primary hover:underline flex items-center gap-1">
                  <Upload className="h-3 w-3" />{language === "ar" ? "رفع الشعار" : "Upload logo"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogo(f) }} />
                </label>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wallet Link */}
      <Card className="animate-fade-in-up border-secondary/20" style={{ animationDelay: "0.12s" }}>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-sm font-semibold">{language === "ar" ? "المحفظة" : "Wallet"}</p>
              <p className="text-xs text-muted-foreground font-light">{language === "ar" ? "الرصيد والمعاملات" : "Balance & transactions"}</p>
            </div>
          </div>
          <Link href="/dashboard/brand/balance">
            <Button variant="outline" size="sm" className="text-xs">
              {language === "ar" ? "فتح" : "Open"}
              <ArrowRight className={`h-3 w-3 ${isRTL ? "mr-1 rotate-180" : "ml-1"}`} />
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Separator className="animate-fade-in-up" style={{ animationDelay: "0.14s" }} />

      {/* Company Info Form */}
      <Card className="animate-fade-in-up" style={{ animationDelay: "0.16s" }}>
        <CardHeader>
          <CardTitle className="text-sm font-mono font-semibold text-muted-foreground/60 tracking-wider uppercase flex items-center gap-2">
            <Building className="h-4 w-4" />{language === "ar" ? "بيانات التسجيل" : "Registration Info"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-mono font-semibold text-muted-foreground/80">{language === "ar" ? "اسم الشركة" : "Company Name"} *</Label>
              <Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} className="bg-muted/30 border-muted mt-1.5" />
            </div>
            <div>
              <Label className="text-xs font-mono font-semibold text-muted-foreground/80">{language === "ar" ? "المجال" : "Industry"}</Label>
              <Input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} className="bg-muted/30 border-muted mt-1.5" placeholder={language === "ar" ? "مثال: خدمات، تقنية" : "e.g., Services, Tech"} />
            </div>
          </div>
          <div>
            <Label className="text-xs font-mono font-semibold text-muted-foreground/80">{language === "ar" ? "وصف الشركة" : "Company Description"}</Label>
            <Textarea value={form.company_description} onChange={(e) => setForm({ ...form, company_description: e.target.value })} className="bg-muted/30 border-muted mt-1.5" rows={3} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-mono font-semibold text-muted-foreground/80">{language === "ar" ? "الموقع الإلكتروني" : "Website"}</Label>
              <div className="relative mt-1.5">
                <Globe className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50`} />
                <Input value={form.company_website} onChange={(e) => setForm({ ...form, company_website: e.target.value })} className={`bg-muted/30 border-muted ${isRTL ? "pr-10" : "pl-10"}`} placeholder="https://" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-mono font-semibold text-muted-foreground/80">{language === "ar" ? "الرقم الضريبي" : "Tax ID"}</Label>
              <Input value={form.tax_id} onChange={(e) => setForm({ ...form, tax_id: e.target.value })} className="bg-muted/30 border-muted mt-1.5 font-mono" />
            </div>
          </div>
          <div>
            <Label className="text-xs font-mono font-semibold text-muted-foreground/80">{language === "ar" ? "جهة الاتصال" : "Contact Person"}</Label>
            <Input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} className="bg-muted/30 border-muted mt-1.5" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/50">
            <div>
              <Label className="text-xs font-mono font-semibold text-muted-foreground/80">{language === "ar" ? "البريد الإلكتروني" : "Email"} *</Label>
              <div className="relative mt-1.5">
                <Mail className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50`} />
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={`bg-muted/30 border-muted ${isRTL ? "pr-10" : "pl-10"}`} />
              </div>
            </div>
            <div>
              <Label className="text-xs font-mono font-semibold text-muted-foreground/80">{language === "ar" ? "رقم الهاتف" : "Phone"} *</Label>
              <div className="relative mt-1.5">
                <Phone className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50`} />
                <Input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={`bg-muted/30 border-muted font-mono text-sm ${isRTL ? "pr-10" : "pl-10"}`} />
              </div>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" /> : saved ? <CheckCircle className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            {saved ? (language === "ar" ? "تم الحفظ!" : "Saved!") : (language === "ar" ? "حفظ البيانات" : "Save Info")}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
