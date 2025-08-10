"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()

  // Redirect to role-specific dashboard
  if (user) {
    router.push(`/dashboard/${user.role}`)
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Redirecting...</p>
        </div>
      </div>
    </ProtectedRoute>
  )
}
