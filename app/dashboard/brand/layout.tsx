"use client"

import { Button } from "@/components/ui/button"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { BottomNav } from "@/components/bottom-nav"
import { NotificationDropdown } from "@/components/notification-dropdown"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { PageLoader } from "@/components/page-loader"
import { LogOut, Building } from "lucide-react"

export default function BrandDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, logout } = useAuth()
  const { language, isRTL } = useLanguage()

  const handleLogout = () => {
    logout()
    window.location.href = "/"
  }

  if (!user) {
    return <PageLoader />
  }

  return (
    <ProtectedRoute requiredRole="brand">
      <div className={`min-h-screen bg-background ${isRTL ? "font-arabic" : ""}`} dir={isRTL ? "rtl" : "ltr"}>
        <header className="bg-card/70 backdrop-blur-md border-b border-border/50 sticky top-0 z-40">
          <div className="container mx-auto px-4 max-w-7xl flex items-center justify-end gap-1.5 py-2.5">
            <div className="mr-auto flex items-center gap-2">
              <Building className="h-4 w-4 text-secondary" />
              <span className="text-xs font-mono font-semibold text-muted-foreground/50 tracking-widest uppercase hidden sm:block">
                {language === "ar" ? "لوحة العلامة التجارية" : "Brand Panel"}
              </span>
            </div>
            <ThemeToggle />
            <NotificationDropdown role="brand" />
            <LanguageSwitcher />
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline ml-1.5 text-xs">{language === "ar" ? "خروج" : "Logout"}</span>
            </Button>
          </div>
        </header>
        <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-28 max-w-7xl">
          {children}
        </main>
        <BottomNav role="brand" language={language} />
      </div>
    </ProtectedRoute>
  )
}
