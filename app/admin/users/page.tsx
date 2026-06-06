"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/lib/language-context"
import { Search, Users, Shield, UserCheck, UserX, RefreshCw, Phone } from "lucide-react"

interface AppUser {
  id: number
  name: string
  phone: string
  email?: string
  role: "usher" | "brand" | "admin"
  language: "ar" | "en"
  created_at: string
}

export default function AdminUsersPage() {
  const { language, isRTL } = useLanguage()
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")

  useEffect(() => { fetchUsers() }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/users?all=true")
      const data = await res.json()
      if (data.success) setUsers(data.users || [])
      else setUsers([])
    } catch (e) { console.error(e); setUsers([]) }
    finally { setLoading(false) }
  }

  const filtered = users.filter((u) => {
    const matchSearch = !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.phone?.includes(search)
    const matchRole = roleFilter === "all" || u.role === roleFilter
    return matchSearch && matchRole
  })

  const roleBadge = (role: string) => {
    const config = {
      usher: { class: "bg-accent/20 text-accent", label: language === "ar" ? "مضيف" : "Usher" },
      brand: { class: "bg-secondary/20 text-secondary", label: language === "ar" ? "علامة تجارية" : "Brand" },
      admin: { class: "bg-primary/20 text-primary", label: language === "ar" ? "مشرف" : "Admin" },
    }
    return config[role as keyof typeof config] || config.usher
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight">
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {language === "ar" ? "إدارة المستخدمين" : "User Management"}
          </span>
        </h1>
        <p className="text-xs text-muted-foreground font-light mt-0.5">
          {language === "ar" ? "عرض وإدارة جميع مستخدمي المنصة" : "View and manage all platform users"}
        </p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-wrap gap-2 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
        <div className="relative flex-1 min-w-[200px]">
          <Search className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50`} />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={language === "ar" ? "بحث بالاسم أو الهاتف..." : "Search by name or phone..."}
            className={`${isRTL ? "pr-10" : "pl-10"} h-10 bg-muted/30 border-muted text-sm font-light`}
          />
        </div>
        {["all", "usher", "brand", "admin"].map((role) => (
          <Button
            key={role}
            variant={roleFilter === role ? "default" : "outline"}
            size="sm"
            onClick={() => setRoleFilter(role)}
            className="text-xs font-mono font-semibold tracking-tight"
          >
            {role === "all" ? (language === "ar" ? "الكل" : "All") : role.charAt(0).toUpperCase() + role.slice(1)}
          </Button>
        ))}
        <Button variant="ghost" size="sm" onClick={fetchUsers}>
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4"><div className="h-5 w-44 bg-muted rounded mb-2" /><div className="h-3 w-28 bg-muted rounded" /></CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="animate-fade-in-up border-dashed" style={{ animationDelay: "0.15s" }}>
          <CardContent className="flex flex-col items-center py-14">
            <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
              <Users className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-semibold text-muted-foreground">
              {language === "ar" ? "لا يوجد مستخدمين" : "No users found"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-mono text-muted-foreground/50 animate-fade-in-up">
            {language === "ar" ? `عرض ${filtered.length} مستخدم` : `Showing ${filtered.length} users`}
          </p>
          {filtered.map((u, i) => {
            const rb = roleBadge(u.role)
            return (
              <Card key={u.id} className="animate-fade-in-up" style={{ animationDelay: `${0.1 + i * 0.03}s` }}>
                <CardContent className="p-3 sm:p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      u.role === "admin" ? "bg-primary/20" : u.role === "brand" ? "bg-secondary/20" : "bg-accent/20"
                    }`}>
                      {u.role === "admin" ? <Shield className="h-5 w-5 text-primary" /> :
                       u.role === "brand" ? <UserCheck className="h-5 w-5 text-secondary" /> :
                       <UserX className="h-5 w-5 text-accent" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{u.name || "â€”"}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground/70 mt-0.5">
                        <span className="font-mono">{u.phone}</span>
                        {u.email && (
                          <>
                            <span className="text-muted-foreground/30">Â·</span>
                            <span className="truncate">{u.email}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge className={`shrink-0 text-[10px] font-mono font-semibold ${rb.class}`}>
                    {rb.label}
                  </Badge>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
