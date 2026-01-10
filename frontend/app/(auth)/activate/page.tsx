import type { Metadata } from "next"
import { ActivationForm } from "@/components/auth/activation-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UserCheck } from "lucide-react"

export const metadata: Metadata = {
  title: "Activate Account",
  description: "Complete your account setup",
}

export default function ActivatePage() {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="text-center space-y-4">
        <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
          <UserCheck className="h-7 w-7 text-primary" />
        </div>
        <div>
          <CardTitle className="text-2xl">Complete Your Setup</CardTitle>
          <CardDescription className="mt-2">Set up your profile to get started with PARAM</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <ActivationForm />
      </CardContent>
    </Card>
  )
}
