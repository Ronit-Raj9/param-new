"use client"

import * as React from "react"
import { useContext } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { fetcher } from "@/lib/api"
import type { User } from "@/types"

export interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: () => void
  logout: () => Promise<void>
  refetch: () => void
}

/**
 * Authentication hook
 * Provides user state and authentication methods
 * 
 * @example
 * ```tsx
 * const { user, isAuthenticated, logout } = useAuth()
 * 
 * if (!isAuthenticated) {
 *   return <LoginPrompt />
 * }
 * ```
 */
export function useAuth(): AuthState {
  const router = useRouter()

  const {
    data: user,
    error,
    isLoading,
    mutate,
  } = useSWR<User>("/api/me", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    shouldRetryOnError: false,
  })

  const isAuthenticated = React.useMemo(() => {
    return !!user && !error
  }, [user, error])

  const login = React.useCallback(() => {
    router.push("/login")
  }, [router])

  const logout = React.useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })
    } catch (err) {
      console.error("Logout error:", err)
    }

    // Clear user data
    mutate(undefined, false)

    // Redirect to login
    router.push("/login")
  }, [mutate, router])

  const refetch = React.useCallback(() => {
    mutate()
  }, [mutate])

  return {
    user: user || null,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refetch,
  }
}

/**
 * Hook to check if user has required role
 * 
 * @example
 * ```tsx
 * const hasAccess = useHasRole(['ADMIN', 'ACADEMIC'])
 * ```
 */
export function useHasRole(roles: string[]): boolean {
  const { user } = useAuth()
  
  if (!user) return false
  
  return roles.includes(user.role)
}

/**
 * Hook to require authentication
 * Redirects to login if not authenticated
 * 
 * @example
 * ```tsx
 * function ProtectedPage() {
 *   const { isLoading } = useRequireAuth()
 *   
 *   if (isLoading) return <Loading />
 *   
 *   return <Content />
 * }
 * ```
 */
export function useRequireAuth(redirectTo: string = "/login"): { isLoading: boolean } {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo)
    }
  }, [isLoading, isAuthenticated, redirectTo, router])

  return { isLoading }
}

/**
 * Hook to require specific role
 * Redirects if user doesn't have required role
 * 
 * @example
 * ```tsx
 * function AdminPage() {
 *   const { isLoading } = useRequireRole(['ADMIN', 'ACADEMIC'])
 *   
 *   if (isLoading) return <Loading />
 *   
 *   return <AdminContent />
 * }
 * ```
 */
export function useRequireRole(
  roles: string[],
  redirectTo: string = "/"
): { isLoading: boolean; hasAccess: boolean } {
  const router = useRouter()
  const { user, isLoading, isAuthenticated } = useAuth()

  const hasAccess = React.useMemo(() => {
    if (!user) return false
    return roles.includes(user.role)
  }, [user, roles])

  React.useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login")
      } else if (!hasAccess) {
        router.push(redirectTo)
      }
    }
  }, [isLoading, isAuthenticated, hasAccess, redirectTo, router])

  return { isLoading, hasAccess }
}
