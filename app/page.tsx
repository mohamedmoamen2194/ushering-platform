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
import { Users, Briefcase, FileText, TrendingUp, Star, MapPin, Clock, ArrowRight, CheckCircle } from 'lucide-react'
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
    <div className={`min-h-screen bg-gradient-to-br from-background to-muted dark:from-background dark:to-card ${isRTL ? "font-arabic" : ""}`} dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="container mx-auto px-4 max-w-7xl flex items-center justify-end gap-2 py-3">
          <ThemeToggle />
          <LanguageSwitcher />
          {user ? (
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              {language === "ar" ? "خروج" : "Logout"}
            </Button>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">
                  {language === "ar" ? "تسجيل الدخول" : "Login"}
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button variant="ghost" size="sm">
                  {language === "ar" ? "تسجيل" : "Register"}
                </Button>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-medium mb-8 neon-lamp-container">
            {language === "ar" ? "منصة رائدة في عالم الضيافة" : "Leading Hospitality Platform"}
          </div>
          <div className="flex justify-center mb-8">
            <img src="/logo.svg" alt="PlanZ gigs" className="h-20 sm:h-28 w-auto dark:filter-none filter invert" />
          </div>
          <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
            {language === "ar" 
              ? "اربط العلامات التجارية مع المضيفين المحترفين لتجارب استثنائية في الفعاليات والمناسبات"
              : "Connect brands with professional ushers for exceptional event experiences"
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register?role=usher">
              <Button size="lg" className="w-full sm:w-auto shadow-neon-primary/30 hover:shadow-neon-primary/50 transition-shadow duration-300">
                {language === "ar" ? "انضم كمضيف" : "Join as Usher"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/auth/register?role=brand">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-primary/40 hover:border-primary/60 hover:bg-primary/5">
                {language === "ar" ? "انضم كعلامة تجارية" : "Join as Brand"}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-card">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {language === "ar" ? "إحصائيات المنصة" : "Platform Statistics"}
            </h2>
            {error && (
              <p className="text-red-600 dark:text-red-400 mb-4">
                {language === "ar" ? "خطأ في تحميل الإحصائيات" : "Error loading statistics"}
              </p>
            )}
            {stats?.isDemo && (
              <Badge variant="secondary" className="mb-4">
                {language === "ar" ? "بيانات تجريبية" : "Demo Data"}
              </Badge>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <Card className="card-hover animate-fade-in-up">
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

            <Card className="card-hover animate-fade-in-up">
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

            <Card className="card-hover animate-fade-in-up">
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

            <Card className="card-hover animate-fade-in-up">
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
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/[0.02] to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                {language === "ar" ? "لماذا تختار بلان زي جيغس؟" : "Why Choose PlanZ gigs?"}
              </span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {language === "ar"
                ? "منصتنا تجمع الأفضل في عالم الضيافة والخدمات"
                : "Our platform brings together the best in hospitality and services"}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <div className="animate-fade-in-up">
              <div className="relative group rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm p-6 sm:p-8 card-hover neon-glow-cyan">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/30 to-accent/5 flex items-center justify-center mb-5 ring-1 ring-accent/20 group-hover:ring-accent/40 transition-all duration-300">
                  <Star className="h-7 w-7 text-accent icon-glow" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-card-foreground">
                  {language === "ar" ? "مضيفون محترفون" : "Professional Ushers"}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {language === "ar" 
                    ? "مضيفون مدربون ومؤهلون لتقديم أفضل تجربة ضيافة لعملائك"
                    : "Trained and qualified ushers delivering exceptional hospitality experiences"}
                </p>
              </div>
            </div>

            <div className="animate-fade-in-up">
              <div className="relative group rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm p-6 sm:p-8 card-hover neon-glow-lime">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary/30 to-secondary/5 flex items-center justify-center mb-5 ring-1 ring-secondary/20 group-hover:ring-secondary/40 transition-all duration-300">
                  <MapPin className="h-7 w-7 text-secondary icon-glow" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-card-foreground">
                  {language === "ar" ? "تغطية شاملة" : "Nationwide Coverage"}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {language === "ar" 
                    ? "خدماتنا متاحة في جميع أنحاء مصر لتلبية احتياجاتك أينما كنت"
                    : "Our services are available across all of Egypt, wherever you need us"}
                </p>
              </div>
            </div>

            <div className="animate-fade-in-up">
              <div className="relative group rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm p-6 sm:p-8 card-hover neon-glow-pink">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/5 flex items-center justify-center mb-5 ring-1 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300">
                  <Clock className="h-7 w-7 text-primary icon-glow" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-card-foreground">
                  {language === "ar" ? "حجز سريع" : "Quick Booking"}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {language === "ar" 
                    ? "احجز مضيفيك في دقائق معدودة بعملية سلسة ومبسطة"
                    : "Book your ushers in minutes with a smooth, streamlined process"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary to-accent">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            {language === "ar" ? "ابدأ رحلتك معنا اليوم" : "Start Your Journey With Us Today"}
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            {language === "ar" 
              ? "انضم إلى آلاف المضيفين والعلامات التجارية الذين يثقون في أورا"
              : "Join thousands of ushers and brands who trust PlanZ gigs"
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register?role=usher">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                {language === "ar" ? "سجل كمضيف" : "Register as Usher"}
              </Button>
            </Link>
            <Link href="/auth/register?role=brand">
            <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                {language === "ar" ? "سجل كعلامة تجارية" : "Register as Brand"}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 justify-items-center">
            <div className="text-center md:text-left">
              <h4 className="font-semibold mb-4">
                {language === "ar" ? "للمضيفين" : "For Ushers"}
              </h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/auth/register?role=usher" className="hover:text-white transition-colors">
                    {language === "ar" ? "انضم كمضيف" : "Join as Usher"}
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/usher" className="hover:text-white transition-colors">
                    {language === "ar" ? "لوحة التحكم" : "Dashboard"}
                  </Link>
                </li>
              </ul>
            </div>
            
            <div className="text-center md:text-left">
              <h4 className="font-semibold mb-4">
                {language === "ar" ? "للعلامات التجارية" : "For Brands"}
              </h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/auth/register?role=brand" className="hover:text-white transition-colors">
                    {language === "ar" ? "انضم كعلامة تجارية" : "Join as Brand"}
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/brand" className="hover:text-white transition-colors">
                    {language === "ar" ? "لوحة التحكم" : "Dashboard"}
                  </Link>
                </li>
              </ul>
            </div>
            
            <div className="text-center md:text-left">
              <h4 className="font-semibold mb-4">
                {language === "ar" ? "المنصة" : "Platform"}
              </h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/" className="hover:text-white transition-colors">
                    {language === "ar" ? "الرئيسية" : "Home"}
                  </Link>
                </li>
                <li>
                  <Link href="/auth/login" className="hover:text-white transition-colors">
                    {language === "ar" ? "تسجيل الدخول" : "Login"}
                  </Link>
                </li>
              </ul>
            </div>
            
            <div className="text-center md:text-left">
              <h4 className="font-semibold mb-4">
                {language === "ar" ? "تواصل معنا" : "Contact"}
              </h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="mailto:mohamedmoamen1230@gmail.com" className="hover:text-white transition-colors">
                    Email
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 dark:border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 PlanZ gigs. {language === "ar" ? "جميع الحقوق محفوظة" : "All rights reserved"}.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
