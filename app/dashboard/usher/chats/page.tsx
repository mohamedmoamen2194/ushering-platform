"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GigChat } from "@/components/gig-chat"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { MessageCircle, RefreshCw, ArrowLeft, Building, CheckCircle } from "lucide-react"

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
  const [selectedGig, setSelectedGig] = useState<ApprovedGig | null>(null)

  useEffect(() => {
    if (user?.id) fetchApprovedGigs()
  }, [user?.id])

  useEffect(() => {
    const interval = setInterval(fetchApprovedGigs, 60000)
    return () => clearInterval(interval)
  }, [user?.id])

  const fetchApprovedGigs = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/applications/usher/${user?.id}?t=${Date.now()}`, { cache: "no-store" })
      const data = await res.json()
      if (data.success) {
        const approved = (data.applications || []).filter((a: any) =>
          a.status === "approved" && a.gig_id && (a.title || a.gig_title)
        )
        setApprovedGigs(approved)
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleBack = () => setSelectedGig(null)

  if (selectedGig && selectedGig.gig_id) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center gap-3 animate-fade-in-up">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-base font-bold">{selectedGig.title || selectedGig.gig_title}</h1>
            <p className="text-xs text-muted-foreground font-light">{selectedGig.company_name}</p>
          </div>
        </div>
        <div className="border rounded-xl overflow-hidden animate-fade-in-up">
          <GigChat
            gigId={selectedGig.gig_id}
            gigTitle={selectedGig.title || selectedGig.gig_title || "Gig"}
            userAccess="usher"
          />
        </div>
      </div>
    )
  }

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
          {language === "ar" ? `لديك ${approvedGigs.length} محادثة نشطة` : `${approvedGigs.length} active chats`}
        </p>
        <Button variant="ghost" size="sm" onClick={fetchApprovedGigs}>
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
        <div className="space-y-2">
          {approvedGigs.map((gig, i) => (
            <Card
              key={gig.id}
              className="card-hover cursor-pointer animate-fade-in-up"
              style={{ animationDelay: `${0.1 + i * 0.05}s` }}
              onClick={() => setSelectedGig(gig)}
            >
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
                    <MessageCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold truncate">{gig.title || gig.gig_title}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Building className="h-3 w-3" />
                      {gig.company_name}
                    </p>
                  </div>
                </div>
                <Badge className="shrink-0 bg-secondary/20 text-secondary text-[10px] font-mono font-semibold">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {language === "ar" ? "مقبول" : "Approved"}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
