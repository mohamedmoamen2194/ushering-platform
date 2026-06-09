"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GigChat } from "@/components/gig-chat"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { MessageCircle, RefreshCw, Building, CheckCircle, ChevronDown, ChevronUp } from "lucide-react"

interface ApprovedGig {
  id: number
  gig_id: number
  title?: string
  gig_title?: string
  company_name: string
  location?: string
  gig_location?: string
  status: string
}

export default function UsherChatsPage() {
  const { user } = useAuth()
  const { language, isRTL } = useLanguage()
  const [approvedGigs, setApprovedGigs] = useState<ApprovedGig[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedGigId, setExpandedGigId] = useState<number | null>(null)
  const [unread, setUnread] = useState<Record<number, number>>({})

  const fetchApprovedGigs = useCallback(async () => {
    if (!user?.id) return
    try {
      setLoading(true)
      const res = await fetch(`/api/applications/usher/${user.id}?t=${Date.now()}`, { cache: "no-store" })
      const data = await res.json()
      if (data.success) {
        const approved = (data.applications || []).filter((a: any) =>
          a.status === "approved" && a.gig_id && (a.title || a.gig_title)
        )
        setApprovedGigs(approved)
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [user?.id])

  const fetchUnread = useCallback(async () => {
    if (!user?.id) return
    try {
      const res = await fetch(`/api/users/${user.id}/unread-chats?t=${Date.now()}`)
      const data = await res.json()
      if (data.success) setUnread(data.unread || {})
    } catch (e) { console.error(e) }
  }, [user?.id])

  useEffect(() => {
    if (user?.id) { fetchApprovedGigs(); fetchUnread() }
  }, [user?.id, fetchApprovedGigs, fetchUnread])

  useEffect(() => {
    const interval = setInterval(() => { fetchApprovedGigs(); fetchUnread() }, 60000)
    return () => clearInterval(interval)
  }, [fetchApprovedGigs, fetchUnread])

  const markRead = async (gigId: number) => {
    if (!user?.id) return
    try {
      await fetch(`/api/users/${user.id}/unread-chats`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gigId }),
      })
      setUnread((prev) => ({ ...prev, [gigId]: 0 }))
    } catch (e) { console.error(e) }
  }

  const toggleExpand = (gigId: number) => {
    if (expandedGigId === gigId) {
      setExpandedGigId(null)
    } else {
      setExpandedGigId(gigId)
      markRead(gigId)
    }
  }

  const totalUnread = Object.values(unread).reduce((sum, c) => sum + c, 0)

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight">
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {language === "ar" ? "المحادثات" : "Gig Chats"}
          </span>
        </h1>
        <p className="text-xs text-muted-foreground font-light mt-0.5">
          {language === "ar" ? "تواصل مع فريق العمل في الوظائف المقبولة" : "Chat with your team on approved gigs"}
        </p>
      </div>

      <div className="flex items-center justify-between animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
        <p className="text-xs font-mono text-muted-foreground/50">
          {language === "ar"
            ? `لديك ${approvedGigs.length} محادثة نشطة`
            : `${approvedGigs.length} active chats`}
          {totalUnread > 0 && (
            <span className="text-amber-400 ml-1.5">
              ({language === "ar" ? `${totalUnread} غير مقروء` : `${totalUnread} unread`})
            </span>
          )}
        </p>
        <Button variant="ghost" size="sm" onClick={() => { fetchApprovedGigs(); fetchUnread() }}>
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4"><div className="h-5 w-44 bg-muted rounded mb-2" /><div className="h-3 w-28 bg-muted rounded" /></CardContent>
            </Card>
          ))}
        </div>
      ) : approvedGigs.length === 0 ? (
        <Card className="animate-fade-in-up border-dashed" style={{ animationDelay: "0.15s" }}>
          <CardContent className="flex flex-col items-center py-14">
            <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
              <MessageCircle className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-semibold text-muted-foreground">
              {language === "ar" ? "لا توجد محادثات نشطة" : "No active chats"}
            </p>
            <p className="text-xs text-muted-foreground/50 font-light mt-1">
              {language === "ar"
                ? "سيتم تفعيل المحادثات بعد قبول طلبك في وظيفة"
                : "Chats activate once you're approved for a gig"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {approvedGigs.map((gig, i) => {
            const gigId = gig.gig_id
            const isExpanded = expandedGigId === gigId
            const unreadCount = unread[gigId] || 0
            return (
              <Card
                key={gig.id}
                className="animate-fade-in-up overflow-hidden"
                style={{ animationDelay: `${0.1 + i * 0.05}s` }}
              >
                <button
                  onClick={() => toggleExpand(gigId)}
                  className="w-full text-left"
                >
                  <CardContent className="p-4 flex items-center justify-between gap-3 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                          <MessageCircle className="h-5 w-5 text-primary" />
                        </div>
                        {unreadCount > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-background" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold truncate flex items-center gap-2">
                          {gig.title || gig.gig_title}
                          {unreadCount > 0 && (
                            <span className="text-[10px] font-mono bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded-full shrink-0">
                              {unreadCount}
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Building className="h-3 w-3" />
                          {gig.company_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className="bg-secondary/20 text-secondary text-[10px] font-mono font-semibold">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {language === "ar" ? "مقبول" : "Approved"}
                      </Badge>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </CardContent>
                </button>

                {isExpanded && (
                  <div className="border-t border-border/50 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                    <div className="h-[400px]">
                      <GigChat
                        gigId={gigId}
                        gigTitle={gig.title || gig.gig_title || "Gig"}
                        userAccess="usher"
                        onClose={() => setExpandedGigId(null)}
                      />
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
