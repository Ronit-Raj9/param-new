"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle } from "lucide-react"

const activationSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters"),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
})

type ActivationFormData = z.infer<typeof activationSchema>

export function ActivationForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""
  const token = searchParams.get("token") || ""

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<ActivationFormData>({
    resolver: zodResolver(activationSchema),
    defaultValues: {
      displayName: "",
      acceptTerms: false,
    },
  })

  const handleActivate = async (data: ActivationFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // In production: POST /api/auth/activate { token, displayName: data.displayName }

      router.push("/login?activated=true")
    } catch {
      setError("Failed to activate account. Please try again or contact support.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(handleActivate)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input id="email" type="email" value={email} disabled className="bg-muted" />
        <p className="text-xs text-muted-foreground">This email is linked to your institutional account</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="displayName">Display Name</Label>
        <Input
          id="displayName"
          type="text"
          placeholder="Enter your full name"
          {...form.register("displayName")}
          disabled={isLoading}
        />
        {form.formState.errors.displayName && (
          <p className="text-sm text-destructive">{form.formState.errors.displayName.message}</p>
        )}
      </div>

      <div className="flex items-start space-x-3">
        <Checkbox
          id="acceptTerms"
          checked={form.watch("acceptTerms")}
          onCheckedChange={(checked) => form.setValue("acceptTerms", checked as boolean)}
          disabled={isLoading}
        />
        <div className="grid gap-1.5 leading-none">
          <label htmlFor="acceptTerms" className="text-sm font-medium cursor-pointer">
            Accept terms and conditions
          </label>
          <p className="text-xs text-muted-foreground">
            By checking this box, you agree to our{" "}
            <a href="/terms" className="text-primary hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
      {form.formState.errors.acceptTerms && (
        <p className="text-sm text-destructive">{form.formState.errors.acceptTerms.message}</p>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Activate Account
      </Button>
    </form>
  )
}
