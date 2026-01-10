"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingSkeletonProps {
  className?: string
  count?: number
}

export function LoadingSkeleton({ className, count = 1 }: LoadingSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-12 w-full rounded-md bg-muted animate-pulse",
            className
          )}
        />
      ))}
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      <LoadingSkeleton className="h-10" />
      <LoadingSkeleton count={rows} />
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border p-6 space-y-3">
      <LoadingSkeleton className="h-6 w-1/3" />
      <LoadingSkeleton className="h-4 w-2/3" />
      <LoadingSkeleton className="h-4 w-1/2" />
    </div>
  )
}
