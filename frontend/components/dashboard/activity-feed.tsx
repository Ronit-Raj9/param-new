"use client"

import { formatRelativeTime } from "@/lib/format"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { FileText, UserPlus, CheckCircle, Upload, Award, AlertTriangle } from "lucide-react"

const mockActivities = [
  {
    id: "1",
    user: "Dr. Amit Kumar",
    action: "Published semester 7 results for B.Tech CSE 2021 batch",
    type: "publish",
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: "2",
    user: "Prof. Meena Sharma",
    action: "Uploaded 45 student records via CSV",
    type: "upload",
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: "3",
    user: "Dr. Raj Singh",
    action: "Approved degree proposal for Rahul Sharma",
    type: "approve",
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: "4",
    user: "Admin",
    action: "Issued 12 degree certificates for 2024 batch",
    type: "issue",
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
  {
    id: "5",
    user: "System",
    action: "Correction request submitted for enrollment 2020BCS015",
    type: "correction",
    timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
  },
]

const typeIcons = {
  publish: FileText,
  upload: Upload,
  approve: CheckCircle,
  issue: Award,
  correction: AlertTriangle,
  user: UserPlus,
}

const typeColors = {
  publish: "text-success bg-success/10",
  upload: "text-info bg-info/10",
  approve: "text-success bg-success/10",
  issue: "text-primary bg-primary/10",
  correction: "text-warning bg-warning/10",
  user: "text-muted-foreground bg-muted",
}

export function ActivityFeed() {
  return (
    <div className="space-y-4">
      {mockActivities.map((activity) => {
        const Icon = typeIcons[activity.type as keyof typeof typeIcons] || FileText
        const colorClass = typeColors[activity.type as keyof typeof typeColors] || typeColors.user
        const initials = activity.user
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)

        return (
          <div key={activity.id} className="flex items-start gap-4">
            <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[10px] bg-muted">{initials}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{activity.user}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5 truncate">{activity.action}</p>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">{formatRelativeTime(activity.timestamp)}</span>
          </div>
        )
      })}
    </div>
  )
}
