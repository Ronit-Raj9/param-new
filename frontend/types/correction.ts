// Correction-related types

export interface Correction {
  id: string
  type: CorrectionType
  studentId: string
  studentName: string
  resourceId: string
  resourceType: "STUDENT" | "RESULT" | "CREDENTIAL"
  requestedBy: string
  requestedAt: string
  status: CorrectionStatus
  before: Record<string, unknown>
  after: Record<string, unknown>
  reason: string
  reviewedBy?: string
  reviewedAt?: string
  reviewNotes?: string
  attachments?: string[]
}

export type CorrectionType =
  | "PERSONAL_INFO"
  | "MARKS"
  | "GRADE"
  | "ATTENDANCE"
  | "OTHER"

export type CorrectionStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"

export interface CorrectionRequest {
  type: CorrectionType
  resourceId: string
  resourceType: "STUDENT" | "RESULT" | "CREDENTIAL"
  field: string
  currentValue: unknown
  requestedValue: unknown
  reason: string
  attachments?: File[]
}
