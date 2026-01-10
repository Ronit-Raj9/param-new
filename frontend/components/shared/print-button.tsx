"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

interface PrintButtonProps {
  label?: string
  className?: string
}

export function PrintButton({ label = "Print", className }: PrintButtonProps) {
  const handlePrint = () => {
    window.print()
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handlePrint}
      className={className}
    >
      <Printer className="mr-2 h-4 w-4" />
      {label}
    </Button>
  )
}
