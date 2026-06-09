"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, DollarSign, Users, Shirt } from "lucide-react"
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
    dress_code?: string
    description?: string
    additional_requirements?: string
  }
  language: "ar" | "en"
  userRole?: "usher" | "brand"
  href?: string
}

export function GigCard({ gig, language, userRole, href }: GigCardProps) {
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

  const card = (
    <Card className={`w-full ${href ? "cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all duration-200" : ""} ${isRTL ? "text-right" : "text-left"}`} dir={isRTL ? "rtl" : "ltr"}>
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

        {gig.dress_code && (
          <div className="flex items-center gap-2 text-sm">
            <Shirt className="h-4 w-4 text-muted-foreground" />
            <span>{language === "ar" ? "قواعد اللبس:" : "Dress Code:"} <strong>{gig.dress_code}</strong></span>
          </div>
        )}

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

      </CardContent>
    </Card>
  )

  return href ? <Link href={href}>{card}</Link> : card
}
