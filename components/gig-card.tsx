"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, DollarSign, Users } from "lucide-react"
import { useTranslation } from "@/lib/i18n"

interface GigCardProps {
  gig: {
    id: number
    title: string
    location: string
    datetime?: string
    start_datetime?: string
    duration_hours: number
    pay_rate: number
    total_ushers_needed: number
    approved_ushers: number
    skills_required: string[]
    company_name: string
    application_status?: string | null
    start_date?: string
    end_date?: string
    start_date_display?: string
    start_time_24h?: string
  }
  language: "ar" | "en"
  userRole?: "usher" | "brand"
  onApply?: (gigId: number) => void
}

export function GigCard({ gig, language, userRole, onApply }: GigCardProps) {
  const { t, isRTL } = useTranslation(language)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: 'Africa/Cairo',
    })
  }

  const getButtonState = () => {
    const normalizedStatus = typeof gig.application_status === 'string' ? gig.application_status.toLowerCase() : gig.application_status

    // Check if gig is full
    if (gig.approved_ushers >= gig.total_ushers_needed) {
      return {
        disabled: true,
        variant: "secondary" as const,
        text: language === "ar" ? "مكتمل" : "Full",
      }
    }

    // Check application status
    if (normalizedStatus === "approved") {
      return {
        disabled: true,
        variant: "default" as const,
        text: language === "ar" ? "مقبول" : "Approved",
      }
    }

    if (normalizedStatus === "pending") {
      return {
        disabled: true,
        variant: "secondary" as const,
        text: language === "ar" ? "قيد المراجعة" : "Pending Review",
      }
    }

    // No application or rejected - can apply
    return {
      disabled: false,
      variant: "default" as const,
      text: gig.application_status === null ? t("apply") : language === "ar" ? "تقديم طلب مرة أخرى" : "Apply Again",
    }
  }

  const buttonState = getButtonState()

  return (
    <Card className={`w-full ${isRTL ? "text-right" : "text-left"}`} dir={isRTL ? "rtl" : "ltr"}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-semibold">{gig.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{gig.company_name}</p>
          </div>
          <Badge variant="secondary">
            {gig.approved_ushers}/{gig.total_ushers_needed} {t("approved")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{gig.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>
              {gig.duration_hours}h {language === "ar" ? "يومياً" : "daily"}
              {gig.start_date && gig.end_date && gig.start_date !== gig.end_date && (
                <span className="text-xs text-muted-foreground ml-1">
                  (
                  {Math.ceil(
                    (new Date(gig.end_date).getTime() - new Date(gig.start_date).getTime()) / (1000 * 60 * 60 * 24),
                  ) + 1}{" "}
                  {language === "ar" ? "أيام" : "days"})
                </span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span>
              {gig.pay_rate} {language === "ar" ? "ج.م/ساعة" : "EGP/hr"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>
              {gig.total_ushers_needed} {language === "ar" ? "مطلوب" : "needed"}
            </span>
          </div>
        </div>

        {gig.start_date && gig.end_date && gig.start_date !== gig.end_date && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-blue-800">
                {language === "ar" ? "إجمالي الأرباح المتوقعة:" : "Total Expected Earnings:"}
              </span>
              <span className="font-bold text-blue-900">
                {(
                  gig.pay_rate *
                  gig.duration_hours *
                  (Math.ceil(
                    (new Date(gig.end_date).getTime() - new Date(gig.start_date).getTime()) / (1000 * 60 * 60 * 24),
                  ) +
                    1)
                ).toLocaleString()}{" "}
                {language === "ar" ? "ج.م" : "EGP"}
              </span>
            </div>
            <div className="text-xs text-blue-600 mt-1">
              {gig.duration_hours}h ×{" "}
              {Math.ceil(
                (new Date(gig.end_date).getTime() - new Date(gig.start_date).getTime()) / (1000 * 60 * 60 * 24),
              ) + 1}{" "}
              {language === "ar" ? "أيام" : "days"} × {gig.pay_rate} {language === "ar" ? "ج.م" : "EGP"}
            </div>
          </div>
        )}

        <div>
          <p className="text-sm font-medium mb-2">{t("date")}:</p>
          <p className="text-sm text-muted-foreground">
              {gig.start_date && gig.end_date
                ? `${new Date(gig.start_date).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US")} - ${new Date(gig.end_date).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US")}`
                : gig.start_date_display && gig.start_time_24h
                  ? `${gig.start_date_display} ${gig.start_time_24h}`
                  : gig.start_datetime 
                    ? formatDate(gig.start_datetime)
                    : gig.datetime 
                      ? formatDate(gig.datetime)
                      : "No date set"}
          </p>
        </div>

        {gig.skills_required && gig.skills_required.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">{t("skillsRequired")}:</p>
            <div className="flex flex-wrap gap-1">
              {gig.skills_required.map((skill, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {userRole === "usher" && onApply && (
          <Button
            onClick={() => onApply(gig.id)}
            className="w-full"
            disabled={buttonState.disabled}
            variant={buttonState.variant}
          >
            {buttonState.text}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
