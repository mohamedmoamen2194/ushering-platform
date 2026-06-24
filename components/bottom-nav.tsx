"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { LayoutDashboard, Briefcase, FileText, MessageCircle, Phone, Users, User, Wallet, QrCode } from "lucide-react"

interface NavItem {
  href: string
  label: string
  arLabel: string
  icon: React.ReactNode
}

const usherNav: NavItem[] = [
  { href: "/dashboard/usher", label: "Home", arLabel: "الرئيسية", icon: <LayoutDashboard className="h-5 w-5" /> },
  { href: "/dashboard/usher/gigs", label: "Gigs", arLabel: "الوظائف", icon: <Briefcase className="h-5 w-5" /> },
  { href: "/dashboard/usher/scan", label: "Scan", arLabel: "مسح", icon: <QrCode className="h-5 w-5" /> },
  { href: "/dashboard/usher/chats", label: "Chats", arLabel: "المحادثات", icon: <MessageCircle className="h-5 w-5" /> },
  { href: "/dashboard/usher/payment", label: "Payment", arLabel: "الدفع", icon: <Wallet className="h-5 w-5" /> },
  { href: "/dashboard/usher/profile", label: "Profile", arLabel: "الملف", icon: <User className="h-5 w-5" /> },
]

const brandNav: NavItem[] = [
  { href: "/dashboard/brand", label: "Home", arLabel: "الرئيسية", icon: <LayoutDashboard className="h-5 w-5" /> },
  { href: "/dashboard/brand/gigs", label: "Gigs", arLabel: "الوظائف", icon: <Briefcase className="h-5 w-5" /> },
  { href: "/dashboard/brand/applications", label: "Apps", arLabel: "الطلبات", icon: <FileText className="h-5 w-5" /> },
  { href: "/dashboard/brand/chats", label: "Chats", arLabel: "المحادثات", icon: <MessageCircle className="h-5 w-5" /> },
  { href: "/dashboard/brand/balance", label: "Balance", arLabel: "الرصيد", icon: <Wallet className="h-5 w-5" /> },
  { href: "/dashboard/brand/profile", label: "Profile", arLabel: "الملف", icon: <User className="h-5 w-5" /> },
]

const adminNav: NavItem[] = [
  { href: "/admin", label: "Home", arLabel: "الرئيسية", icon: <LayoutDashboard className="h-5 w-5" /> },
  { href: "/admin/gigs", label: "Gigs", arLabel: "الوظائف", icon: <Briefcase className="h-5 w-5" /> },
  { href: "/admin/verified-numbers", label: "Numbers", arLabel: "الأرقام", icon: <Phone className="h-5 w-5" /> },
  { href: "/admin/users", label: "Users", arLabel: "المستخدمين", icon: <Users className="h-5 w-5" /> },
]

interface BottomNavProps {
  role: "usher" | "brand" | "admin"
  language: "ar" | "en"
}

export function BottomNav({ role, language }: BottomNavProps) {
  const pathname = usePathname()
  const navItems = role === "usher" ? usherNav : role === "brand" ? brandNav : adminNav

  const isActive = (item: NavItem) => {
    if (item.href === "/admin" || item.href === "/dashboard/usher" || item.href === "/dashboard/brand") {
      return pathname === item.href
    }
    return pathname.startsWith(item.href)
  }

  return (
    <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] max-w-xl">
      <div className="flex items-center justify-around px-1 py-1 rounded-[20px] bg-background/85 backdrop-blur-2xl border border-border/60 shadow-2xl shadow-primary/10">
        {navItems.map((item) => {
          const active = isActive(item)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-300 ${
                active
                  ? "text-primary"
                  : "text-muted-foreground/70 hover:text-foreground hover:bg-muted/40"
              }`}
            >
              {active && (
                <span className="absolute inset-0 rounded-xl bg-primary/10 animate-fade-in-up" style={{ animationDelay: "0s" }} />
              )}
              <span className={`relative ${active ? "drop-shadow-[0_0_6px_hsl(var(--primary))]" : ""}`}>
                {item.icon}
              </span>
              <span className={`relative text-[9px] font-mono font-semibold tracking-tight leading-none whitespace-nowrap ${
                active ? "text-primary" : ""
              }`}>
                {language === "ar" ? item.arLabel : item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
