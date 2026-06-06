"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { CreditCard, Wallet, CheckCircle, Save, ArrowLeft, AlertCircle } from "lucide-react"
import Link from "next/link"

const METHOD_LABELS: Record<string, { en: string; ar: string }> = {
  vodafone_cash: { en: "Vodafone Cash", ar: "فودافون كاش" },
  instapay: { en: "InstaPay", ar: "إنستاباي" },
  bank: { en: "Bank Transfer", ar: "تحويل بنكي" },
  wallet: { en: "Mobile Wallet", ar: "محفظة إلكترونية" },
}

export default function UsherPaymentPage() {
  const { user } = useAuth()
  const { language, isRTL } = useLanguage()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [errors, setErrors] = useState<{ phone?: string; account_name?: string }>({})

  const [payment, setPayment] = useState({
    method: "vodafone_cash",
    phone: "",
    account_name: "",
  })

  useEffect(() => {
    if (user?.id) fetchPaymentMethod()
  }, [user?.id])

  const fetchPaymentMethod = async () => {
    try {
      const res = await fetch(`/api/users/${user?.id}/profile`)
      const data = await res.json()
      if (data.success && data.profile?.payment_method) {
        const pm = typeof data.profile.payment_method === "string"
          ? JSON.parse(data.profile.payment_method)
          : data.profile.payment_method
        setPayment({
          method: pm.method || "vodafone_cash",
          phone: pm.phone || "",
          account_name: pm.account_name || "",
        })
      }
    } catch (e) { /* silent */ }
  }

  const validate = () => {
    const errs: { phone?: string; account_name?: string } = {}
    if (!payment.phone.trim()) {
      errs.phone = language === "ar" ? "رقم الحساب مطلوب" : "Account number is required"
    }
    if (!payment.account_name.trim()) {
      errs.account_name = language === "ar" ? "اسم صاحب الحساب مطلوب" : "Holder name is required"
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    try {
      setSaving(true)
      const res = await fetch(`/api/users/${user?.id}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_method: payment,
          payment_method_set: true,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (e) { /* silent */ }
    finally { setSaving(false) }
  }

  const t = (en: string, ar: string) => language === "ar" ? ar : en

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3 animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
        <Link href="/dashboard/usher/profile">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {t("Payment Method", "طريقة الدفع")}
            </span>
          </h1>
          <p className="text-xs text-muted-foreground font-light mt-0.5">
            {t("Choose how to receive your earnings", "اختر طريقة استلام أرباحك")}
          </p>
        </div>
      </div>

      {saved && (
        <div className="flex items-center gap-3 rounded-xl border border-secondary/30 bg-secondary/5 p-4 animate-fade-in-up">
          <CheckCircle className="h-5 w-5 text-secondary shrink-0" />
          <p className="text-sm font-semibold text-secondary">
            {t("Payment method saved", "تم حفظ طريقة الدفع")}
          </p>
        </div>
      )}

      <Card className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
        <CardHeader>
          <CardTitle className="text-sm font-mono font-semibold text-muted-foreground/60 tracking-wider uppercase flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            {t("Select Payment Method", "اختر طريقة الدفع")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(METHOD_LABELS).map(([value, labels]) => (
              <Button
                key={value}
                variant={payment.method === value ? "default" : "outline"}
                onClick={() => { setPayment({ ...payment, method: value }); setErrors({}) }}
                className="h-14 text-xs font-mono font-semibold"
              >
                {payment.method === value && <CheckCircle className="h-3.5 w-3.5 mr-1.5" />}
                {t(labels.en, labels.ar)}
              </Button>
            ))}
          </div>

          <div className="pt-2 border-t border-border/50 space-y-4">
            <div>
              <Label className="text-xs font-mono font-semibold text-muted-foreground/80">
                {t("Account Number", "رقم الحساب")}
              </Label>
              <Input
                value={payment.phone}
                onChange={(e) => { setPayment({ ...payment, phone: e.target.value }); if (errors.phone) setErrors({ ...errors, phone: undefined }) }}
                className={`bg-muted/30 border-muted mt-1.5 font-mono ${errors.phone ? "border-destructive ring-1 ring-destructive" : ""}`}
                placeholder={t("Enter account number", "أدخل رقم الحساب")}
              />
              {errors.phone && (
                <p className="text-[11px] font-mono text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />{errors.phone}
                </p>
              )}
            </div>
            <div>
              <Label className="text-xs font-mono font-semibold text-muted-foreground/80">
                {t("Account Holder Name", "اسم صاحب الحساب")}
              </Label>
              <Input
                value={payment.account_name}
                onChange={(e) => { setPayment({ ...payment, account_name: e.target.value }); if (errors.account_name) setErrors({ ...errors, account_name: undefined }) }}
                className={`bg-muted/30 border-muted mt-1.5 ${errors.account_name ? "border-destructive ring-1 ring-destructive" : ""}`}
                placeholder={t("Enter account holder name", "أدخل اسم صاحب الحساب")}
              />
              {errors.account_name && (
                <p className="text-[11px] font-mono text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />{errors.account_name}
                </p>
              )}
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full relative overflow-hidden">
            {saving && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary/30"><div className="h-full bg-primary animate-pulse" style={{ width: "60%" }} /></div>}
            {saving ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
                {t("Saving...", "جاري الحفظ...")}
              </span>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {t("Save Payment Method", "حفظ طريقة الدفع")}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
