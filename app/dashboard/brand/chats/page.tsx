"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { MessageCircle, RefreshCw, Users } from "lucide-react"

interface BrandGig {
  id: number
  title: string
  location: string
  start_date: string
  end_date: string
  approved_ushers: number
  status: string
}

export default function BrandChatsPage() {
  const { user } = useAuth()
  const { language } = useLanguage()
  const [gigs, setGigs] = useState<BrandGig[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchGigs() }, [user?.id])
  useEffect(() => { const interval = setInterval(fetchGigs, 60000); return () => clearInterval(interval) }, [user?.id])

  const fetchGigs = async () => {
  try {
  setLoading(true)
  const res = await fetch(`/api/gigs?role=brand&userId=${user?.id}&t=${Date.now()}`)
  const data = await res.json()
  if (data.success !== false) {
  const withChats = (data.gigs || []).filter((g: any) => g.approved_ushers > 0)
  setGigs(withChats)
  }
  } catch (e) { console.error(e) }
  finally { setLoading(false) }
  }

  return (
  <div className="max-w-3xl mx-auto space-y-5">
  <div className="animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
  <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
  <span className="text-foreground">
  {language === "ar" ? "محادثات الوظائف" : "Gig Chats"}
  </span>
  </h1>
  <p className="text-xs text-muted-foreground font-light mt-0.5">
  {language === "ar" ? "تواصل مع المضيفين في وظائفك النشطة" : "Chat with ushers in your active gigs"}
  </p>
  </div>

  <div className="flex items-center justify-between animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
  <p className="text-xs font-mono text-muted-foreground/50">
  {language === "ar" ? `${gigs.length} وظيفة مع محادثات` : `${gigs.length} gigs with active chats`}
  </p>
  <Button variant="ghost" size="sm" onClick={fetchGigs}>
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
  ) : gigs.length === 0 ? (
  <Card className="animate-fade-in-up border-dashed" style={{ animationDelay: "0.15s" }}>
  <CardContent className="flex flex-col items-center py-14">
  <div className="w-14 h-14 rounded-lg bg-muted/50 flex items-center justify-center mb-4">
  <MessageCircle className="h-7 w-7 text-muted-foreground/40" />
  </div>
  <p className="text-sm font-semibold text-muted-foreground">
  {language === "ar" ? "لا توجد محادثات نشطة" : "No active chats"}
  </p>
  <p className="text-xs text-muted-foreground/50 font-light mt-1">
  {language === "ar" ? "المحادثات متاحة فقط للوظائف التي لديها مضيفين معتمدين" : "Chats are available for gigs with approved ushers"}
  </p>
  </CardContent>
  </Card>
  ) : (
  <div className="space-y-2">
  {gigs.map((gig, i) => (
  <Link key={gig.id} href={`/dashboard/brand/chats/${gig.id}`}>
  <Card
  className="cursor-pointer animate-fade-in-up hover:shadow-md transition-shadow"
  style={{ animationDelay: `${0.1 + i * 0.05}s` }}
  >
  <CardContent className="p-4 flex items-center justify-between gap-3">
  <div className="flex items-center gap-3 min-w-0">
  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
  <MessageCircle className="h-5 w-5 text-primary" />
  </div>
  <div className="min-w-0">
  <h3 className="text-sm font-bold truncate">{gig.title}</h3>
  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
  <Users className="h-3 w-3" />
  {gig.approved_ushers} {language === "ar" ? "مضيف" : "ushers"}
  </p>
  </div>
  </div>
  <Badge className="shrink-0 bg-muted text-muted-foreground text-[10px] font-mono font-semibold">
  {language === "ar" ? "نشط" : "Active"}
  </Badge>
  </CardContent>
  </Card>
  </Link>
  ))}
  </div>
  )}
  </div>
  )
}
