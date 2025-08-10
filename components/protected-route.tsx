"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: "usher" | "brand" | "admin"
  redirectTo?: string
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  redirectTo = "/auth/login" 
}: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Only redirect after loading is complete
    if (!loading) {
      if (!isAuthenticated) {
        router.push(redirectTo)
        return
      }

      // Check role if required
      if (requiredRole && user?.role !== requiredRole) {
        router.push(`/dashboard/${user?.role}`)
        return
      }
    }
  }, [user, loading, isAuthenticated, requiredRole, router, redirectTo])

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render children if not authenticated
  if (!isAuthenticated) {
    return null
  }

  // Don't render children if role doesn't match
  if (requiredRole && user?.role !== requiredRole) {
    return null
  }

  return <>{children}</>
} 