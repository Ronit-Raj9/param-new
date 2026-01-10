"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import useSWR from "swr"
import { fetcher } from "@/lib/api"
import type { User, AuthState } from "@/types"

interface AuthContextType extends AuthState {}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

const PUBLIC_ROUTES = ["/", "/login", "/activate", "/reset-password", "/verify", "/docs", "/support"]

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  const {
    data: user,
    error,
    isLoading,
    mutate,
  } = useSWR<User>("/api/me", fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  })

  const isAuthenticated = !!user && !error

  const login = React.useCallback(() => {
    router.push("/login")
  }, [router])

  const logout = React.useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
    } catch {
      // Ignore errors
    }
    mutate(undefined, false)
    router.push("/login")
  }, [mutate, router])

  const refetch = React.useCallback(() => {
    mutate()
  }, [mutate])

  // Route protection
  React.useEffect(() => {
    if (isLoading) return

    const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith("/verify/"))

    if (!isAuthenticated && !isPublicRoute) {
      router.push("/login")
      return
    }

    if (isAuthenticated && pathname === "/login") {
      if (user?.role === "STUDENT") {
        router.push("/student")
      } else {
        router.push("/admin")
      }
    }
  }, [isAuthenticated, isLoading, pathname, router, user?.role])

  const value: AuthContextType = {
    user: user || null,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refetch,
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
