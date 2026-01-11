"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { usePrivy } from "@privy-io/react-auth"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail, AlertCircle, Chrome } from "lucide-react"
import { useAuth } from "@/providers/auth-provider"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect")
  const roleHint = searchParams.get("role")

  const { ready, authenticated, login: privyLogin } = usePrivy()
  const { isAuthenticated, backendUser, isLoading: authLoading } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  // Redirect after successful authentication
  useEffect(() => {
    if (isAuthenticated && backendUser) {
      const destination = redirectTo || (backendUser.role === "STUDENT" ? "/student" : "/admin")
      router.push(destination)
    }
  }, [isAuthenticated, backendUser, redirectTo, router])

  // Reset logging in state when authentication completes
  useEffect(() => {
    if (authenticated) {
      setIsLoggingIn(false)
    }
  }, [authenticated])

  const isLoading = !ready || authLoading

  // Show loading while Privy initializes
  if (!ready) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Initializing...</p>
      </div>
    )
  }

  // Show loading while already authenticated and syncing
  if (authenticated && authLoading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Signing you in...</p>
      </div>
    )
  }

  const handleLogin = () => {
    setError(null)
    setIsLoggingIn(true)
    privyLogin()
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        <Button
          type="button"
          className="w-full"
          onClick={handleLogin}
          disabled={isLoading || isLoggingIn}
        >
          {isLoggingIn ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Mail className="mr-2 h-4 w-4" />
          )}
          Continue with Email
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleLogin}
          disabled={isLoading || isLoggingIn}
        >
          {isLoggingIn ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Chrome className="mr-2 h-4 w-4" />
          )}
          Continue with Google
        </Button>
      </div>

      {roleHint && (
        <p className="text-center text-xs text-muted-foreground">
          Logging in as {roleHint === "admin" ? "Staff" : "Student"}
        </p>
      )}

      <p className="text-center text-xs text-muted-foreground">
        By continuing, you agree to our{" "}
        <a href="/terms" className="text-primary hover:underline">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="/privacy" className="text-primary hover:underline">
          Privacy Policy
        </a>
      </p>
    </div>
  )
}
