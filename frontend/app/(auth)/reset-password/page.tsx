import type { Metadata } from "next"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { KeyRound } from "lucide-react"

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Reset your account password",
}

export default function ResetPasswordPage() {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="text-center space-y-4">
        <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
          <KeyRound className="h-7 w-7 text-primary" />
        </div>
        <div>
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription className="mt-2">Enter your email to receive password reset instructions</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <ResetPasswordForm />
      </CardContent>
    </Card>
  )
}
