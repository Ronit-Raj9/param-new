"use client"

import { usePrivy } from "@privy-io/react-auth"
import { useCallback, useRef, useEffect, useState } from "react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"

interface FetchOptions extends RequestInit {
  skipAuth?: boolean
}

/**
 * Hook that provides authenticated fetch function
 * Automatically adds Bearer token from Privy to all requests
 */
export function useApi() {
  const { getAccessToken, ready, authenticated } = usePrivy()
  const tokenRef = useRef<string | null>(null)
  const [isReady, setIsReady] = useState(false)

  // Refresh token when auth state changes
  useEffect(() => {
    if (!ready) {
      setIsReady(false)
      return
    }

    if (!authenticated) {
      tokenRef.current = null
      setIsReady(false)
      return
    }

    const refreshToken = async () => {
      try {
        const token = await getAccessToken()
        tokenRef.current = token
        setIsReady(true)
      } catch (error) {
        console.error("Failed to refresh token:", error)
        tokenRef.current = null
        setIsReady(false)
      }
    }

    // Initial fetch
    refreshToken()

    // Refresh every 5 minutes
    const interval = setInterval(refreshToken, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [ready, authenticated, getAccessToken])

  const apiFetch = useCallback(
    async <T = unknown>(endpoint: string, options: FetchOptions = {}): Promise<T> => {
      const { skipAuth, headers, ...rest } = options

      // Get fresh token for each request
      let token = tokenRef.current
      if (!skipAuth && authenticated) {
        try {
          token = await getAccessToken()
          tokenRef.current = token
        } catch (error) {
          console.error("Failed to get access token:", error)
        }
      }

      const url = endpoint.startsWith("http") ? endpoint : `${API_URL}${endpoint}`

      const response = await fetch(url, {
        ...rest,
        headers: {
          "Content-Type": "application/json",
          ...(token && !skipAuth ? { Authorization: `Bearer ${token}` } : {}),
          ...headers,
        },
        credentials: "include",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || data.message || "Request failed")
      }

      return data
    },
    [authenticated, getAccessToken]
  )

  const get = useCallback(
    <T = unknown>(endpoint: string, options?: FetchOptions) => apiFetch<T>(endpoint, { ...options, method: "GET" }),
    [apiFetch]
  )

  const post = useCallback(
    <T = unknown>(endpoint: string, body?: unknown, options?: FetchOptions) =>
      apiFetch<T>(endpoint, { ...options, method: "POST", body: body ? JSON.stringify(body) : undefined }),
    [apiFetch]
  )

  const patch = useCallback(
    <T = unknown>(endpoint: string, body?: unknown, options?: FetchOptions) =>
      apiFetch<T>(endpoint, { ...options, method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
    [apiFetch]
  )

  const del = useCallback(
    <T = unknown>(endpoint: string, options?: FetchOptions) => apiFetch<T>(endpoint, { ...options, method: "DELETE" }),
    [apiFetch]
  )

  return {
    fetch: apiFetch,
    get,
    post,
    patch,
    delete: del,
    isReady,
  }
}
