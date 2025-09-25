"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { 
  Star, 
  MapPin, 
  Calendar, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Award, 
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Building
} from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useTranslation } from "@/lib/i18n"
import { format } from "date-fns"

interface UsherHistoryProps {
  usherId: number
  showInModal?: boolean
}

interface GigHistoryItem {
  id: number
  title: string
  description: string
  location: string
  startDateTime: string
  endDateTime: string
  durationHours: number
  payRate: number
  gigStatus: string
  brandName: string
  companyName: string
  applicationStatus: string
  appliedAt: string
  reviewedAt: string | null
  checkInTime: string | null
  checkOutTime: string | null
  hoursWorked: number | null
  payoutAmount: number | null
  payoutStatus: string | null
  brandRating: number | null
  attendanceRating: number | null
  finalRating: number | null
  ratingNotes: string | null
  attendanceDays: number | null
  totalGigDays: number | null
  attendancePercentage: number | null
}

interface PerformanceStats {
  totalApplications: number
  approvedApplications: number
  completedGigs: number
  attendedGigs: number
  averageRating: number
  averageAttendance: number
  totalEarnings: number
  reliabilityScore: number
  approvalRate: number
}

interface UsherData {
  id: number
  name: string
  rating: number
  totalGigsCompleted: number
  profilePhotoUrl: string | null
}

interface RecentFeedback {
  brandRating: number
  finalRating: number
  notes: string
  createdAt: string
  gigTitle: string
  brandName: string
  companyName: string
}

export function UsherHistory({ usherId, showInModal = false }: UsherHistoryProps) {
  const [usherData, setUsherData] = useState<UsherData | null>(null)
  const [gigHistory, setGigHistory] = useState<GigHistoryItem[]>([])
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats | null>(null)
  const [recentFeedback, setRecentFeedback] = useState<RecentFeedback[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { language, isRTL } = useLanguage()
  const { t } = useTranslation(language)

  useEffect(() => {
    fetchUsherHistory()
  }, [usherId])

  const fetchUsherHistory = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/users/${usherId}/history`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setUsherData(data.usher)
        setGigHistory(data.gigHistory)
        setPerformanceStats(data.performanceStats)
        setRecentFeedback(data.recentFeedback)
      } else {
        throw new Error(data.error || 'Failed to fetch usher history')
      }
    } catch (error) {
      console.error('Error fetching usher history:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string, startDateTime?: string, durationHours?: number) => {
    // Check if gig is old (end date has passed)
    let isOldGig = false
    if (startDateTime && durationHours) {
      const startDate = new Date(startDateTime)
      const endDate = new Date(startDate.getTime() + (durationHours * 60 * 60 * 1000))
      const now = new Date()
      isOldGig = endDate < now
    }

    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: AlertCircle },
      approved: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      rejected: { color: "bg-red-100 text-red-800", icon: XCircle },
      completed: { color: "bg-blue-100 text-blue-800", icon: Award },
      old: { color: "bg-gray-100 text-gray-800", icon: Clock }
    }

    // Override status if gig is old
    const effectiveStatus = isOldGig ? 'old' : status
    const config = statusConfig[effectiveStatus as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {language === 'ar' ? 
          (effectiveStatus === 'old' ? 'وظيفة قديمة' :
           effectiveStatus === 'pending' ? 'قيد المراجعة' : 
           effectiveStatus === 'approved' ? 'مقبول' : 
           effectiveStatus === 'rejected' ? 'مرفوض' : 
           effectiveStatus === 'completed' ? 'مكتمل' : effectiveStatus) : 
          (effectiveStatus === 'old' ? 'Old Gig' : effectiveStatus)}
      </Badge>
    )
  }

  const renderStars = (rating: number | null | undefined) => {
    const numericRating = Number(rating) || 0
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3 h-3 sm:w-4 sm:h-4 ${
              star <= numericRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-xs sm:text-sm text-gray-600 ml-1">({numericRating.toFixed(1)})</span>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</span>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p>{error}</p>
        </div>
      </Card>
    )
  }

  if (!usherData || !performanceStats) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <User className="w-8 h-8 mx-auto mb-2" />
          <p>{language === 'ar' ? 'لم يتم العثور على بيانات المضيف' : 'No usher data found'}</p>
        </div>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Usher Profile Summary */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <Avatar className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0">
              <AvatarImage src={usherData.profilePhotoUrl || undefined} alt={usherData.name} />
              <AvatarFallback>
                <User className="w-6 h-6 sm:w-8 sm:h-8" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center sm:text-left">
              <CardTitle className="text-lg sm:text-xl">{usherData.name}</CardTitle>
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 mt-2">
                {renderStars(usherData.rating)}
                <Badge variant="outline" className="text-xs sm:text-sm">
                  {performanceStats.completedGigs} {language === 'ar' ? 'وظيفة مكتملة' : 'completed gigs'}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Performance Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            {language === 'ar' ? 'إحصائيات الأداء' : 'Performance Statistics'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="text-center p-2 sm:p-0">
              <div className="text-lg sm:text-2xl font-bold text-blue-600">{performanceStats.approvalRate}%</div>
              <div className="text-xs sm:text-sm text-gray-600">{language === 'ar' ? 'معدل القبول' : 'Approval Rate'}</div>
            </div>
            <div className="text-center p-2 sm:p-0">
              <div className="text-lg sm:text-2xl font-bold text-green-600">{performanceStats.reliabilityScore}%</div>
              <div className="text-xs sm:text-sm text-gray-600">{language === 'ar' ? 'معدل الموثوقية' : 'Reliability Score'}</div>
            </div>
            <div className="text-center p-2 sm:p-0">
              <div className="text-lg sm:text-2xl font-bold text-purple-600">{performanceStats.averageAttendance.toFixed(1)}%</div>
              <div className="text-xs sm:text-sm text-gray-600">{language === 'ar' ? 'متوسط الحضور' : 'Avg Attendance'}</div>
            </div>
            <div className="text-center p-2 sm:p-0">
              <div className="text-lg sm:text-2xl font-bold text-orange-600">
                {performanceStats.totalEarnings.toLocaleString()} {language === 'ar' ? 'ج.م' : 'EGP'}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">{language === 'ar' ? 'إجمالي الأرباح' : 'Total Earnings'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Feedback */}
      {recentFeedback.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Award className="w-4 h-4 sm:w-5 sm:h-5" />
              {language === 'ar' ? 'التقييمات الأخيرة' : 'Recent Feedback'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentFeedback.map((feedback, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-3 sm:pl-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 flex-shrink-0" />
                      <span className="font-medium text-sm sm:text-base truncate">{feedback.companyName}</span>
                    </div>
                    <div className="flex-shrink-0">
                      {renderStars(feedback.finalRating)}
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">{feedback.gigTitle}</p>
                  {feedback.notes && (
                    <p className="text-xs sm:text-sm italic text-gray-700 break-words">"{feedback.notes}"</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {format(new Date(feedback.createdAt), 'MMM dd, yyyy')}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gig History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            {language === 'ar' ? 'تاريخ الوظائف' : 'Gig History'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {gigHistory.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Calendar className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm sm:text-base">{language === 'ar' ? 'لا توجد وظائف سابقة' : 'No previous gigs found'}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {gigHistory.map((gig) => (
                <div key={gig.id} className="border rounded-lg p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-base sm:text-lg break-words">{gig.title}</h4>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mt-1">
                        <Building className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{gig.companyName}</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0 w-full sm:w-auto">
                      {getStatusBadge(gig.applicationStatus, gig.startDateTime, gig.durationHours)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span className="truncate">{gig.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span>{format(new Date(gig.startDateTime), 'MMM dd, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span>{gig.durationHours}h</span>
                    </div>
                  </div>

                  {gig.finalRating && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <span className="text-xs sm:text-sm font-medium">
                          {language === 'ar' ? 'التقييم النهائي:' : 'Final Rating:'}
                        </span>
                        <div className="flex-shrink-0">
                          {renderStars(gig.finalRating)}
                        </div>
                      </div>
                      {gig.attendancePercentage !== null && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs sm:text-sm mb-1">
                            <span>{language === 'ar' ? 'نسبة الحضور:' : 'Attendance:'}</span>
                            <span>{gig.attendancePercentage}%</span>
                          </div>
                          <Progress value={gig.attendancePercentage} className="h-2 mt-1" />
                        </div>
                      )}
                    </div>
                  )}

                  {gig.payoutAmount && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span>{language === 'ar' ? 'المبلغ المدفوع:' : 'Payout:'}</span>
                        <span className="font-medium">
                          {gig.payoutAmount.toLocaleString()} {language === 'ar' ? 'ج.م' : 'EGP'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
