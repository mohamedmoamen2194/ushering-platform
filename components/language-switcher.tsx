"use client"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  return (
  <Button
  variant="ghost"
  size="sm"
  onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
  className="h-8 px-2 text-xs font-semibold tracking-wide"
  aria-label={language === "ar" ? "Switch to English" : "التبديل إلى العربية"}
  >
  {language === "ar" ? "AR" : "EN"}
  </Button>
  )
}
