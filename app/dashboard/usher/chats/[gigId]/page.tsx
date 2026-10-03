"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { GigChat } from "@/components/gig-chat"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { ArrowLeft, ArrowRight, MessageCircle, RefreshCw } from "lucide-react"

export default function UsherChatDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { language, isRTL } = useLanguage()
  const gigId = Number(params.gigId)
  const [title, setTitle] = useState("")
  const [company, setCompany] = useState("")
  const [refreshKey, setRefreshKey] = useState(0)
  const BackIcon = isRTL ? ArrowRight : ArrowLeft

  useEffect(() => {
  if (!user?.id || !gigId) return
  const fetchInfo = async () => {
  try {
  const res = await fetch(`/api/applications/usher/${user.id}?t=${Date.now()}`, { cache: "no-store" })
  const data = await res.json()
  if (data.success) {
  const match = (data.applications || []).find((a: any) => Number(a.gig_id) === gigId)
  if (match) {
  setTitle(match.title || match.gig_title || "")
  setCompany(match.company_name || "")
  }
  }
  } catch (e) { console.error(e) }
  }
  fetchInfo()
  }, [user?.id, gigId])

  const goBack = () => {
  if (window.history.length > 1) router.back()
  else router.push("/dashboard/usher/chats")
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
  <p className="text-xs text-muted-foreground truncate">{company}</p>
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
  userAccess="usher"
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
