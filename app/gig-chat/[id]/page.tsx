"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { GigChat } from "@/components/gig-chat"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function GigChatPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { language, isRTL } = useLanguage()
  const [gigInfo, setGigInfo] = useState<{
    title: string
    userAccess: 'brand' | 'usher'
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const gigId = parseInt(params.id as string)

  useEffect(() => {
    if (user && !isNaN(gigId)) {
      fetchGigInfo()
    }
  }, [user, gigId])

  const fetchGigInfo = async () => {
    try {
      const response = await fetch(`/api/gigs/${gigId}/messages?userId=${user?.id}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setGigInfo({
          title: data.gig.title,
          userAccess: data.gig.userAccess
        })
      } else {
        throw new Error(data.error || 'Failed to fetch gig info')
      }
    } catch (error) {
      console.error('Error fetching gig info:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    if (gigInfo?.userAccess === 'brand') {
      router.push('/dashboard/brand')
    } else {
      router.push('/dashboard/usher')
    }
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</span>
        </div>
      </ProtectedRoute>
    )
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className={`min-h-screen bg-background p-4 ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="container mx-auto max-w-2xl">
            <div className="mb-6">
              <Button variant="ghost" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'العودة' : 'Back'}
              </Button>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <h2 className="text-lg font-semibold text-red-800 mb-2">
                {language === 'ar' ? 'خطأ في تحميل المحادثة' : 'Error Loading Chat'}
              </h2>
              <p className="text-red-600">{error}</p>
              <Button className="mt-4" onClick={fetchGigInfo}>
                {language === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
              </Button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!gigInfo) {
    return (
      <ProtectedRoute>
        <div className={`min-h-screen bg-background p-4 ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="container mx-auto max-w-2xl">
            <div className="mb-6">
              <Button variant="ghost" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'العودة' : 'Back'}
              </Button>
            </div>
            
            <div className="text-center py-12">
              <h2 className="text-lg font-semibold mb-2">
                {language === 'ar' ? 'الوظيفة غير موجودة' : 'Gig Not Found'}
              </h2>
              <p className="text-gray-600">
                {language === 'ar' ? 'لا يمكن العثور على هذه الوظيفة أو ليس لديك صلاحية للوصول إليها' : 'This gig could not be found or you do not have access to it'}
              </p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className={`min-h-screen bg-background p-4 ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="container mx-auto max-w-4xl">
          <div className="mb-6">
            <Button variant="ghost" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'العودة' : 'Back'}
            </Button>
          </div>
          
          <GigChat
            gigId={gigId}
            gigTitle={gigInfo.title}
            userAccess={gigInfo.userAccess}
            onClose={handleBack}
          />
        </div>
      </div>
    </ProtectedRoute>
  )
}
