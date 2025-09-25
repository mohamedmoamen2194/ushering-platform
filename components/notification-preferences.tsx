"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { 
  Bell, 
  MessageSquare, 
  Megaphone, 
  DollarSign, 
  Calendar,
  Smartphone,
  Mail,
  Save,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useTranslation } from "@/lib/i18n"

interface NotificationPreferencesProps {
  userId: number
  onSave?: (preferences: any) => void
}

interface Preferences {
  whatsappEnabled: boolean
  emailEnabled: boolean
  pushEnabled: boolean
  gigUpdates: boolean
  paymentUpdates: boolean
  applicationUpdates: boolean
  chatMessages: boolean
  announcements: boolean
}

export function NotificationPreferences({ userId, onSave }: NotificationPreferencesProps) {
  const { language, isRTL } = useLanguage()
  const { t } = useTranslation(language)
  
  const [preferences, setPreferences] = useState<Preferences>({
    whatsappEnabled: true,
    emailEnabled: false,
    pushEnabled: true,
    gigUpdates: true,
    paymentUpdates: true,
    applicationUpdates: true,
    chatMessages: true,
    announcements: true
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPreferences()
  }, [userId])

  const fetchPreferences = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/notifications/preferences?userId=${userId}`)
      const data = await response.json()
      
      if (data.success) {
        setPreferences(data.preferences)
      } else {
        throw new Error(data.error || 'Failed to fetch preferences')
      }
    } catch (error) {
      console.error('Error fetching preferences:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          preferences
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
        onSave?.(preferences)
      } else {
        throw new Error(data.error || 'Failed to save preferences')
      }
    } catch (error) {
      console.error('Error saving preferences:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setSaving(false)
    }
  }

  const updatePreference = (key: keyof Preferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }))
  }

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`w-full max-w-2xl mx-auto ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Bell className="w-5 h-5 text-blue-600" />
          {language === 'ar' ? 'إعدادات الإشعارات' : 'Notification Preferences'}
        </CardTitle>
        <p className="text-sm text-gray-600">
          {language === 'ar' 
            ? 'اختر كيف تريد أن تتلقى الإشعارات'
            : 'Choose how you want to receive notifications'
          }
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {saved && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <p className="text-green-600 text-sm">
              {language === 'ar' ? 'تم حفظ الإعدادات بنجاح' : 'Preferences saved successfully'}
            </p>
          </div>
        )}

        {/* Delivery Methods */}
        <div className="space-y-4">
          <h3 className="font-semibold text-base">
            {language === 'ar' ? 'طرق التوصيل' : 'Delivery Methods'}
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-green-600" />
                <div>
                  <Label className="font-medium">
                    {language === 'ar' ? 'واتساب' : 'WhatsApp'}
                  </Label>
                  <p className="text-xs text-gray-600">
                    {language === 'ar' ? 'إشعارات فورية عبر واتساب' : 'Instant notifications via WhatsApp'}
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.whatsappEnabled}
                onCheckedChange={(checked) => updatePreference('whatsappEnabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-blue-600" />
                <div>
                  <Label className="font-medium">
                    {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                  </Label>
                  <p className="text-xs text-gray-600">
                    {language === 'ar' ? 'إشعارات عبر البريد الإلكتروني' : 'Email notifications'}
                  </p>
                  <Badge variant="outline" className="text-xs mt-1">
                    {language === 'ar' ? 'قريباً' : 'Coming Soon'}
                  </Badge>
                </div>
              </div>
              <Switch
                checked={preferences.emailEnabled}
                onCheckedChange={(checked) => updatePreference('emailEnabled', checked)}
                disabled={true}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-purple-600" />
                <div>
                  <Label className="font-medium">
                    {language === 'ar' ? 'إشعارات المتصفح' : 'Push Notifications'}
                  </Label>
                  <p className="text-xs text-gray-600">
                    {language === 'ar' ? 'إشعارات في المتصفح والتطبيق' : 'Browser and app notifications'}
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.pushEnabled}
                onCheckedChange={(checked) => updatePreference('pushEnabled', checked)}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Notification Types */}
        <div className="space-y-4">
          <h3 className="font-semibold text-base">
            {language === 'ar' ? 'أنواع الإشعارات' : 'Notification Types'}
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <Label className="font-medium">
                    {language === 'ar' ? 'تحديثات الوظائف' : 'Gig Updates'}
                  </Label>
                  <p className="text-xs text-gray-600">
                    {language === 'ar' ? 'وظائف جديدة، تغييرات في المواعيد، إلغاءات' : 'New gigs, schedule changes, cancellations'}
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.gigUpdates}
                onCheckedChange={(checked) => updatePreference('gigUpdates', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-orange-600" />
                <div>
                  <Label className="font-medium">
                    {language === 'ar' ? 'تحديثات الطلبات' : 'Application Updates'}
                  </Label>
                  <p className="text-xs text-gray-600">
                    {language === 'ar' ? 'قبول أو رفض الطلبات' : 'Application approvals and rejections'}
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.applicationUpdates}
                onCheckedChange={(checked) => updatePreference('applicationUpdates', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-green-600" />
                <div>
                  <Label className="font-medium">
                    {language === 'ar' ? 'تحديثات المدفوعات' : 'Payment Updates'}
                  </Label>
                  <p className="text-xs text-gray-600">
                    {language === 'ar' ? 'المدفوعات المستلمة، تحديثات المحفظة' : 'Payments received, wallet updates'}
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.paymentUpdates}
                onCheckedChange={(checked) => updatePreference('paymentUpdates', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-purple-600" />
                <div>
                  <Label className="font-medium">
                    {language === 'ar' ? 'رسائل المحادثة' : 'Chat Messages'}
                  </Label>
                  <p className="text-xs text-gray-600">
                    {language === 'ar' ? 'رسائل جديدة في محادثات الوظائف' : 'New messages in gig chats'}
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.chatMessages}
                onCheckedChange={(checked) => updatePreference('chatMessages', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Megaphone className="w-5 h-5 text-red-600" />
                <div>
                  <Label className="font-medium">
                    {language === 'ar' ? 'الإعلانات' : 'Announcements'}
                  </Label>
                  <p className="text-xs text-gray-600">
                    {language === 'ar' ? 'إعلانات مهمة من أصحاب الوظائف' : 'Important announcements from gig owners'}
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.announcements}
                onCheckedChange={(checked) => updatePreference('announcements', checked)}
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto"
          >
            {saving ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {language === 'ar' ? 'جاري الحفظ...' : 'Saving...'}
              </div>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'حفظ الإعدادات' : 'Save Preferences'}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
