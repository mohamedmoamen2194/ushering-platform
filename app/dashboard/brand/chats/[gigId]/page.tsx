"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { GigChat } from "@/components/gig-chat"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { ArrowLeft, ArrowRight, MessageCircle, RefreshCw, Users } from "lucide-react"

export default function BrandChatDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { language, isRTL } = useLanguage()
  const gigId = Number(params.gigId)
  const [title, setTitle] = useState("")
  const [subtitle, setSubtitle] = useState("")
  const [refreshKey, setRefreshKey] = useState(0)
  const BackIcon = isRTL ? ArrowRight : ArrowLeft

  useEffect(() => {
  if (!user?.id || !gigId) return
  const fetchInfo = async () => {
  try {
  const res = await fetch(`/api/gigs?role=brand&userId=${user.id}&t=${Date.now()}`)
  const data = await res.json()
  if (data.success !== false) {
  const match = (data.gigs || []).find((g: any) => Number(g.id) === gigId)
  if (match) {
  setTitle(match.title || "")
  const parts = []
  if (match.location) parts.push(match.location)
  if (match.approved_ushers) parts.push(`${match.approved_ushers} ${language === "ar" ? "مضيف" : "ushers"}`)
  setSubtitle(parts.join(" • "))
  }
  }
  } catch (e) { console.error(e) }
  }
  fetchInfo()
  }, [user?.id, gigId, language])

  const goBack = () => {
  if (window.history.length > 1) router.back()
  else router.push("/dashboard/brand/chats")
  }

  return (
  <div className="fixed inset-0 z-[60] bg-background flex flex-col">
  {/* Chat header — back arrow + name */}
  <header className="shrink-0 border-b border-border bg-card">
  <div className="mx-auto max-w-3xl flex items-center gap-2 px-3 py-2.5">
  <Button variant="ghost" size="icon" onClick={goBack} aria-label={language === "ar" ? "رجوع" : "Back"}>
  <BackIcon className="h-5 w-5" />
  </Button>
  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
  <MessageCircle className="h-5 w-5 text-primary" />
  </div>
  <div className="min-w-0 flex-1">
  <h1 className="text-sm font-bold truncate">{title || (language === "ar" ? "المحادثة" : "Chat")}</h1>
  {subtitle ? (
  <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
  <Users className="h-3 w-3 shrink-0" />
  {subtitle}
  </p>
  ) : null}
  </div>
  <Button variant="ghost" size="icon" onClick={() => setRefreshKey((k) => k + 1)} aria-label={language === "ar" ? "تحديث" : "Refresh"}>
  <RefreshCw className="h-4 w-4" />
  </Button>
  </div>
  </header>

  {/* Messages + bottom input (no bottom nav here) */}
  <div className="flex-1 min-h-0 mx-auto w-full max-w-3xl flex flex-col">
  {gigId ? (
  <GigChat
  key={refreshKey}
  gigId={gigId}
  gigTitle={title || "Gig"}
  userAccess="brand"
  variant="fullscreen"
  />
  ) : (
  <p className="p-6 text-sm text-muted-foreground">
  {language === "ar" ? "محادثة غير صالحة" : "Invalid chat"}
  </p>
  )}
  </div>
  </div>
  )
}
