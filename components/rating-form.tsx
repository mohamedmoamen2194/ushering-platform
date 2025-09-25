"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Star, 
  User, 
  Calendar, 
  MapPin, 
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useTranslation } from "@/lib/i18n"

interface RatingFormProps {
  gig: {
    id: number
    title: string
    location: string
    datetime: string
    durationHours: number
  }
  usher: {
    id: number
    name: string
    profilePhotoUrl?: string
  }
  onSubmit: (rating: {
    brandRating: number
    attendanceDays: number
    totalGigDays: number
    ratingNotes: string
  }) => Promise<void>
  onCancel?: () => void
  isSubmitting?: boolean
}

export function RatingForm({ gig, usher, onSubmit, onCancel, isSubmitting = false }: RatingFormProps) {
  const { language, isRTL } = useLanguage()
  const { t } = useTranslation(language)
  
  const [brandRating, setBrandRating] = useState(5)
  const [attendanceDays, setAttendanceDays] = useState(1)
  const [totalGigDays, setTotalGigDays] = useState(1)
  const [ratingNotes, setRatingNotes] = useState("")
  const [hoveredStar, setHoveredStar] = useState(0)

  // Calculate preview of final rating
  const calculatePreviewRating = () => {
    const attendanceStars = (attendanceDays / totalGigDays) * 2.0
    const brandStars = (brandRating / 5.0) * 3.0
    return Math.round((attendanceStars + brandStars) * 100) / 100
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (attendanceDays > totalGigDays) {
      alert(language === 'ar' ? 'أيام الحضور لا يمكن أن تكون أكثر من إجمالي أيام الوظيفة' : 'Attendance days cannot exceed total gig days')
      return
    }

    await onSubmit({
      brandRating,
      attendanceDays,
      totalGigDays,
      ratingNotes
    })
  }

  const renderStars = (rating: number, interactive: boolean = false) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-6 h-6 sm:w-8 sm:h-8 cursor-pointer transition-colors ${
              star <= (interactive ? (hoveredStar || rating) : rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300 hover:text-yellow-200'
            }`}
            onClick={interactive ? () => setBrandRating(star) : undefined}
            onMouseEnter={interactive ? () => setHoveredStar(star) : undefined}
            onMouseLeave={interactive ? () => setHoveredStar(0) : undefined}
          />
        ))}
      </div>
    )
  }

  const previewRating = calculatePreviewRating()

  return (
    <Card className={`w-full max-w-2xl mx-auto ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Star className="w-5 h-5 text-yellow-500" />
          {language === 'ar' ? 'تقييم المضيف' : 'Rate Usher'}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Gig Information */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <h3 className="font-semibold text-base sm:text-lg mb-3">
            {language === 'ar' ? 'معلومات الوظيفة' : 'Gig Information'}
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="font-medium">{gig.title}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span>{gig.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span>{new Date(gig.datetime).toLocaleDateString()} - {gig.durationHours}h</span>
            </div>
          </div>
        </div>

        {/* Usher Information */}
        <div className="flex items-center gap-4">
          <Avatar className="w-12 h-12 sm:w-16 sm:h-16">
            <AvatarImage src={usher.profilePhotoUrl} alt={usher.name} />
            <AvatarFallback>
              <User className="w-6 h-6 sm:w-8 sm:h-8" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-lg">{usher.name}</h3>
            <p className="text-sm text-gray-600">
              {language === 'ar' ? 'المضيف المراد تقييمه' : 'Usher to be rated'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Attendance Section */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">
              {language === 'ar' ? 'الحضور' : 'Attendance'}
            </Label>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="totalDays" className="text-sm">
                  {language === 'ar' ? 'إجمالي أيام الوظيفة' : 'Total Gig Days'}
                </Label>
                <Input
                  id="totalDays"
                  type="number"
                  min="1"
                  max="30"
                  value={totalGigDays}
                  onChange={(e) => setTotalGigDays(Math.max(1, parseInt(e.target.value) || 1))}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="attendedDays" className="text-sm">
                  {language === 'ar' ? 'أيام الحضور' : 'Days Attended'}
                </Label>
                <Input
                  id="attendedDays"
                  type="number"
                  min="0"
                  max={totalGigDays}
                  value={attendanceDays}
                  onChange={(e) => setAttendanceDays(Math.max(0, Math.min(totalGigDays, parseInt(e.target.value) || 0)))}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle className="w-4 h-4" />
              <span>
                {language === 'ar' 
                  ? `نسبة الحضور: ${Math.round((attendanceDays / totalGigDays) * 100)}% (${((attendanceDays / totalGigDays) * 2).toFixed(1)}/2 نجوم)`
                  : `Attendance: ${Math.round((attendanceDays / totalGigDays) * 100)}% (${((attendanceDays / totalGigDays) * 2).toFixed(1)}/2 stars)`
                }
              </span>
            </div>
          </div>

          {/* Brand Rating Section */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">
              {language === 'ar' ? 'تقييم الأداء (1-5 نجوم)' : 'Performance Rating (1-5 stars)'}
            </Label>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {renderStars(brandRating, true)}
              <div className="text-sm text-gray-600">
                <span>
                  {language === 'ar' 
                    ? `${brandRating}/5 نجوم (${((brandRating / 5) * 3).toFixed(1)}/3 نجوم في التقييم النهائي)`
                    : `${brandRating}/5 stars (${((brandRating / 5) * 3).toFixed(1)}/3 stars in final rating)`
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Rating Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-base font-semibold">
              {language === 'ar' ? 'ملاحظات التقييم (اختياري)' : 'Rating Notes (Optional)'}
            </Label>
            <Textarea
              id="notes"
              value={ratingNotes}
              onChange={(e) => setRatingNotes(e.target.value)}
              placeholder={
                language === 'ar' 
                  ? 'اكتب ملاحظاتك حول أداء المضيف...'
                  : 'Write your notes about the usher\'s performance...'
              }
              className="min-h-[80px] resize-none"
              maxLength={500}
            />
            <div className="text-xs text-gray-500 text-right">
              {ratingNotes.length}/500
            </div>
          </div>

          {/* Final Rating Preview */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-semibold text-blue-800 dark:text-blue-400">
                  {language === 'ar' ? 'التقييم النهائي المتوقع' : 'Expected Final Rating'}
                </h4>
                <p className="text-sm text-blue-600 dark:text-blue-300">
                  {language === 'ar' 
                    ? `${((attendanceDays / totalGigDays) * 2).toFixed(1)} (حضور) + ${((brandRating / 5) * 3).toFixed(1)} (أداء) = ${previewRating} نجوم`
                    : `${((attendanceDays / totalGigDays) * 2).toFixed(1)} (attendance) + ${((brandRating / 5) * 3).toFixed(1)} (performance) = ${previewRating} stars`
                  }
                </p>
              </div>
              <div className="flex items-center gap-2">
                {renderStars(Math.round(previewRating))}
                <Badge variant="outline" className="text-blue-700 border-blue-300">
                  {previewRating}/5
                </Badge>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {language === 'ar' ? 'جاري الإرسال...' : 'Submitting...'}
                </div>
              ) : (
                <>
                  <Star className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'إرسال التقييم' : 'Submit Rating'}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
