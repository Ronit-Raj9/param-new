"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail, KeyRound, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address").endsWith(".edu", {
    message: "Please use your institutional email (@iiitm.ac.in)",
  }),
})

const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d+$/, "OTP must contain only numbers"),
})

type EmailFormData = z.infer<typeof emailSchema>
type OtpFormData = z.infer<typeof otpSchema>

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect")
  const roleHint = searchParams.get("role")

  const [step, setStep] = useState<"email" | "otp">("email")
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  })

  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  })

  const startCountdown = () => {
    setCountdown(60)
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleSendOtp = async (data: EmailFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // In production, call: POST /api/auth/send-otp { email: data.email }
      setEmail(data.email)
      setStep("otp")
      startCountdown()
    } catch {
      setError("Failed to send verification code. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async (data: OtpFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // In production, call: POST /api/auth/verify { email, otp: data.otp }
      // The backend will set httpOnly cookies

      // For demo, simulate successful login
      // Mock setting cookies for demo purposes
      document.cookie = `session=demo_session; path=/`
      document.cookie = `user_role=${roleHint === "admin" ? "ADMIN" : "STUDENT"}; path=/`

      // Redirect based on role
      if (redirectTo) {
        router.push(redirectTo)
      } else if (roleHint === "admin") {
        router.push("/admin")
      } else {
        router.push("/student")
      }
      router.refresh()
    } catch {
      setError("Invalid verification code. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (countdown > 0) return
    setIsLoading(true)
    setError(null)

    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      startCountdown()
    } catch {
      setError("Failed to resend code.")
    } finally {
      setIsLoading(false)
    }
  }

  if (step === "otp") {
    return (
      <form onSubmit={otpForm.handleSubmit(handleVerifyOtp)} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="text-center mb-6">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <KeyRound className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">
            We sent a verification code to
            <br />
            <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="otp">Verification Code</Label>
          <Input
            id="otp"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            className="text-center text-2xl tracking-widest font-mono"
            {...otpForm.register("otp")}
            disabled={isLoading}
          />
          {otpForm.formState.errors.otp && (
            <p className="text-sm text-destructive">{otpForm.formState.errors.otp.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Verify & Login
        </Button>

        <div className="flex items-center justify-between text-sm">
          <Button type="button" variant="ghost" size="sm" onClick={() => setStep("email")} disabled={isLoading}>
            Change email
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResendOtp}
            disabled={isLoading || countdown > 0}
          >
            {countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
          </Button>
        </div>
      </form>
    )
  }

  return (
    <form onSubmit={emailForm.handleSubmit(handleSendOtp)} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="your.email@iiitm.ac.in"
            className={cn("pl-10", emailForm.formState.errors.email && "border-destructive")}
            {...emailForm.register("email")}
            disabled={isLoading}
          />
        </div>
        {emailForm.formState.errors.email && (
          <p className="text-sm text-destructive">{emailForm.formState.errors.email.message}</p>
        )}
        <p className="text-xs text-muted-foreground">Use your institutional email address</p>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Send Verification Code
      </Button>

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
    </form>
  )
}
