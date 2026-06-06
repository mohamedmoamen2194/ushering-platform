"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GigCard } from "@/components/gig-card"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { Search, Filter, RefreshCw, Briefcase, SlidersHorizontal } from "lucide-react"

export default function UsherGigsPage() {
  const { user } = useAuth()
  const { language, isRTL } = useLanguage()
  const [gigs, setGigs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const fetchGigs = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/gigs?userId=${user?.id}&role=usher&t=${Date.now()}`)
      const data = await res.json()
      if (data.success !== false) setGigs(data.gigs || [])
      else setGigs([])
    } catch (e) { console.error(e); setGigs([]) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (user?.id) fetchGigs()
  }, [user?.id])

  const handleApply = async (gigId: number) => {
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gigId, usherId: user?.id }),
      })
      const data = await res.json()
      if (data.success) {
        alert(language === "ar" ? "تم تقديم الطلب بنجاح!" : "Application submitted!")
        fetchGigs()
      } else {
        alert(data.error || (language === "ar" ? "فشل التقديم" : "Failed to apply"))
      }
    } catch (e) {
      console.error(e)
      alert(language === "ar" ? "حدث خطأ" : "Error")
    }
  }

  const filteredGigs = gigs.filter((g: any) =>
    !searchQuery || g.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight">
          <span className="bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
            {language === "ar" ? "الوظائف المتاحة" : "Available Gigs"}
          </span>
        </h1>
        <p className="text-xs text-muted-foreground font-light mt-0.5">
          {language === "ar" ? "تصفح أحدث فرص العمل" : "Browse the latest opportunities"}
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex gap-2 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
        <div className="relative flex-1">
          <Search className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50`} />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === "ar" ? "بحث عن وظيفة..." : "Search gigs..."}
            className={`${isRTL ? "pr-10" : "pl-10"} h-10 bg-muted/30 border-muted text-sm font-light`}
          />
        </div>
        <Button variant="outline" size="sm" className="h-10 w-10 p-0 border-muted">
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={fetchGigs} className="h-10 w-10 p-0 border-muted">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3 animate-fade-in-up">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 sm:p-6">
                <div className="h-5 w-48 bg-muted rounded mb-3" />
                <div className="h-3 w-32 bg-muted rounded mb-2" />
                <div className="h-3 w-24 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredGigs.length === 0 ? (
        <Card className="animate-fade-in-up border-dashed" style={{ animationDelay: "0.15s" }}>
          <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16">
            <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
              <Briefcase className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-semibold text-muted-foreground">
              {searchQuery
                ? (language === "ar" ? "لا توجد نتائج للبحث" : "No results found")
                : (language === "ar" ? "لا توجد وظائف متاحة حالياً" : "No gigs available right now")}
            </p>
            <p className="text-xs text-muted-foreground/50 font-light mt-1">
              {language === "ar" ? "حاول تغيير معايير البحث" : "Try adjusting your search"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          <p className="text-xs font-mono text-muted-foreground/50 animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
            {language === "ar" ? `عرض ${filteredGigs.length} وظيفة` : `Showing ${filteredGigs.length} gigs`}
          </p>
          {filteredGigs.map((gig, i) => (
            <div key={gig.id} className="animate-fade-in-up" style={{ animationDelay: `${0.15 + i * 0.05}s` }}>
              <GigCard gig={gig} language={language} userRole="usher" onApply={handleApply} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
