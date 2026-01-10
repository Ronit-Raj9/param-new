import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { ResultStatus, StudentStatus, CredentialStatus } from "@/types"

type StatusType = ResultStatus | StudentStatus | CredentialStatus | string

interface StatusBadgeProps {
  status: StatusType
  className?: string
}

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }
> = {
  // Result statuses
  DRAFT: { label: "Draft", variant: "outline", className: "border-warning text-warning" },
  PENDING_APPROVAL: { label: "Pending", variant: "outline", className: "border-info text-info" },
  APPROVED: { label: "Approved", variant: "default", className: "bg-success text-success-foreground" },
  PUBLISHED: { label: "Published", variant: "default", className: "bg-success text-success-foreground" },
  WITHHELD: { label: "Withheld", variant: "destructive", className: "" },
  REJECTED: { label: "Rejected", variant: "destructive", className: "" },

  // Student statuses
  ACTIVE: { label: "Active", variant: "default", className: "bg-success text-success-foreground" },
  GRADUATED: { label: "Graduated", variant: "default", className: "bg-info text-info-foreground" },
  WITHDRAWN: { label: "Withdrawn", variant: "outline", className: "border-warning text-warning" },
  SUSPENDED: { label: "Suspended", variant: "destructive", className: "" },

  // Credential statuses
  VALID: { label: "Valid", variant: "default", className: "bg-success text-success-foreground" },
  REVOKED: { label: "Revoked", variant: "destructive", className: "" },
  EXPIRED: { label: "Expired", variant: "outline", className: "border-warning text-warning" },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    variant: "secondary" as const,
    className: "",
  }

  return (
    <Badge variant={config.variant} className={cn(config.className, className)}>
      {config.label}
    </Badge>
  )
}
