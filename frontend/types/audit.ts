// Audit log types

export interface AuditLog {
  id: string
  userId: string
  userName: string
  userRole: string
  action: AuditAction
  resourceType: ResourceType
  resourceId?: string
  ipAddress: string
  userAgent: string
  details: Record<string, unknown>
  timestamp: string
}

export type AuditAction =
  | "LOGIN"
  | "LOGOUT"
  | "CREATE"
  | "READ"
  | "UPDATE"
  | "DELETE"
  | "APPROVE"
  | "REJECT"
  | "ISSUE"
  | "REVOKE"
  | "UPLOAD"
  | "DOWNLOAD"
  | "EXPORT"
  | "IMPORT"

export type ResourceType =
  | "USER"
  | "STUDENT"
  | "RESULT"
  | "CREDENTIAL"
  | "DEGREE"
  | "PROGRAM"
  | "COURSE"
  | "APPROVAL"
  | "CORRECTION"
  | "SETTING"

export interface AuditLogFilter {
  userId?: string
  action?: AuditAction | AuditAction[]
  resourceType?: ResourceType | ResourceType[]
  fromDate?: string
  toDate?: string
  search?: string
}

export interface AuditLogExport {
  format: "CSV" | "JSON" | "PDF"
  filters: AuditLogFilter
}
