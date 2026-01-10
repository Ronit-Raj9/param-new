import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface GradeBadgeProps {
  grade: string
  className?: string
}

const gradeColors: Record<string, string> = {
  "A+": "bg-success text-success-foreground",
  A: "bg-success/80 text-success-foreground",
  "B+": "bg-info text-info-foreground",
  B: "bg-info/80 text-info-foreground",
  "C+": "bg-warning text-warning-foreground",
  C: "bg-warning/80 text-warning-foreground",
  D: "bg-destructive/80 text-destructive-foreground",
  F: "bg-destructive text-destructive-foreground",
}

export function GradeBadge({ grade, className }: GradeBadgeProps) {
  const colorClass = gradeColors[grade] || "bg-muted text-muted-foreground"

  return (
    <Badge className={cn("font-mono", colorClass, className)} variant="secondary">
      {grade}
    </Badge>
  )
}
