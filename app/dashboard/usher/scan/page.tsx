"use client"

import { useState, useEffect, lazy, Suspense } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { QrCode, History, Clock, MapPin, RefreshCw, Camera, ScanLine } from "lucide-react"

const QRScanner = lazy(() => import("@/components/qr-scanner").then((m) => ({ default: m.QRScanner })))

export default function UsherScanPage() {
  const { user } = useAuth()
  const { language, isRTL } = useLanguage()
  const [history, setHistory] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [view, setView] = useState<"scan" | "history">("scan")

  useEffect(() => {
    if (user?.id) fetchHistory()
  }, [user?.id])

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true)
      const res = await fetch(`/api/users/${user?.id}/history?t=${Date.now()}`)
      const data = await res.json()
      if (data.success) setHistory(data.history || [])
      else setHistory([])
    } catch (e) { console.error(e); setHistory([]) }
    finally { setHistoryLoading(false) }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight">
          <span className="bg-gradient-to-r from-accent to-secondary bg-clip-text text-transparent">
            {language === "ar" ? "ماسح QR" : "QR Scanner"}
          </span>
        </h1>
        <p className="text-xs text-muted-foreground font-light mt-0.5">
          {language === "ar" ? "سجل حضورك وانصرافك باستخدام رمز QR" : "Check in & out by scanning QR codes"}
        </p>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
        <Button
          variant={view === "scan" ? "default" : "outline"}
          size="sm"
          onClick={() => setView("scan")}
          className="flex-1 text-xs font-mono font-semibold"
        >
          <Camera className="h-3.5 w-3.5 mr-1.5" />
          {language === "ar" ? "المسح" : "Scan"}
        </Button>
        <Button
          variant={view === "history" ? "default" : "outline"}
          size="sm"
          onClick={() => setView("history")}
          className="flex-1 text-xs font-mono font-semibold"
        >
          <History className="h-3.5 w-3.5 mr-1.5" />
          {language === "ar" ? "السجل" : "History"}
          {!historyLoading && history.length > 0 && (
            <span className="ml-1.5 text-[10px] opacity-70">({history.length})</span>
          )}
        </Button>
      </div>

      {/* Scanner View */}
      {view === "scan" && (
        <div className="animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary via-secondary to-accent rounded-2xl blur-xl opacity-20" />
            <div className="relative">
              <Suspense fallback={<div className="w-full aspect-[3/4] rounded-2xl bg-muted/50 flex items-center justify-center"><Camera className="h-8 w-8 text-muted-foreground/30 animate-pulse" /></div>}><QRScanner /></Suspense>
            </div>
          </div>
        </div>
      )}

      {/* History View */}
      {view === "history" && (
        <div className="animate-fade-in-up space-y-3" style={{ animationDelay: "0.15s" }}>
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono font-bold text-muted-foreground/40 tracking-[0.2em] uppercase">
              {language === "ar" ? "سجل المسح" : "Scan History"}
            </h2>
            <Button variant="ghost" size="sm" onClick={fetchHistory}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>

          {historyLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4"><div className="h-4 w-40 bg-muted rounded mb-2" /><div className="h-3 w-24 bg-muted rounded" /></CardContent>
                </Card>
              ))}
            </div>
          ) : history.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center py-12">
                <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                  <ScanLine className="h-7 w-7 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-semibold text-muted-foreground">
                  {language === "ar" ? "لا يوجد سجل مسح" : "No scan history yet"}
                </p>
                <p className="text-xs text-muted-foreground/50 font-light mt-1">
                  {language === "ar" ? "قم بمسح رمز QR لتسجيل حضورك" : "Scan a QR code to record attendance"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {history.map((item: any, i: number) => (
                <Card key={i} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.03}s` }}>
                  <CardContent className="p-3 sm:p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        item.action === "check_in" ? "bg-secondary/20" : "bg-accent/20"
                      }`}>
                        <Clock className={`h-4 w-4 ${item.action === "check_in" ? "text-secondary" : "text-accent"}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{item.gig_title || "Gig"}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground/70 font-mono mt-0.5">
                          <span>{new Date(item.checked_in_at || item.timestamp).toLocaleTimeString(language === "ar" ? "ar-EG" : "en-US", {
                            hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Africa/Cairo",
                          })}</span>
                          {item.location && (
                            <>
                              <span className="text-muted-foreground/30">Â·</span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />{item.location}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge className={`shrink-0 text-[10px] font-mono font-semibold ${
                      item.action === "check_in"
                        ? "bg-secondary/20 text-secondary"
                        : "bg-accent/20 text-accent"
                    }`}>
                      {item.action === "check_in"
                        ? (language === "ar" ? "حضور" : "IN")
                        : (language === "ar" ? "انصراف" : "OUT")}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
