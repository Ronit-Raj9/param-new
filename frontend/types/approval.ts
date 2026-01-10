// Approval-related types

export interface Approval {
  id: string
  type: ApprovalType
  resourceId: string
  resourceType: "RESULT" | "DEGREE" | "CORRECTION"
  status: ApprovalStatus
  requestedBy: string
  requestedAt: string
  reviewedBy?: string
  reviewedAt?: string
  notes?: string
  metadata: Record<string, unknown>
}

export type ApprovalType =
  | "RESULT_BATCH"
  | "DEGREE_PROPOSAL"
  | "DATA_CORRECTION"

export type ApprovalStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "OVERRIDDEN"

export interface ApprovalAction {
  action: "APPROVE" | "REJECT" | "REQUEST_CHANGES"
  notes?: string
  overrideReason?: string
}

export interface ApprovalQueue {
  results: ApprovalQueueItem[]
  degrees: ApprovalQueueItem[]
  corrections: ApprovalQueueItem[]
  total: number
}

export interface ApprovalQueueItem {
  id: string
  type: string
  title: string
  description: string
  submittedBy: string
  submittedAt: string
  priority: "LOW" | "MEDIUM" | "HIGH"
  status: ApprovalStatus
}
