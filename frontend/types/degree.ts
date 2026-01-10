// Degree-related types

export interface Degree {
  id: string
  studentId: string
  programId: string
  degreeType: "BACHELOR" | "MASTER" | "DOCTORATE" | "DIPLOMA"
  status: DegreeStatus
  issuedAt?: string
  revokedAt?: string
  credentialId?: string
  metadata: DegreeMetadata
}

export type DegreeStatus =
  | "DRAFT"
  | "PENDING_HOD"
  | "PENDING_REGISTRAR"
  | "PENDING_DIRECTOR"
  | "APPROVED"
  | "ISSUED"
  | "REVOKED"

export interface DegreeMetadata {
  programName: string
  batch: string
  cgpa: number
  division: string
  dateOfCompletion: string
  certificateNumber?: string
}

export interface DegreeProposal {
  id: string
  programId: string
  batch: string
  studentIds: string[]
  proposedBy: string
  proposedAt: string
  status: DegreeStatus
  approvals: DegreeApproval[]
  comments?: string
}

export interface DegreeApproval {
  id: string
  proposalId: string
  approverId: string
  approverRole: string
  approverName: string
  status: "APPROVED" | "REJECTED" | "PENDING"
  comments?: string
  approvedAt?: string
}
