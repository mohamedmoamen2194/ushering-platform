"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
 Send, 
 MessageCircle, 
 Megaphone, 
 User, 
 Building,
 Clock,
 RefreshCw
} from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useTranslation } from "@/lib/i18n"
import { useAuth } from "@/lib/auth-context"
import { format } from "date-fns"

interface Message {
 id: number
 message: string
 messageType: string
 isAnnouncement: boolean
 createdAt: string
 sender: {
 id: number
 name: string
 role: string
 companyName?: string
 }
}

interface GigChatProps {
  gigId: number
  gigTitle: string
  userAccess: 'brand' | 'usher'
  onClose?: () => void
  variant?: 'card' | 'fullscreen'
}

export function GigChat({ gigId, gigTitle, userAccess, onClose, variant = 'card' }: GigChatProps) {
 const [messages, setMessages] = useState<Message[]>([])
 const [newMessage, setNewMessage] = useState("")
 const [isAnnouncement, setIsAnnouncement] = useState(false)
 const [isLoading, setIsLoading] = useState(true)
 const [isSending, setIsSending] = useState(false)
 const [error, setError] = useState<string | null>(null)
 const messagesEndRef = useRef<HTMLDivElement>(null)
 const { language, isRTL } = useLanguage()
 const { t } = useTranslation(language)
 const { user } = useAuth()

 useEffect(() => {
 fetchMessages()
 // Set up polling for new messages every 1 minute
 const interval = setInterval(fetchMessages, 60000)
 return () => clearInterval(interval)
 }, [gigId])

 useEffect(() => {
 scrollToBottom()
 }, [messages])

 const scrollToBottom = () => {
 messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
 }

 const fetchMessages = async () => {
 try {
 setError(null)
 const response = await fetch(`/api/gigs/${gigId}/messages?userId=${user?.id}`)
 
 if (!response.ok) {
 if (response.status === 404) {
 throw new Error(language === 'ar' ? 'الوظيفة غير موجودة أو تم حذفها' : 'This gig no longer exists or has been removed')
 }
 if (response.status === 403) {
 throw new Error(language === 'ar' ? 'ليس لديك صلاحية للوصول إلى هذه المحادثة' : 'You do not have access to this chat')
 }
 throw new Error(`HTTP error! status: ${response.status}`)
 }

 const data = await response.json()
 
 if (data.success) {
 setMessages(data.messages)
 } else {
 throw new Error(data.error || 'Failed to fetch messages')
 }
 } catch (error) {
 console.error('Error fetching messages:', error)
 setError(error instanceof Error ? error.message : 'Unknown error')
 } finally {
 setIsLoading(false)
 }
 }

 const sendMessage = async () => {
 if (!newMessage.trim() || !user) return

 setIsSending(true)
 try {
 const response = await fetch(`/api/gigs/${gigId}/messages`, {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 },
 body: JSON.stringify({
 message: newMessage.trim(),
 messageType: isAnnouncement ? 'announcement' : 'message',
 isAnnouncement: isAnnouncement && userAccess === 'brand',
 senderId: user.id
 })
 })

 const data = await response.json()
 
 if (data.success) {
 setNewMessage("")
 setIsAnnouncement(false)
 // Add the new message to the list immediately
 setMessages(prev => [...prev, data.message])
 scrollToBottom()
 } else {
 throw new Error(data.error || 'Failed to send message')
 }
 } catch (error) {
 console.error('Error sending message:', error)
 setError(error instanceof Error ? error.message : 'Failed to send message')
 } finally {
 setIsSending(false)
 }
 }

 const handleKeyPress = (e: React.KeyboardEvent) => {
 if (e.key === 'Enter' && !e.shiftKey) {
 e.preventDefault()
 sendMessage()
 }
 }

 const formatMessageTime = (dateString: string) => {
 return format(new Date(dateString), 'MMM dd, HH:mm')
 }

 const getMessageIcon = (msg: Message) => {
 if (msg.isAnnouncement) {
 return <Megaphone className="w-4 h-4 text-primary" />
 }
  return msg.sender.role === 'brand' ? 
  <Building className="w-4 h-4 text-primary" /> : 
  <User className="w-4 h-4 text-primary" />
  }

 const getMessageBadge = (msg: Message) => {
 if (msg.isAnnouncement) {
 return (
 <Badge className="bg-primary/10 text-primary text-xs">
 {language === 'ar' ? 'إعلان' : 'Announcement'}
 </Badge>
 )
 }
 return null
 }

  if (isLoading) {
  if (variant === 'fullscreen') {
  return (
  <div className="flex-1 flex items-center justify-center p-8">
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  <span className="ml-2 text-sm text-muted-foreground">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</span>
  </div>
  )
  }
  return (
 <Card className="w-full max-w-2xl mx-auto">
  <CardContent className="flex items-center justify-center p-8">
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
 <span className="ml-2">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</span>
 </CardContent>
 </Card>
 )
 }

  if (variant === 'fullscreen') {
  return (
  <div className={`flex flex-col h-full min-h-0 ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
  {error && (
  <div className="mx-3 mt-3 bg-destructive/10 border border-destructive/20 rounded-lg p-3">
  <p className="text-destructive text-sm">{error}</p>
  </div>
  )}

  {/* Messages List */}
  <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 py-4">
  <div className="max-w-3xl mx-auto space-y-3">
  {messages.length === 0 ? (
  <div className="text-center text-muted-foreground py-10">
  <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
  <p className="text-sm">{language === 'ar' ? 'لا توجد رسائل بعد' : 'No messages yet'}</p>
  <p className="text-xs mt-1">
  {language === 'ar' ? 'ابدأ المحادثة!' : 'Start the conversation!'}
  </p>
  </div>
  ) : (
  messages.map((msg) => (
  <div key={msg.id} className={`flex ${msg.sender.id === user?.id ? 'justify-end' : 'justify-start'}`}>
  <div className={`max-w-[85%] sm:max-w-[70%]`}>
  <div className={`rounded-2xl px-3 py-2 ${
  msg.sender.id === user?.id
  ? 'bg-primary text-primary-foreground rounded-br-md'
  : msg.isAnnouncement
  ? 'bg-primary/5 border border-border rounded-bl-md'
  : 'bg-card border border-border rounded-bl-md'
  }`}>
  <div className="flex items-center gap-2 mb-1">
  {getMessageIcon(msg)}
  <span className={`text-xs font-medium truncate ${
  msg.sender.id === user?.id ? 'text-primary-foreground/80' : 'text-muted-foreground'
  }`}>
  {msg.sender.companyName || msg.sender.name}
  </span>
  {getMessageBadge(msg)}
  </div>
  <p className={`text-sm break-words ${msg.sender.id === user?.id ? 'text-primary-foreground' : 'text-foreground'}`}>
  {msg.message}
  </p>
  <div className={`text-[11px] mt-1 flex items-center gap-1 ${
  msg.sender.id === user?.id ? 'text-primary-foreground/80' : 'text-muted-foreground'
  }`}>
  <Clock className="w-3 h-3" />
  <span>{formatMessageTime(msg.createdAt)}</span>
  </div>
  </div>
  </div>
  </div>
  ))
  )}
  <div ref={messagesEndRef} />
  </div>
  </div>

  {/* Message Input — replaces bottom nav on chat detail */}
  <div className="shrink-0 border-t border-border bg-card px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
  <div className="max-w-3xl mx-auto space-y-2">
  {userAccess === 'brand' && (
  <div className="flex items-center space-x-2 rtl:space-x-reverse">
  <Switch
  id="announcement-fullscreen"
  checked={isAnnouncement}
  onCheckedChange={setIsAnnouncement}
  />
  <Label htmlFor="announcement-fullscreen" className="text-xs">
  {language === 'ar' ? 'إرسال كإعلان لجميع المضيفين' : 'Send as announcement to all ushers'}
  </Label>
  </div>
  )}
  <div className="flex items-end gap-2">
  <Textarea
  value={newMessage}
  onChange={(e) => setNewMessage(e.target.value)}
  onKeyPress={handleKeyPress}
  placeholder={
  isAnnouncement
  ? (language === 'ar' ? 'اكتب إعلانك هنا...' : 'Type your announcement here...')
  : (language === 'ar' ? 'اكتب رسالتك هنا...' : 'Type your message here...')
  }
  className="flex-1 min-h-[44px] max-h-32 resize-none text-sm rounded-2xl"
  rows={1}
  disabled={isSending}
  />
  <Button
  onClick={sendMessage}
  disabled={!newMessage.trim() || isSending}
  size="icon"
  className="shrink-0 rounded-full h-11 w-11"
  aria-label={language === 'ar' ? 'إرسال' : 'Send'}
  >
  {isSending ? (
  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
  ) : (
  <Send className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
  )}
  </Button>
  </div>
  </div>
  </div>
  </div>
  )
  }

  return (
  <Card className={`w-full max-w-2xl mx-auto ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
 <CardHeader className="pb-3">
 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
 <div className="flex items-center gap-2 min-w-0 flex-1">
 <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
 <CardTitle className="text-base sm:text-lg truncate">
 {language === 'ar' ? `محادثة: ${gigTitle}` : `Chat: ${gigTitle}`}
 </CardTitle>
 </div>
 <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
 <Button variant="ghost" size="sm" onClick={fetchMessages} disabled={isLoading}>
 <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
 </Button>
 {onClose && (
 <Button variant="ghost" size="sm" onClick={onClose}>
 ✕
 </Button>
 )}
 </div>
 </div>
 <p className="text-xs sm:text-sm text-muted-foreground">
 {language === 'ar' 
 ? `أنت ${userAccess === 'brand' ? 'مالك الوظيفة' : 'مضيف معتمد'}`
 : `You are ${userAccess === 'brand' ? 'the gig owner' : 'an approved usher'}`
 }
 </p>
 </CardHeader>

 <CardContent className="space-y-4">
  {error && (
  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
  <p className="text-destructive text-sm">{error}</p>
  </div>
  )}

 {/* Messages List */}
 <div className="space-y-3 max-h-64 sm:max-h-96 overflow-y-auto border rounded-lg p-2 sm:p-4 bg-muted/40">
 {messages.length === 0 ? (
 <div className="text-center text-muted-foreground py-6 sm:py-8">
 <MessageCircle className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-4 opacity-50" />
 <p className="text-sm sm:text-base">{language === 'ar' ? 'لا توجد رسائل بعد' : 'No messages yet'}</p>
 <p className="text-xs sm:text-sm mt-1">
 {language === 'ar' ? 'ابدأ المحادثة!' : 'Start the conversation!'}
 </p>
 </div>
 ) : (
 messages.map((msg) => (
 <div key={msg.id} className={`flex gap-2 sm:gap-3 ${msg.sender.id === user?.id ? 'justify-end' : 'justify-start'}`}>
 <div className={`max-w-[85%] sm:max-w-[70%] ${msg.sender.id === user?.id ? 'order-2' : 'order-1'}`}>
 <div className={`rounded-lg p-2 sm:p-3 ${
 msg.sender.id === user?.id 
 ? 'bg-primary text-primary-foreground' 
 : msg.isAnnouncement 
  ? 'bg-primary/5 border border-border' 
  : 'bg-card border border-border'
  }`}>
  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
  <div className="flex items-center gap-2">
  {getMessageIcon(msg)}
  <span className={`text-xs sm:text-sm font-medium truncate ${
  msg.sender.id === user?.id ? 'text-primary-foreground/80' : 'text-muted-foreground'
  }`}>
  {msg.sender.companyName || msg.sender.name}
  </span>
  </div>
  {getMessageBadge(msg)}
  </div>
  <p className={`text-xs sm:text-sm break-words ${msg.sender.id === user?.id ? 'text-primary-foreground' : 'text-foreground'}`}>
  {msg.message}
  </p>
  <div className={`text-xs mt-2 flex items-center gap-1 ${
  msg.sender.id === user?.id ? 'text-primary-foreground/80' : 'text-muted-foreground'
 }`}>
 <Clock className="w-3 h-3" />
 <span className="text-xs">{formatMessageTime(msg.createdAt)}</span>
 </div>
 </div>
 </div>
 </div>
 ))
 )}
 <div ref={messagesEndRef} />
 </div>

 {/* Message Input */}
 <div className="space-y-3">
 {userAccess === 'brand' && (
 <div className="flex items-center space-x-2 rtl:space-x-reverse">
 <Switch
 id="announcement"
 checked={isAnnouncement}
 onCheckedChange={setIsAnnouncement}
 />
 <Label htmlFor="announcement" className="text-xs sm:text-sm">
 {language === 'ar' ? 'إرسال كإعلان لجميع المضيفين' : 'Send as announcement to all ushers'}
 </Label>
 </div>
 )}

 <div className="flex flex-col sm:flex-row gap-2">
 <Textarea
 value={newMessage}
 onChange={(e) => setNewMessage(e.target.value)}
 onKeyPress={handleKeyPress}
 placeholder={
 isAnnouncement 
 ? (language === 'ar' ? 'اكتب إعلانك هنا...' : 'Type your announcement here...')
 : (language === 'ar' ? 'اكتب رسالتك هنا...' : 'Type your message here...')
 }
 className="flex-1 min-h-[60px] sm:min-h-[80px] resize-none text-sm"
 disabled={isSending}
 />
 <Button 
 onClick={sendMessage} 
 disabled={!newMessage.trim() || isSending}
 className="self-end w-full sm:w-auto"
 >
  {isSending ? (
  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
 ) : (
 <>
 <Send className="w-4 h-4 mr-2" />
 <span className="sm:hidden">{language === 'ar' ? 'إرسال' : 'Send'}</span>
 </>
 )}
 </Button>
 </div>
 </div>
 </CardContent>
 </Card>
 )
}
