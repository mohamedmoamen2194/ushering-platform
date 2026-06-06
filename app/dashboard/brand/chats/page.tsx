"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GigChat } from "@/components/gig-chat"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { MessageCircle, RefreshCw, ArrowLeft, Users, Calendar } from "lucide-react"

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
  const { language, isRTL } = useLanguage()
  const [gigs, setGigs] = useState<BrandGig[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGig, setSelectedGig] = useState<BrandGig | null>(null)

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

  if (selectedGig) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center gap-3 animate-fade-in-up">
          <Button variant="ghost" size="sm" onClick={() => setSelectedGig(null)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-base font-bold">{selectedGig.title}</h1>
            <p className="text-xs text-muted-foreground font-light">{selectedGig.location}</p>
          </div>
        </div>
        <div className="border rounded-xl overflow-hidden animate-fade-in-up">
          <GigChat gigId={selectedGig.id} gigTitle={selectedGig.title} userAccess="brand" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight">
          <span className="bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
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
            <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
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
            <Card
              key={gig.id}
              className="card-hover cursor-pointer animate-fade-in-up"
              style={{ animationDelay: `${0.1 + i * 0.05}s` }}
              onClick={() => setSelectedGig(gig)}
            >
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary/20 to-accent/20 flex items-center justify-center shrink-0">
                    <MessageCircle className="h-5 w-5 text-secondary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold truncate">{gig.title}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Users className="h-3 w-3" />
                      {gig.approved_ushers} {language === "ar" ? "مضيف" : "ushers"}
                    </p>
                  </div>
                </div>
                <Badge className="shrink-0 bg-accent/20 text-accent text-[10px] font-mono font-semibold">
                  {language === "ar" ? "نشط" : "Active"}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
