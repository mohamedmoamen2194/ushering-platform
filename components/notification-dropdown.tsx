"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Bell, RefreshCw, Briefcase, FileText, CreditCard, Star, MessageCircle, Users, ChevronRight } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"

interface AppNotification {
  id: number
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
}

interface NotificationDropdownProps {
  role: "usher" | "brand"
}

export function NotificationDropdown({ role }: NotificationDropdownProps) {
  const { language, isRTL } = useLanguage()
  const { user } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) fetchLatest()
  }, [open])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const fetchLatest = async () => {
    if (!user?.id) return
    try {
      setLoading(true)
      const res = await fetch(`/api/notifications?userId=${user.id}&limit=5&t=${Date.now()}`)
      const data = await res.json()
      if (data.success) {
        setNotifs(data.notifications || [])
        setUnreadCount((data.notifications || []).filter((n: AppNotification) => !n.is_read).length)
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const getIcon = (type: string) => {
    const cls = "h-4 w-4"
    switch (type) {
      case "gig_alert": return <Briefcase className={`${cls} text-secondary`} />
      case "application": return role === "brand" ? <Users className={`${cls} text-accent`} /> : <FileText className={`${cls} text-secondary`} />
      case "payment": return <CreditCard className={`${cls} text-primary`} />
      case "rating": return <Star className={`${cls} text-secondary`} />
      case "gig_message": return <MessageCircle className={`${cls} text-accent`} />
      default: return <Bell className={`${cls} text-muted-foreground`} />
    }
  }

  const formatTime = (d: string) => {
    const date = new Date(d); const now = new Date(); const diff = now.getTime() - date.getTime()
    if (diff < 60000) return language === "ar" ? "الآن" : "now"
    if (diff < 3600000) return `${Math.floor(diff / 60000)}${language === "ar" ? "د" : "m"}`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}${language === "ar" ? "س" : "h"}`
    return date.toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", { month: "short", day: "numeric" })
  }

  const notifPath = `/dashboard/${role}/notifications`

  return (
    <div ref={ref} className="relative">
      <Button variant="ghost" size="sm" className="relative" onClick={() => setOpen(!open)}>
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full animate-pulse" />}
      </Button>
      {open && (
        <div className={`absolute top-full mt-2 left-1/2 -translate-x-1/2 sm:${isRTL ? "left-0" : "right-0"} sm:translate-x-0 w-72 sm:w-80 z-50 rounded-xl border border-border/60 bg-card/95 backdrop-blur-2xl shadow-2xl shadow-primary/5 overflow-hidden origin-top animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200 ease-out`}>
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/40">
            <span className="text-xs font-mono font-semibold text-muted-foreground/70">
              {language === "ar" ? "الإشعارات" : "Notifications"}
            </span>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[10px] font-mono" onClick={async () => {
                  try {
                    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user?.id, markAll: true }) })
                    setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })))
                    setUnreadCount(0)
                  } catch (e) { console.error(e) }
                }}>
                  <span className="text-[10px]">{language === "ar" ? "قراءة" : "Read"}</span>
                </Button>
              )}
              <Button variant="ghost" size="sm" className="h-6 px-1.5" onClick={fetchLatest}><RefreshCw className="h-3 w-3" /></Button>
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-2">{[1,2,3].map((i) => <div key={i} className="h-10 bg-muted/50 rounded-lg animate-pulse" />)}</div>
            ) : notifs.length === 0 ? (
              <div className="py-8 text-center"><Bell className="h-5 w-5 mx-auto mb-2 text-muted-foreground/30" /><p className="text-xs text-muted-foreground/50 font-mono">{language === "ar" ? "لا توجد إشعارات" : "No notifications"}</p></div>
            ) : (
              <div>
                {notifs.slice(0, 5).map((n) => (
                  <div key={n.id} className={`flex items-start gap-2.5 px-3 py-2.5 ${!n.is_read ? "bg-primary/5 border-l-2 border-l-primary" : "opacity-60"} hover:bg-muted/30 transition-colors`}>
                    <div className="w-8 h-8 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">{getIcon(n.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold leading-tight truncate">{n.title}</p>
                      <p className="text-[10px] text-muted-foreground/70 font-light mt-0.5 leading-tight line-clamp-2">{n.message}</p>
                      <span className="text-[9px] font-mono text-muted-foreground/40 mt-0.5 block">{formatTime(n.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => { router.push(notifPath); setOpen(false) }}
            className="w-full flex items-center justify-center gap-1 py-2 text-[11px] font-mono font-semibold text-accent border-t border-border/40 hover:bg-muted/30 transition-colors"
          >
            {language === "ar" ? "عرض الكل" : "See All"}
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  )
}
