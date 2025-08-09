export const translations = {
  ar: {
    // Common
    welcome: "مرحباً",
    login: "تسجيل الدخول",
    logout: "تسجيل الخروج",
    profile: "الملف الشخصي",
    dashboard: "لوحة التحكم",
    settings: "الإعدادات",
    save: "حفظ",
    cancel: "إلغاء",
    loading: "جاري التحميل...",

    // Navigation
    home: "الرئيسية",
    gigs: "الوظائف",
    earnings: "الأرباح",
    notifications: "الإشعارات",

    // Usher specific
    findGigs: "البحث عن وظائف",
    myApplications: "طلباتي",
    workHistory: "تاريخ العمل",
    totalEarnings: "إجمالي الأرباح",

    // Brand specific
    createGig: "إنشاء وظيفة",
    manageGigs: "إدارة الوظائف",
    wallet: "المحفظة",

    // Gig details
    location: "الموقع",
    date: "التاريخ",
    duration: "المدة",
    payRate: "معدل الأجر",
    skillsRequired: "المهارات المطلوبة",
    apply: "تقديم طلب",

    // Status
    pending: "قيد المراجعة",
    approved: "مقبول",
    rejected: "مرفوض",
    active: "نشط",
    completed: "مكتمل",
  },
  en: {
    // Common
    welcome: "Welcome",
    login: "Login",
    logout: "Logout",
    profile: "Profile",
    dashboard: "Dashboard",
    settings: "Settings",
    save: "Save",
    cancel: "Cancel",
    loading: "Loading...",

    // Navigation
    home: "Home",
    gigs: "Gigs",
    earnings: "Earnings",
    notifications: "Notifications",

    // Usher specific
    findGigs: "Find Gigs",
    myApplications: "My Applications",
    workHistory: "Work History",
    totalEarnings: "Total Earnings",

    // Brand specific
    createGig: "Create Gig",
    manageGigs: "Manage Gigs",
    wallet: "Wallet",

    // Gig details
    location: "Location",
    date: "Date",
    duration: "Duration",
    payRate: "Pay Rate",
    skillsRequired: "Skills Required",
    apply: "Apply",

    // Status
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    active: "Active",
    completed: "Completed",
  },
}

export function useTranslation(language: "ar" | "en" = "ar") {
  return {
    t: (key: keyof typeof translations.ar) => translations[language][key] || key,
    isRTL: language === "ar",
  }
}
