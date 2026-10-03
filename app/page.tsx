"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { useTranslation } from "@/lib/i18n"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { Users, Briefcase, FileText, TrendingUp, Star, MapPin, Clock, ArrowRight } from 'lucide-react'
import { LogOut } from "lucide-react"
import Link from "next/link"

interface PlatformStats {
 totalUsers: number
 totalGigs: number
 totalApplications: number
 activeUsers: number
 isDemo?: boolean
 error?: string
}

export default function HomePage() {
 const { user, logout } = useAuth()
 const { language, isRTL } = useLanguage()
 const { t } = useTranslation(language)
 const [stats, setStats] = useState<PlatformStats | null>(null)
 const [isLoading, setIsLoading] = useState(true)
 const [error, setError] = useState<string | null>(null)

 useEffect(() => {
 fetchPlatformStats()
 }, [])

 const fetchPlatformStats = async () => {
 try {
 setIsLoading(true)
 setError(null)

 const response = await fetch('/api/platform/stats')

 if (!response.ok) {
 throw new Error(`HTTP error! status: ${response.status}`)
 }

 const contentType = response.headers.get('content-type')
 if (!contentType || !contentType.includes('application/json')) {
 const text = await response.text()
 throw new Error(`Expected JSON, got: ${text.substring(0, 100)}...`)
 }

 const data = await response.json()
 setStats(data)
 } catch (err) {
 console.error('Failed to fetch platform stats:', err)
 setError(err instanceof Error ? err.message : 'Unknown error')

 // Set fallback demo stats
 setStats({
 totalUsers: 1250,
 totalGigs: 89,
 totalApplications: 456,
 activeUsers: 234,
 isDemo: true,
 error: 'Using demo data'
 })
 } finally {
 setIsLoading(false)
 }
 }

 const handleLogout = () => { logout(); }

 return (
 <div className={`min-h-screen bg-background ${isRTL ? "font-arabic" : ""}`} dir={isRTL ? "rtl" : "ltr"}>
 {/* Header — sticky so it stays visible on scroll */}
 <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90">
  <div className="container mx-auto px-3 sm:px-4 max-w-7xl flex items-center justify-between gap-1.5 py-2 sm:py-3">
  <Link href="/" className="flex items-center shrink-0">
  <img src="/logo.svg" alt="PlanZ gigs" className="h-12 sm:h-16 w-auto invert dark:invert-0" />
  </Link>
 <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
 <Link href="#stats" className="hover:text-foreground transition-colors">
 {language === "ar" ? "الإحصائيات" : "Statistics"}
 </Link>
 <Link href="#features" className="hover:text-foreground transition-colors">
 {language === "ar" ? "المميزات" : "Features"}
 </Link>
 <Link href="/dashboard/usher" className="hover:text-foreground transition-colors">
 {language === "ar" ? "للمضيفين" : "For Ushers"}
 </Link>
 <Link href="/dashboard/brand" className="hover:text-foreground transition-colors">
 {language === "ar" ? "للعلامات التجارية" : "For Brands"}
 </Link>
 </nav>
  <div className="flex items-center gap-0.5 sm:gap-2">
  <ThemeToggle />
  <LanguageSwitcher />
  {user ? (
  <Button variant="ghost" size="sm" onClick={handleLogout} className="h-8 px-2 text-xs">
  <LogOut className="h-4 w-4" />
  <span className="hidden sm:inline ml-1.5">{language === "ar" ? "خروج" : "Logout"}</span>
  </Button>
  ) : (
  <>
  <Link href="/auth/login">
  <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
  {language === "ar" ? "تسجيل الدخول" : "Login"}
  </Button>
  </Link>
  <Link href="/auth/register">
  <Button size="sm" className="h-8 px-2.5 text-xs">
  {language === "ar" ? "تسجيل" : "Register"}
  </Button>
  </Link>
  </>
  )}
  </div>
 </div>
 </header>

 {/* Hero Section */}
 <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-b border-border bg-background">
 <div className="max-w-7xl mx-auto text-center">
 <Badge variant="secondary" className="mb-6 font-medium">
 {language === "ar" ? "منصة رائدة في عالم الضيافة" : "Leading Hospitality Platform"}
 </Badge>
 <div className="flex justify-center mb-8">
  <img src="/logo.svg" alt="PlanZ gigs" className="h-24 sm:h-28 w-auto invert dark:invert-0" />
 </div>
 <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground mb-4">
 {language === "ar" ? "بلان زي جيغس" : "PlanZ gigs"}
 </h1>
 <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
 {language === "ar"
 ? "اربط العلامات التجارية مع المضيفين المحترفين لتجارب استثنائية في الفعاليات والمناسبات"
 : "Connect brands with professional ushers for exceptional event experiences"
 }
 </p>
 <div className="flex flex-col sm:flex-row gap-3 justify-center">
 <Link href="/auth/register?role=usher">
 <Button size="lg" className="w-full sm:w-auto">
 {language === "ar" ? "انضم كمضيف" : "Join as Usher"}
 <ArrowRight className="ml-2 h-5 w-5" />
 </Button>
 </Link>
 <Link href="/auth/register?role=brand">
 <Button size="lg" variant="outline" className="w-full sm:w-auto">
 {language === "ar" ? "انضم كعلامة تجارية" : "Join as Brand"}
 </Button>
 </Link>
 </div>
 </div>
 </section>

 {/* Stats Section */}
 <section id="stats" className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/40 border-b border-border scroll-mt-16">
 <div className="max-w-7xl mx-auto">
 <div className="text-center mb-10">
 <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
 {language === "ar" ? "إحصائيات المنصة" : "Platform Statistics"}
 </h2>
 {error && (
 <p className="text-destructive mb-4 text-sm">
 {language === "ar" ? "خطأ في تحميل الإحصائيات" : "Error loading statistics"}
 </p>
 )}
 {stats?.isDemo && (
 <Badge variant="outline" className="mb-4">
 {language === "ar" ? "بيانات تجريبية" : "Demo Data"}
 </Badge>
 )}
 </div>

 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
 <Card>
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">
 {language === "ar" ? "إجمالي المستخدمين" : "Total Users"}
 </CardTitle>
 <Users className="h-4 w-4 text-muted-foreground" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold">
 {isLoading ? "..." : stats?.totalUsers?.toLocaleString() || "0"}
 </div>
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">
 {language === "ar" ? "إجمالي الوظائف" : "Total Gigs"}
 </CardTitle>
 <Briefcase className="h-4 w-4 text-muted-foreground" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold">
 {isLoading ? "..." : stats?.totalGigs?.toLocaleString() || "0"}
 </div>
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">
 {language === "ar" ? "إجمالي الطلبات" : "Total Applications"}
 </CardTitle>
 <FileText className="h-4 w-4 text-muted-foreground" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold">
 {isLoading ? "..." : stats?.totalApplications?.toLocaleString() || "0"}
 </div>
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">
 {language === "ar" ? "المستخدمون النشطون" : "Active Users"}
 </CardTitle>
 <TrendingUp className="h-4 w-4 text-muted-foreground" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold">
 {isLoading ? "..." : stats?.activeUsers?.toLocaleString() || "0"}
 </div>
 </CardContent>
 </Card>
 </div>
 </div>
 </section>

 {/* Features Section */}
 <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-background scroll-mt-16">
 <div className="max-w-7xl mx-auto">
 <div className="text-center mb-12">
 <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
 {language === "ar" ? "لماذا تختار بلان زي جيغس؟" : "Why Choose PlanZ gigs?"}
 </h2>
 <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
 {language === "ar"
 ? "منصتنا تجمع الأفضل في عالم الضيافة والخدمات"
 : "Our platform brings together the best in hospitality and services"}
 </p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <Card>
 <CardContent className="p-6 sm:p-8">
 <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-5">
 <Star className="h-6 w-6 text-primary" />
 </div>
 <h3 className="text-lg font-semibold mb-2 text-card-foreground">
 {language === "ar" ? "مضيفون محترفون" : "Professional Ushers"}
 </h3>
 <p className="text-muted-foreground text-sm leading-relaxed">
 {language === "ar"
 ? "مضيفون مدربون ومؤهلون لتقديم أفضل تجربة ضيافة لعملائك"
 : "Trained and qualified ushers delivering exceptional hospitality experiences"}
 </p>
 </CardContent>
 </Card>

 <Card>
 <CardContent className="p-6 sm:p-8">
 <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-5">
 <MapPin className="h-6 w-6 text-primary" />
 </div>
 <h3 className="text-lg font-semibold mb-2 text-card-foreground">
 {language === "ar" ? "تغطية شاملة" : "Nationwide Coverage"}
 </h3>
 <p className="text-muted-foreground text-sm leading-relaxed">
 {language === "ar"
 ? "خدماتنا متاحة في جميع أنحاء مصر لتلبية احتياجاتك أينما كنت"
 : "Our services are available across all of Egypt, wherever you need us"}
 </p>
 </CardContent>
 </Card>

 <Card>
 <CardContent className="p-6 sm:p-8">
 <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-5">
 <Clock className="h-6 w-6 text-primary" />
 </div>
 <h3 className="text-lg font-semibold mb-2 text-card-foreground">
 {language === "ar" ? "حجز سريع" : "Quick Booking"}
 </h3>
 <p className="text-muted-foreground text-sm leading-relaxed">
 {language === "ar"
 ? "احجز مضيفيك في دقائق معدودة بعملية سلسة ومبسطة"
 : "Book your ushers in minutes with a smooth, streamlined process"}
 </p>
 </CardContent>
 </Card>
 </div>
 </div>
 </section>

 {/* CTA Section */}
 <section className="py-16 px-4 sm:px-6 lg:px-8 bg-primary">
 <div className="max-w-4xl mx-auto text-center">
 <h2 className="text-2xl sm:text-3xl font-bold text-primary-foreground mb-4">
 {language === "ar" ? "ابدأ رحلتك معنا اليوم" : "Start Your Journey With Us Today"}
 </h2>
 <p className="text-lg text-primary-foreground/80 mb-8">
 {language === "ar"
 ? "انضم إلى آلاف المضيفين والعلامات التجارية الذين يثقون في أورا"
 : "Join thousands of ushers and brands who trust PlanZ gigs"
 }
 </p>
 <div className="flex flex-col sm:flex-row gap-3 justify-center">
 <Link href="/auth/register?role=usher">
 <Button size="lg" variant="secondary" className="w-full sm:w-auto">
 {language === "ar" ? "سجل كمضيف" : "Register as Usher"}
 </Button>
 </Link>
 <Link href="/auth/register?role=brand">
 <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/10 hover:text-primary-foreground">
 {language === "ar" ? "سجل كعلامة تجارية" : "Register as Brand"}
 </Button>
 </Link>
 </div>
 </div>
 </section>

 {/* Footer */}
 <footer className="bg-card border-t border-border py-12 px-4 sm:px-6 lg:px-8">
 <div className="max-w-7xl mx-auto">
 <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
 <div>
 <h4 className="font-semibold mb-4 text-foreground">
 {language === "ar" ? "للمضيفين" : "For Ushers"}
 </h4>
 <ul className="space-y-2 text-sm text-muted-foreground">
 <li>
 <Link href="/auth/register?role=usher" className="hover:text-foreground transition-colors">
 {language === "ar" ? "انضم كمضيف" : "Join as Usher"}
 </Link>
 </li>
 <li>
 <Link href="/dashboard/usher" className="hover:text-foreground transition-colors">
 {language === "ar" ? "لوحة التحكم" : "Dashboard"}
 </Link>
 </li>
 </ul>
 </div>

 <div>
 <h4 className="font-semibold mb-4 text-foreground">
 {language === "ar" ? "للعلامات التجارية" : "For Brands"}
 </h4>
 <ul className="space-y-2 text-sm text-muted-foreground">
 <li>
 <Link href="/auth/register?role=brand" className="hover:text-foreground transition-colors">
 {language === "ar" ? "انضم كعلامة تجارية" : "Join as Brand"}
 </Link>
 </li>
 <li>
 <Link href="/dashboard/brand" className="hover:text-foreground transition-colors">
 {language === "ar" ? "لوحة التحكم" : "Dashboard"}
 </Link>
 </li>
 </ul>
 </div>

 <div>
 <h4 className="font-semibold mb-4 text-foreground">
 {language === "ar" ? "المنصة" : "Platform"}
 </h4>
 <ul className="space-y-2 text-sm text-muted-foreground">
 <li>
 <Link href="/" className="hover:text-foreground transition-colors">
 {language === "ar" ? "الرئيسية" : "Home"}
 </Link>
 </li>
 <li>
 <Link href="/auth/login" className="hover:text-foreground transition-colors">
 {language === "ar" ? "تسجيل الدخول" : "Login"}
 </Link>
 </li>
 </ul>
 </div>

 <div>
 <h4 className="font-semibold mb-4 text-foreground">
 {language === "ar" ? "تواصل معنا" : "Contact"}
 </h4>
 <ul className="space-y-2 text-sm text-muted-foreground">
 <li>
 <a href="mailto:mohamedmoamen1230@gmail.com" className="hover:text-foreground transition-colors">
 Email
 </a>
 </li>
 </ul>
 </div>
 </div>

 <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
 <p>&copy; 2024 PlanZ gigs. {language === "ar" ? "جميع الحقوق محفوظة" : "All rights reserved"}.</p>
 </div>
 </div>
 </footer>
 </div>
 )
}
