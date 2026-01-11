"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { usePrivy, useLogout } from "@privy-io/react-auth"
import type { User } from "@/types"

// Re-export AuthState from auth-provider for backward compatibility
export interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: () => void
  logout: () => Promise<void>
  refetch: () => void
}

// Re-export useAuth from auth-provider
export { useAuth } from "@/providers/auth-provider"

/**
 * Hook to get Privy auth state directly
 * Use this when you need raw Privy state without backend sync
 */
export function usePrivyAuth() {
  const { ready, authenticated, user, getAccessToken } = usePrivy()
  const { logout } = useLogout()
  
  return {
    ready,
    authenticated,
    user,
    getAccessToken,
    logout,
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
  const { useAuth } = require("@/providers/auth-provider")
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
  const { useAuth } = require("@/providers/auth-provider")
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
  const { useAuth } = require("@/providers/auth-provider")
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
