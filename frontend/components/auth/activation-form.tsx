"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { usePrivy, useWallets } from "@privy-io/react-auth"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle2, User, Mail, GraduationCap, Wallet } from "lucide-react"

interface StudentInfo {
  name: string
  email: string
  enrollmentNumber: string
  program?: string
}

interface TokenValidation {
  valid: boolean
  expired?: boolean
  used?: boolean
  student?: StudentInfo
}

type ActivationStep = "validating" | "ready" | "authenticating" | "activating" | "success" | "error"

export function ActivationForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""

  const { login, authenticated, user: privyUser, ready: privyReady } = usePrivy()
  const { wallets } = useWallets()

  const [step, setStep] = useState<ActivationStep>("validating")
  const [tokenData, setTokenData] = useState<TokenValidation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [acceptTerms, setAcceptTerms] = useState(false)

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setError("No activation token provided")
      setStep("error")
      return
    }

    validateToken()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const validateToken = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/validate-token?token=${encodeURIComponent(token)}`
      )
      const data = await response.json()

      if (data.success && data.data.valid) {
        setTokenData(data.data)
        setStep("ready")
      } else if (data.data?.expired) {
        setError("This activation link has expired. Please contact your institution to request a new one.")
        setStep("error")
      } else if (data.data?.used) {
        setError("This activation link has already been used. If you haven't activated your account, please contact support.")
        setStep("error")
      } else {
        setError("Invalid activation link. Please check the link or contact your institution.")
        setStep("error")
      }
    } catch (err) {
      console.error("Token validation error:", err)
      setError("Failed to validate activation link. Please try again.")
      setStep("error")
    }
  }

  // Handle Privy login completion
  useEffect(() => {
    if (step === "authenticating" && authenticated && privyUser && privyReady) {
      completeActivation()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, privyUser, privyReady, step])

  const handleLogin = useCallback(async () => {
    if (!acceptTerms) {
      setError("Please accept the terms and conditions")
      return
    }

    setError(null)
    setStep("authenticating")

    try {
      await login()
    } catch (err) {
      console.error("Login error:", err)
      setError("Failed to authenticate. Please try again.")
      setStep("ready")
    }
  }, [acceptTerms, login])

  const completeActivation = async () => {
    setStep("activating")

    try {
      // Wait for wallet to be available (Privy creates it automatically)
      let walletAddress: string | undefined
      let attempts = 0
      const maxAttempts = 10

      while (!walletAddress && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        
        // Check for embedded wallet from Privy
        const embeddedWallet = wallets.find((w) => w.walletClientType === "privy")
        if (embeddedWallet) {
          walletAddress = embeddedWallet.address
        }
        
        attempts++
      }

      if (!walletAddress) {
        throw new Error("Wallet not created. Please try again.")
      }

      // Call backend to complete activation
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          privyUserId: privyUser?.id,
          walletAddress,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setStep("success")
        // Redirect to student dashboard after 2 seconds
        setTimeout(() => {
          router.push("/student")
        }, 2000)
      } else {
        throw new Error(data.error || "Activation failed")
      }
    } catch (err) {
      console.error("Activation error:", err)
      setError(err instanceof Error ? err.message : "Failed to activate account")
      setStep("error")
    }
  }

  // Render different states
  if (step === "validating") {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Validating activation link...</p>
      </div>
    )
  }

  if (step === "error") {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Activation Failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push("/login")}>
            Go to Login
          </Button>
          <Button variant="outline" onClick={() => router.push("/support")}>
            Contact Support
          </Button>
        </div>
      </div>
    )
  }

  if (step === "success") {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-green-600">Account Activated!</h3>
        <p className="text-center text-muted-foreground">
          Your account has been successfully activated. Redirecting to your dashboard...
        </p>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (step === "authenticating" || step === "activating") {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">
          {step === "authenticating" ? "Authenticating..." : "Setting up your account..."}
        </p>
        {step === "activating" && (
          <p className="text-sm text-muted-foreground text-center">
            Creating your secure blockchain wallet...
          </p>
        )}
      </div>
    )
  }

  // Ready state - show student info and login button
  const student = tokenData?.student

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Student Info Card */}
      {student && (
        <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
          <h3 className="font-medium text-sm text-muted-foreground">Your Account Details</h3>
          
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{student.name}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{student.email}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{student.enrollmentNumber}</span>
              {student.program && (
                <span className="text-xs text-muted-foreground">• {student.program}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* What happens section */}
      <div className="rounded-lg border p-4 space-y-3">
        <h3 className="font-medium text-sm">What happens when you activate?</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
            <span>You&apos;ll log in using your institutional email</span>
          </li>
          <li className="flex items-start gap-2">
            <Wallet className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
            <span>A secure blockchain wallet will be automatically created for you</span>
          </li>
          <li className="flex items-start gap-2">
            <GraduationCap className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
            <span>You can start viewing and sharing your academic credentials</span>
          </li>
        </ul>
      </div>

      {/* Terms checkbox */}
      <div className="flex items-start space-x-3">
        <Checkbox
          id="acceptTerms"
          checked={acceptTerms}
          onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
        />
        <div className="grid gap-1.5 leading-none">
          <label
            htmlFor="acceptTerms"
            className="text-sm font-medium cursor-pointer leading-relaxed"
          >
            I accept the{" "}
            <a href="/docs/terms" className="text-primary hover:underline" target="_blank">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/docs/privacy" className="text-primary hover:underline" target="_blank">
              Privacy Policy
            </a>
          </label>
        </div>
      </div>

      {/* Activate button */}
      <Button
        className="w-full"
        size="lg"
        onClick={handleLogin}
        disabled={!acceptTerms}
      >
        Activate My Account
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        By activating, a secure blockchain wallet will be created for you to receive your digital credentials as NFTs.
      </p>
    </div>
  )
}
