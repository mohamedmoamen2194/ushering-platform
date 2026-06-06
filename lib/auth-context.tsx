"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface User {
  id: number
  phone: string
  name: string
  email?: string
  role: "usher" | "brand" | "admin"
  language: "ar" | "en"
  profile?: any
}

interface AuthContextType {
  user: User | null
  login: (phone: string, password?: string) => Promise<boolean>
  setUser: (user: User) => void
  register: (userData: any) => Promise<boolean>
  logout: () => void
  loading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Validate stored session on mount
    const initializeAuth = () => {
      validateSession()
    }

    // Use requestIdleCallback if available, otherwise use setTimeout
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      requestIdleCallback(initializeAuth, { timeout: 1000 })
    } else {
      // Fallback for browsers that don't support requestIdleCallback
      const timer = setTimeout(initializeAuth, 100)
      return () => clearTimeout(timer)
    }
  }, [])

  const login = async (phone: string, password?: string): Promise<boolean> => {
    try {
      const requestBody: any = { phone }
      if (password) {
        requestBody.password = password
      }

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (data.success && data.user) {
        setUser(data.user)
        localStorage.setItem("aura_user", JSON.stringify(data.user))
        return true
      } else {
        return false
      }
    } catch (error) {
      return false
    }
  }

  const register = async (userData: any): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (data.success && data.user) {
        setUser(data.user)
        localStorage.setItem("aura_user", JSON.stringify(data.user))
        return true
      } else {
        return false
      }
    } catch (error) {
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("aura_user")
  }

  const setUserData = (userData: User) => {
    setUser(userData)
    localStorage.setItem("aura_user", JSON.stringify(userData))
  }

  // Validate stored session on mount
  const validateSession = async () => {
    try {
      const storedUser = localStorage.getItem("aura_user")
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser)
        
        // Make a quick API call to validate the session
        const response = await fetch("/api/auth/validate-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: parsedUser.id }),
        })

        if (response.ok) {
          const data = await response.json()
          if (data.valid) {
            setUser(parsedUser)
          } else {
            // Session expired, clear storage
            localStorage.removeItem("aura_user")
          }
        } else {
          // API error, clear storage to be safe
          localStorage.removeItem("aura_user")
        }
      }
    } catch {
      localStorage.removeItem("aura_user")
    } finally {
      setLoading(false)
    }
  }

  const isAuthenticated = !!user

  return (
    <AuthContext.Provider value={{ user, login, setUser: setUserData, register, logout, loading, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
