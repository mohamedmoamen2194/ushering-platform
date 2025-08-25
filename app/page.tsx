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
    <div className={`min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-custom-black dark:to-custom-navy ${isRTL ? "font-arabic" : ""}`} dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="container mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 max-w-4xl flex flex-col items-center">
          {/* Logo */}
          <div className="w-16 h-16 rounded-lg overflow-hidden flex items-center justify-center mx-auto mb-2">
            <img src="/logo.png" alt="logo" className="w-full h-full object-cover" />
          </div>
          {/* Header Text */}
          <div className="text-center mb-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-card-foreground">{language === "ar" ? "مرحباً،" : "Welcome,"} {user ? user.name : ""}</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {language === "ar" ? "الصفحة الرئيسية" : "Home"}
            </p>
          </div>
          {/* Header Actions */}
          <div className="flex flex-wrap justify-center items-center gap-2 mt-2 w-full">
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
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            {language === "ar" ? "منصة أورا للضيافة" : "Aura Hospitality Platform"}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            {language === "ar" 
              ? "اربط العلامات التجارية مع المضيفين المحترفين لتجارب استثنائية في الفعاليات والمناسبات"
              : "Connect brands with professional ushers for exceptional event experiences"
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-custom-navy">
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {language === "ar" ? "لماذا تختار أورا؟" : "Why Choose Aura?"}
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Star className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>
                  {language === "ar" ? "مضيفون محترفون" : "Professional Ushers"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  {language === "ar" 
                    ? "مضيفون مدربون ومؤهلون لتقديم أفضل تجربة ضيافة"
                    : "Trained and qualified ushers for the best hospitality experience"
                  }
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <MapPin className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>
                  {language === "ar" ? "تغطية شاملة" : "Wide Coverage"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  {language === "ar" 
                    ? "خدماتنا متاحة في جميع أنحاء مصر"
                    : "Our services are available throughout Egypt"
                  }
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>
                  {language === "ar" ? "حجز سريع" : "Quick Booking"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  {language === "ar" 
                    ? "احجز مضيفيك في دقائق معدودة"
                    : "Book your ushers in just a few minutes"
                  }
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            {language === "ar" ? "ابدأ رحلتك معنا اليوم" : "Start Your Journey With Us Today"}
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            {language === "ar" 
              ? "انضم إلى آلاف المضيفين والعلامات التجارية الذين يثقون في أورا"
              : "Join thousands of ushers and brands who trust Aura"
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
            <p>&copy; 2024 Aura. {language === "ar" ? "جميع الحقوق محفوظة" : "All rights reserved"}.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
