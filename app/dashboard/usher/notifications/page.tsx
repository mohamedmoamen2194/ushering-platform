"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { Bell, RefreshCw, CheckCheck, Briefcase, CreditCard, Star, MessageCircle, FileText } from "lucide-react"

interface AppNotification {
  id: number
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
}

export default function UsherNotificationsPage() {
  const { user } = useAuth()
  const { language } = useLanguage()
  const [notifs, setNotifs] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (user?.id) fetchNotifications() }, [user?.id])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/notifications?userId=${user?.id}&t=${Date.now()}`)
      const data = await res.json()
      if (data.success) setNotifs(data.notifications || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id, markAll: true }),
      })
      setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })))
    } catch (e) { console.error(e) }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "gig_alert": return <Briefcase className="h-4 w-4 text-accent" />
      case "application": return <FileText className="h-4 w-4 text-secondary" />
      case "payment": return <CreditCard className="h-4 w-4 text-primary" />
      case "rating": return <Star className="h-4 w-4 text-secondary" />
      case "gig_message": return <MessageCircle className="h-4 w-4 text-accent" />
      default: return <Bell className="h-4 w-4 text-muted-foreground" />
    }
  }

  const unreadCount = notifs.filter((n) => !n.is_read).length

  const formatTime = (d: string) => {
    const date = new Date(d); const now = new Date(); const diff = now.getTime() - date.getTime()
    if (diff < 60000) return language === "ar" ? "Ã˜Â§Ã™â€žÃ˜Â¢Ã™â€ " : "just now"
    if (diff < 3600000) return `${Math.floor(diff / 60000)}${language === "ar" ? "Ã˜Â¯" : "m"}`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}${language === "ar" ? "Ã˜Â³" : "h"}`
    return date.toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", { month: "short", day: "numeric" })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {language === "ar" ? "Ã˜Â§Ã™â€žÃ˜Â¥Ã˜Â´Ã˜Â¹Ã˜Â§Ã˜Â±Ã˜Â§Ã˜Âª" : "Notifications"}
            </span>
          </h1>
          <p className="text-xs text-muted-foreground font-light mt-0.5">
            {language === "ar" ? `Ã™â€žÃ˜Â¯Ã™Å Ã™Æ’ ${unreadCount} Ã˜Â¬Ã˜Â¯Ã™Å Ã˜Â¯` : `${unreadCount} new`}
          </p>
        </div>
        <div className="flex gap-1">
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead}>
              <CheckCheck className="h-4 w-4 mr-1" />
              <span className="text-xs hidden sm:inline">{language === "ar" ? "Ã™â€šÃ˜Â±Ã˜Â§Ã˜Â¡Ã˜Â© Ã˜Â§Ã™â€žÃ™Æ’Ã™â€ž" : "Read All"}</span>
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={fetchNotifications}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3, 4].map((i) => <Card key={i} className="animate-pulse"><CardContent className="p-4"><div className="h-4 w-48 bg-muted rounded mb-2" /><div className="h-3 w-36 bg-muted rounded" /></CardContent></Card>)}</div>
      ) : notifs.length === 0 ? (
        <Card className="animate-fade-in-up border-dashed" style={{ animationDelay: "0.1s" }}>
          <CardContent className="flex flex-col items-center py-14">
            <Bell className="h-7 w-7 text-muted-foreground/40 mb-4" />
            <p className="text-sm font-semibold text-muted-foreground">{language === "ar" ? "Ã™â€žÃ˜Â§ Ã˜ÂªÃ™Ë†Ã˜Â¬Ã˜Â¯ Ã˜Â¥Ã˜Â´Ã˜Â¹Ã˜Â§Ã˜Â±Ã˜Â§Ã˜Âª" : "No notifications"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1.5">
          {notifs.map((n, i) => (
            <Card key={n.id} className={`animate-fade-in-up border-l-4 ${n.is_read ? "border-l-transparent opacity-60" : "border-l-primary"}`} style={{ animationDelay: `${i * 0.03}s` }}>
              <CardContent className="p-3 sm:p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 mt-0.5">{getIcon(n.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold">{n.title}</p>
                    <span className="text-[10px] font-mono text-muted-foreground/50 shrink-0">{formatTime(n.created_at)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground/80 font-light mt-0.5">{n.message}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
