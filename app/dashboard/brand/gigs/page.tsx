"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import {
  Briefcase, MapPin, Calendar, DollarSign, Users, RefreshCw,
  MessageCircle, UserCheck, Star, QrCode, Clock, ArrowRight,
  ExternalLink, Map, X, CheckCircle, XCircle, User, Save,
} from "lucide-react"
import Link from "next/link"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { QRCodeDisplay } from "@/components/qr-code-display"

interface ApprovedUsher {
  id: number
  usher_id: number
  usher_name: string
  usher_rating: number
  role: string | null
}

export default function BrandGigsPage() {
  const { user } = useAuth()
  const { language, isRTL } = useLanguage()
  const [gigs, setGigs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGig, setSelectedGig] = useState<any | null>(null)
  const [approvedUshers, setApprovedUshers] = useState<ApprovedUsher[]>([])
  const [loadingUshers, setLoadingUshers] = useState(false)
  const [roleInputs, setRoleInputs] = useState<Record<number, string>>({})
  const [savingRole, setSavingRole] = useState<number | null>(null)

  useEffect(() => { fetchGigs() }, [user?.id])

  const fetchGigs = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/gigs?role=brand&userId=${user?.id}&t=${Date.now()}`)
      const data = await res.json()
      if (data.success !== false) setGigs(data.gigs || [])
      else setGigs([])
    } catch (e) { console.error(e); setGigs([]) }
    finally { setLoading(false) }
  }

  const formatStartTime = (startDatetime: string) => {
    if (!startDatetime) return "N/A"
    try {
      if (/^\d{2}:\d{2}$/.test(startDatetime)) return startDatetime
      if (/^\d{4}-\d{2}-\d{2}$/.test(startDatetime)) return startDatetime
      const d = new Date(startDatetime)
      if (isNaN(d.getTime())) return "Invalid"
      return d.toLocaleTimeString(language === "ar" ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Africa/Cairo" })
    } catch { return "Invalid" }
  }

  const formatDate = (d: string) =>
    d ? new Date(d).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "Africa/Cairo" }) : "—"

  const openGigDialog = async (gig: any) => {
    setSelectedGig(gig)
    setRoleInputs({})
    fetchApprovedUshers(gig.id)
  }

  const fetchApprovedUshers = async (gigId: number) => {
    try {
      setLoadingUshers(true)
      const res = await fetch(`/api/applications/brand/${user?.id}?status=approved&gigId=${gigId}&t=${Date.now()}`)
      const data = await res.json()
      if (data.success) {
        const ushers = (data.applications || []).map((a: any) => ({
          id: a.id,
          usher_id: a.usher_id,
          usher_name: a.usher_name,
          usher_rating: a.usher_rating || 0,
          role: a.role || null,
        }))
        setApprovedUshers(ushers)
        const roles: Record<number, string> = {}
        ushers.forEach((u: ApprovedUsher) => { if (u.role) roles[u.id] = u.role })
        setRoleInputs(roles)
      } else {
        setApprovedUshers([])
      }
    } catch (e) { console.error(e); setApprovedUshers([]) }
    finally { setLoadingUshers(false) }
  }

  const handleAssignRole = async (applicationId: number) => {
    const role = roleInputs[applicationId] || ""
    try {
      setSavingRole(applicationId)
      const res = await fetch("/api/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, role }),
      })
      const data = await res.json()
      if (data.success) {
        alert(language === "ar" ? "تم حفظ الدور" : "Role saved")
        setApprovedUshers(prev => prev.map(u => u.id === applicationId ? { ...u, role } : u))
      }
    } catch (e) { console.error(e) }
    finally { setSavingRole(null) }
  }

  const getMapEmbedUrl = (link: string | null | undefined, location: string | null | undefined) => {
    if (link) {
      try {
        const url = new URL(link)
        if (url.hostname.includes('google') && url.pathname.includes('/maps')) {
          const q = url.searchParams.get('q')
          if (q) return `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`
        }
      } catch {}
    }
    return location ? `https://www.google.com/maps?q=${encodeURIComponent(location)}&output=embed` : ""
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight">
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {language === "ar" ? "وظائفي" : "My Gigs"}
          </span>
        </h1>
        <p className="text-xs text-muted-foreground font-light mt-0.5">
          {language === "ar" ? "إدارة وعرض جميع وظائفك" : "Manage and view all your gigs"}
        </p>
      </div>

      <div className="flex justify-between items-center animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
        <p className="text-xs font-mono text-muted-foreground/50">
          {language === "ar" ? `لديك ${gigs.length} وظيفة` : `${gigs.length} gigs total`}
        </p>
        <Button variant="ghost" size="sm" onClick={fetchGigs}>
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 sm:p-5"><div className="h-5 w-48 bg-muted rounded mb-3" /><div className="h-3 w-32 bg-muted rounded" /></CardContent>
            </Card>
          ))}
        </div>
      ) : gigs.length === 0 ? (
        <Card className="animate-fade-in-up border-dashed" style={{ animationDelay: "0.15s" }}>
          <CardContent className="flex flex-col items-center py-14">
            <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
              <Briefcase className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-semibold text-muted-foreground">
              {language === "ar" ? "لا توجد وظائف بعد" : "No gigs yet"}
            </p>
            <p className="text-xs text-muted-foreground/50 font-light mt-1">
              {language === "ar" ? "قم بإنشاء وظيفة جديدة من الصفحة الرئيسية" : "Create a new gig from the home page"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {gigs.map((g, i) => {
            const statusColor = g.status === "active" ? "bg-secondary/20 text-secondary" : g.status === "completed" ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary"
            return (
              <button
                key={g.id}
                onClick={() => openGigDialog(g)}
                className="w-full text-left animate-fade-in-up block"
                style={{ animationDelay: `${0.1 + i * 0.05}s` }}
              >
                <Card className="cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all duration-200">
                  <div className={`h-1 w-full ${g.status === "active" ? "bg-secondary" : g.status === "completed" ? "bg-accent" : "bg-primary"}`} />
                  <CardContent className="p-4 sm:p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm sm:text-base font-bold">{g.title}</h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" /> {g.location}
                        </p>
                      </div>
                      <Badge className={`shrink-0 text-[10px] font-mono font-semibold ${statusColor}`}>
                        {g.status === "active" ? (language === "ar" ? "نشط" : "Active") : g.status === "completed" ? (language === "ar" ? "مكتمل" : "Completed") : g.status}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground/70 font-mono">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(g.start_date)}{g.end_date && g.end_date !== g.start_date ? ` — ${formatDate(g.end_date)}` : ""}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatStartTime(g.start_datetime)}</span>
                      <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{g.pay_rate} EGP/h</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{g.approved_ushers || 0}/{g.total_ushers_needed}</span>
                    </div>
                  </CardContent>
                </Card>
              </button>
            )
          })}
        </div>
      )}

      {/* Gig Detail Dialog */}
      <Dialog open={!!selectedGig} onOpenChange={(open) => { if (!open) { setSelectedGig(null); setApprovedUshers([]) } }}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
          {selectedGig && (
            <div className="space-y-5">
              {/* Header */}
              <DialogHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <DialogTitle className="text-lg sm:text-xl font-black">{selectedGig.title}</DialogTitle>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" /> {selectedGig.location}
                    </p>
                  </div>
                  <Badge className={`shrink-0 text-[10px] font-mono font-semibold ${
                    selectedGig.status === "active" ? "bg-secondary/20 text-secondary" :
                    selectedGig.status === "completed" ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary"
                  }`}>
                    {selectedGig.status === "active" ? (language === "ar" ? "نشط" : "Active") :
                     selectedGig.status === "completed" ? (language === "ar" ? "مكتمل" : "Completed") : selectedGig.status}
                  </Badge>
                </div>
              </DialogHeader>

              {/* Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-3 bg-muted/30 rounded-xl">
                  <p className="text-[10px] font-mono text-muted-foreground/60 mb-1">{language === "ar" ? "التاريخ" : "Date"}</p>
                  <p className="text-xs font-semibold">{formatDate(selectedGig.start_date)}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-xl">
                  <p className="text-[10px] font-mono text-muted-foreground/60 mb-1">{language === "ar" ? "الوقت" : "Time"}</p>
                  <p className="text-xs font-semibold">{formatStartTime(selectedGig.start_datetime)}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-xl">
                  <p className="text-[10px] font-mono text-muted-foreground/60 mb-1">{language === "ar" ? "المدة" : "Duration"}</p>
                  <p className="text-xs font-semibold">{selectedGig.duration_hours}h{language === "ar" ? " يومياً" : " daily"}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-xl">
                  <p className="text-[10px] font-mono text-muted-foreground/60 mb-1">{language === "ar" ? "الأجر" : "Rate"}</p>
                  <p className="text-xs font-semibold">{selectedGig.pay_rate} EGP/h</p>
                </div>
              </div>

              {/* Description */}
              {selectedGig.description && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground/70 mb-1">{language === "ar" ? "الوصف" : "Description"}</p>
                  <p className="text-xs text-muted-foreground/80 leading-relaxed whitespace-pre-wrap">{selectedGig.description}</p>
                </div>
              )}

              {/* Dress Code & Requirements */}
              {(selectedGig.dress_code || selectedGig.additional_requirements) && (
                <div className="flex flex-wrap gap-2">
                  {selectedGig.dress_code && (
                    <Badge variant="outline" className="text-[10px]">{language === "ar" ? "قواعد اللبس:" : "Dress Code:"} {selectedGig.dress_code}</Badge>
                  )}
                  {selectedGig.additional_requirements && (
                    <Badge variant="outline" className="text-[10px]">{language === "ar" ? "متطلبات إضافية" : "Extra reqs"}</Badge>
                  )}
                </div>
              )}

              {/* Approved Ushers with Roles */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-mono font-bold text-muted-foreground/40 tracking-[0.2em] uppercase flex items-center gap-1">
                    <UserCheck className="h-3 w-3" />
                    {language === "ar" ? "المضيفون المقبولون" : "Accepted Ushers"}
                    <span className="text-xs font-mono text-muted-foreground/30">({approvedUshers.length}/{selectedGig.total_ushers_needed})</span>
                  </h3>
                  {selectedGig.pending_applications > 0 && (
                    <Link href={`/dashboard/brand/applications?gigId=${selectedGig.id}`}>
                      <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 text-[10px] cursor-pointer hover:opacity-80">
                        {selectedGig.pending_applications} {language === "ar" ? "معلق" : "pending"}
                      </Badge>
                    </Link>
                  )}
                </div>
                {loadingUshers ? (
                  <div className="space-y-2">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-12 bg-muted/30 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : approvedUshers.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-border/50 text-center">
                    <User className="h-5 w-5 mx-auto text-muted-foreground/30 mb-1" />
                    <p className="text-xs text-muted-foreground/50">
                      {language === "ar" ? "لم يتم قبول أي مضيف بعد" : "No ushers accepted yet"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {approvedUshers.map((usher) => (
                      <div key={usher.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-muted/10">
                        <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                          <User className="h-4 w-4 text-muted-foreground/60" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold truncate">{usher.usher_name}</span>
                            <span className="flex items-center gap-0.5 text-xs text-yellow-500 shrink-0">
                              <Star className="h-3 w-3 fill-yellow-500" />
                              {Number(usher.usher_rating) > 0 ? Number(usher.usher_rating).toFixed(1) : "0.0"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Input
                              value={roleInputs[usher.id] || ""}
                              onChange={(e) => setRoleInputs(prev => ({ ...prev, [usher.id]: e.target.value }))}
                              placeholder={language === "ar" ? "الدور (مثل: قائد فريق)" : "Role (e.g. Team Lead)"}
                              className="h-7 text-[11px] bg-background border-border/50 flex-1 min-w-0"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 shrink-0"
                              onClick={() => handleAssignRole(usher.id)}
                              disabled={savingRole === usher.id}
                            >
                              {savingRole === usher.id ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : (
                                <Save className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
                <Link href={`/dashboard/brand/applications?gigId=${selectedGig.id}`}>
                  <Button variant="outline" size="sm" className="text-xs h-8">
                    <UserCheck className="h-3 w-3 mr-1" />
                    {language === "ar" ? "الطلبات" : "Applications"}
                    {selectedGig.pending_applications > 0 && (
                      <span className="ml-1.5 text-[10px] opacity-70">({selectedGig.pending_applications})</span>
                    )}
                  </Button>
                </Link>
                {selectedGig.approved_ushers > 0 && (
                  <Link href={`/gig-chat/${selectedGig.id}`}>
                    <Button variant="outline" size="sm" className="text-xs h-8">
                      <MessageCircle className="h-3 w-3 mr-1" />
                      {language === "ar" ? "محادثة" : "Chat"}
                    </Button>
                  </Link>
                )}
                {selectedGig.location_link && (
                  <a href={selectedGig.location_link} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="text-xs h-8">
                      <Map className="h-3 w-3 mr-1" />
                      {language === "ar" ? "الموقع" : "Location"}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </a>
                )}
              </div>

              {/* QR Code Generator */}
              {selectedGig.status === "active" && (
                <div className="pt-2 border-t border-border/50">
                  <QRCodeDisplay
                    gigId={selectedGig.id}
                    brandId={Number(user?.id)}
                    gigTitle={selectedGig.title}
                    startTime={selectedGig.start_datetime || selectedGig.start_date}
                    durationHours={selectedGig.duration_hours}
                  />
                </div>
              )}

              {/* Map */}
              {(() => {
                const embedUrl = getMapEmbedUrl(selectedGig.location_link, selectedGig.location)
                if (!embedUrl) return null
                return (
                  <div className="rounded-xl overflow-hidden border border-border/50">
                    <iframe
                      src={embedUrl}
                      width="100%"
                      height="200"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title={selectedGig.location}
                      className="w-full"
                    />
                  </div>
                )
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
