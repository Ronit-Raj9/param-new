"use client"

import { formatRelativeTime } from "@/lib/format"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { FileText, UserPlus, CheckCircle, Upload, Award, AlertTriangle, Activity } from "lucide-react"

interface ActivityItem {
  id: string
  action: string
  entityType?: string
  createdAt: string
  actor?: { name: string; email: string }
}

interface ActivityFeedProps {
  activities?: ActivityItem[]
}

const typeIcons: Record<string, typeof FileText> = {
  USER_LOGIN: UserPlus,
  USER_LOGOUT: UserPlus,
  USER_CREATED: UserPlus,
  RESULT_UPLOADED: Upload,
  RESULT_APPROVED: CheckCircle,
  RESULT_PUBLISHED: FileText,
  DEGREE_PROPOSED: Award,
  DEGREE_APPROVED: CheckCircle,
  CREDENTIAL_ISSUED: Award,
  CORRECTION_SUBMITTED: AlertTriangle,
}

const typeColors: Record<string, string> = {
  USER_LOGIN: "text-info bg-info/10",
  USER_LOGOUT: "text-muted-foreground bg-muted",
  USER_CREATED: "text-success bg-success/10",
  RESULT_UPLOADED: "text-info bg-info/10",
  RESULT_APPROVED: "text-success bg-success/10",
  RESULT_PUBLISHED: "text-success bg-success/10",
  DEGREE_PROPOSED: "text-primary bg-primary/10",
  DEGREE_APPROVED: "text-success bg-success/10",
  CREDENTIAL_ISSUED: "text-primary bg-primary/10",
  CORRECTION_SUBMITTED: "text-warning bg-warning/10",
}

function formatAction(action: string): string {
  const actionMap: Record<string, string> = {
    USER_LOGIN: "Logged in",
    USER_LOGOUT: "Logged out",
    USER_CREATED: "User account created",
    RESULT_UPLOADED: "Results uploaded",
    RESULT_APPROVED: "Results approved",
    RESULT_PUBLISHED: "Results published",
    DEGREE_PROPOSED: "Degree proposed",
    DEGREE_APPROVED: "Degree approved",
    CREDENTIAL_ISSUED: "Credential issued",
    CORRECTION_SUBMITTED: "Correction submitted",
  }
  return actionMap[action] || action.replace(/_/g, " ").toLowerCase()
}

export function ActivityFeed({ activities = [] }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Activity className="h-10 w-10 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No recent activity</p>
        <p className="text-xs text-muted-foreground mt-1">Activities will appear here as they happen</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const Icon = typeIcons[activity.action] || FileText
        const colorClass = typeColors[activity.action] || "text-muted-foreground bg-muted"
        const actorName = activity.actor?.name || "System"
        const initials = actorName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()

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
                <span className="text-sm font-medium">{actorName}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5 truncate">
                {formatAction(activity.action)}
              </p>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              {formatRelativeTime(activity.createdAt)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
