"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { usePrivy, useLogout } from "@privy-io/react-auth"
import type { User, AuthState } from "@/types"

interface AuthContextType extends AuthState {
  privyReady: boolean
  privyAuthenticated: boolean
  backendUser: User | null
  syncWithBackend: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

const PUBLIC_ROUTES = ["/", "/login", "/activate", "/reset-password", "/verify", "/docs", "/support"]

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  
  // Privy hooks
  const { ready, authenticated, user: privyUser, getAccessToken } = usePrivy()
  const { logout: privyLogout } = useLogout()
  
  // Backend user state
  const [backendUser, setBackendUser] = React.useState<User | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [hasSynced, setHasSynced] = React.useState(false)

  // Sync Privy authentication with backend
  const syncWithBackend = React.useCallback(async () => {
    if (!ready || !authenticated || !privyUser) {
      setBackendUser(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      
      // Get Privy access token
      const token = await getAccessToken()
      
      if (!token) {
        console.error("❌ Failed to get Privy access token")
        setBackendUser(null)
        return
      }

      console.log("🔄 Syncing with backend at:", `${API_URL}/v1/auth/login`)

      // Call backend login endpoint with Privy token
      const response = await fetch(`${API_URL}/v1/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ token }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("❌ Backend auth failed:", {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        })
        setBackendUser(null)
        return
      }

      const data = await response.json()
      
      if (data.success && data.data?.user) {
        console.log("✅ Backend sync successful:", data.data.user.email)
        setBackendUser(data.data.user)
        
        // Set cookies for middleware route protection
        document.cookie = `session=${token.substring(0, 50)}; path=/; max-age=${60 * 60 * 24}` // 24 hours
        document.cookie = `user_role=${data.data.user.role}; path=/; max-age=${60 * 60 * 24}`
        
        setHasSynced(true)
      } else {
        console.error("❌ Backend response missing user data:", data)
        setBackendUser(null)
      }
    } catch (error) {
      console.error("❌ Error syncing with backend:", error)
      console.error("💡 Make sure the backend is running at:", API_URL)
      console.error("💡 Check the browser console Network tab for details")
      setBackendUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [ready, authenticated, privyUser, getAccessToken])

  // Sync with backend when Privy auth state changes
  React.useEffect(() => {
    if (ready) {
      if (authenticated && !hasSynced) {
        syncWithBackend()
      } else if (!authenticated) {
        setBackendUser(null)
        setIsLoading(false)
        setHasSynced(false)
        // Clear cookies
        document.cookie = "session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
        document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
      }
    }
  }, [ready, authenticated, hasSynced, syncWithBackend])

  // Computed auth state
  const isAuthenticated = ready && authenticated && !!backendUser

  const login = React.useCallback(() => {
    router.push("/login")
  }, [router])

  const logout = React.useCallback(async () => {
    try {
      // Call backend logout
      await fetch(`${API_URL}/v1/auth/logout`, {
        method: "POST",
        credentials: "include",
      }).catch(() => {})
      
      // Clear cookies
      document.cookie = "session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
      document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
      
      // Logout from Privy
      await privyLogout()
      
      setBackendUser(null)
      setHasSynced(false)
      
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }, [privyLogout, router])

  const refetch = React.useCallback(() => {
    setHasSynced(false)
    syncWithBackend()
  }, [syncWithBackend])

  // Route protection
  React.useEffect(() => {
    if (!ready) return

    const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith("/verify/"))

    // Wait for loading to complete before redirecting
    if (isLoading) return

    if (!isAuthenticated && !isPublicRoute) {
      router.push("/login")
      return
    }

    if (isAuthenticated && pathname === "/login") {
      if (backendUser?.role === "STUDENT") {
        router.push("/student")
      } else {
        router.push("/admin")
      }
    }
  }, [ready, isAuthenticated, isLoading, pathname, router, backendUser?.role])

  const value: AuthContextType = {
    user: backendUser,
    isLoading: !ready || isLoading,
    isAuthenticated,
    login,
    logout,
    refetch,
    privyReady: ready,
    privyAuthenticated: authenticated,
    backendUser,
    syncWithBackend,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const context = React.useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
