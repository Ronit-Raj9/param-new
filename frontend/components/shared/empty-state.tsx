"use client"

import type React from "react"

import { cn } from "@/lib/utils"
import { FileX, Search, Inbox } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  icon?: "search" | "file" | "inbox" | React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ icon = "inbox", title, description, action, className }: EmptyStateProps) {
  const iconMap = {
    search: Search,
    file: FileX,
    inbox: Inbox,
  }

  const IconComponent = typeof icon === "string" ? iconMap[icon as keyof typeof iconMap] : null

  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      <div className="rounded-full bg-muted p-4 mb-4">
        {IconComponent ? <IconComponent className="h-8 w-8 text-muted-foreground" /> : icon}
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-1 text-sm text-muted-foreground max-w-sm">{description}</p>}
      {action && (
        <Button onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
      )}
    </div>
  )
}
