"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { Users, Briefcase, Phone, BarChart3, TrendingUp, Activity } from "lucide-react"
import Link from "next/link"

export default function AdminDashboard() {
 const { user } = useAuth()
 const { language, isRTL } = useLanguage()
 const [platformStats, setPlatformStats] = useState({
 totalUsers: 0,
 totalGigs: 0,
 verifiedNumbers: 0,
 activeUshers: 0,
 })

 useEffect(() => {
 fetchPlatformStats()
 }, [])

 const fetchPlatformStats = async () => {
 try {
 const res = await fetch("/api/platform/stats")
 const data = await res.json()
 if (data.success) {
 setPlatformStats(data.stats || {})
 }
 } catch (e) { console.error(e) }
 }

  const statCards = [
  { icon: Users, value: platformStats.totalUsers, label: language === "ar" ? "إجمالي المستخدمين" : "Total Users" },
  { icon: Briefcase, value: platformStats.totalGigs, label: language === "ar" ? "إجمالي الوظائف" : "Total Gigs" },
  { icon: Phone, value: platformStats.verifiedNumbers, label: language === "ar" ? "الأرقام الموثقة" : "Verified Numbers" },
  { icon: TrendingUp, value: platformStats.activeUshers, label: language === "ar" ? "المضيفون النشطون" : "Active Ushers" },
  ]

 const quickLinks = [
 { href: "/admin/verified-numbers", icon: Phone, label: language === "ar" ? "الأرقام الموثقة" : "Verified Numbers", desc: language === "ar" ? "إدارة أرقام الهواتف الموثقة" : "Manage verified phone numbers" },
 { href: "/admin/users", icon: Users, label: language === "ar" ? "المستخدمين" : "Users", desc: language === "ar" ? "عرض وإدارة جميع المستخدمين" : "View and manage all users" },
 { href: "/admin/gigs", icon: Briefcase, label: language === "ar" ? "الوظائف" : "Gigs", desc: language === "ar" ? "الإشراف على جميع الوظائف في المنصة" : "Oversee all gigs on the platform" },
 ]

 return (
 <div className="max-w-5xl mx-auto space-y-6">
 <div className="animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
 <div className="flex items-center gap-3 mb-1">
 <BarChart3 className="h-5 w-5 text-primary" />
 <h1 className="text-xl sm:text-3xl font-bold tracking-tight">
 <span className="text-foreground">
 {language === "ar" ? "لوحة الإدارة" : "Admin Dashboard"}
 </span>
 </h1>
 </div>
 <p className="text-xs sm:text-sm text-muted-foreground font-light ml-8">
 {language === "ar" ? "نظرة عامة على المنصة" : "Platform overview at a glance"}
 </p>
 </div>

 {/* Stats Grid */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
 {statCards.map((s) => (
 <Card key={s.label} >
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
 <CardTitle className="text-[10px] font-mono font-semibold text-muted-foreground/60 tracking-[0.15em] uppercase">
 {s.label.split(" ")[0]}
 </CardTitle>
  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
  <s.icon className="h-4 w-4 text-primary" />
  </div>
 </CardHeader>
 <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
 <div className="text-2xl sm:text-3xl font-mono font-bold tracking-tight">
 {s.value.toLocaleString()}
 </div>
 <p className="text-[10px] sm:text-xs text-muted-foreground/70 font-light mt-0.5">{s.label}</p>
 </CardContent>
 </Card>
 ))}
 </div>

 {/* Quick Links */}
 <div className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
 <h2 className="text-xs font-mono font-bold text-muted-foreground/40 tracking-[0.2em] uppercase mb-3 px-1">
 {language === "ar" ? "الإدارة السريعة" : "Quick Management"}
 </h2>
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
 {quickLinks.map((link, i) => (
 <Link key={link.href} href={link.href}>
 <Card className="h-full group">
 <CardContent className="p-4 sm:p-5 flex items-start gap-4">
 <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 ">
 <link.icon className="h-5 w-5 text-primary" />
 </div>
 <div>
 <p className="text-sm font-bold">{link.label}</p>
 <p className="text-xs text-muted-foreground/60 font-light mt-0.5">{link.desc}</p>
 </div>
 </CardContent>
 </Card>
 </Link>
 ))}
 </div>
 </div>

 {/* Activity */}
 <div className="animate-fade-in-up" style={{ animationDelay: "0.25s" }}>
 <Card className="bg-muted/40 border-border">
 <CardContent className="p-4 sm:p-5 flex items-start gap-3">
 <Activity className="h-5 w-5 text-primary shrink-0 mt-0.5" />
 <div>
 <p className="text-sm font-bold">
 {language === "ar" ? "المنصة تعمل بكفاءة" : "Platform Running Smoothly"}
 </p>
 <p className="text-xs text-muted-foreground font-light mt-0.5">
 {language === "ar"
 ? `مرحباً بك يا ${user?.name || "مشرف"}، يمكنك إدارة المنصة من خلال الروابط أعلاه`
 : `Welcome ${user?.name || "Admin"}, manage the platform using the links above`}
 </p>
 </div>
 </CardContent>
 </Card>
 </div>
 </div>
 )
}
