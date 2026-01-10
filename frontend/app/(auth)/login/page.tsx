import type { Metadata } from "next"
import { Suspense } from "react"
import { LoginForm } from "@/components/auth/login-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield } from "lucide-react"

export const metadata: Metadata = {
  title: "Login",
  description: "Login to access your academic credentials",
}

export default function LoginPage() {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="text-center space-y-4">
        <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
          <Shield className="h-7 w-7 text-primary" />
        </div>
        <div>
          <CardTitle className="text-2xl">Welcome to PARAM</CardTitle>
          <CardDescription className="mt-2">Sign in with your institutional email to continue</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<div className="h-48 animate-pulse bg-muted rounded" />}>
          <LoginForm />
        </Suspense>
      </CardContent>
    </Card>
  )
}
