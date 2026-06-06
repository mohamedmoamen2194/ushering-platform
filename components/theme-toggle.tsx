"use client"

import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/lib/theme-context"
import { useLanguage } from "@/lib/language-context"
import { useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const { language } = useLanguage()
  const [animating, setAnimating] = useState(false)

  const toggleTheme = () => {
    setAnimating(true)
    setTheme(theme === "dark" ? "light" : "dark")
    setTimeout(() => setAnimating(false), 400)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-9 px-0 relative overflow-hidden"
      onClick={toggleTheme}
      aria-label={language === "ar" ? "تبديل السمة" : "Toggle theme"}
    >
      <Sun
        className={`h-[1.2rem] w-[1.2rem] transition-all duration-300 ${
          theme === "dark"
            ? "rotate-90 scale-0 opacity-0"
            : "rotate-0 scale-100 opacity-100"
        } ${animating ? "animate-theme-spin" : ""}`}
      />
      <Moon
        className={`absolute h-[1.2rem] w-[1.2rem] transition-all duration-300 ${
          theme === "dark"
            ? "rotate-0 scale-100 opacity-100"
            : "-rotate-90 scale-0 opacity-0"
        } ${animating && theme === "dark" ? "animate-theme-spin" : ""}`}
      />
    </Button>
  )
}
