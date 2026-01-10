"use client"

import * as React from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2 } from "lucide-react"

interface SuccessMessageProps {
  title?: string
  message: string
}

export function SuccessMessage({
  title = "Success",
  message,
}: SuccessMessageProps) {
  return (
    <Alert className="border-success text-success">
      <CheckCircle2 className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}
