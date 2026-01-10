export type CredentialType = "DEGREE" | "SEMESTER_RESULT" | "TRANSCRIPT"
export type CredentialStatus = "VALID" | "REVOKED" | "EXPIRED"

export interface Credential {
  id: string
  tokenId: string
  type: CredentialType
  studentId: string
  studentName: string
  enrollmentNumber: string
  program: string
  batch: string
  status: CredentialStatus
  issuedAt: string
  issuer: string
  metadata?: CredentialMetadata
}

export interface CredentialMetadata {
  cgpa?: number
  division?: string
  specialization?: string
  honorsTitle?: string
}

export interface ShareLink {
  id: string
  credentialId: string
  token: string
  url: string
  expiresAt?: string
  viewCount: number
  isActive: boolean
  createdAt: string
}

export interface CreateShareLinkInput {
  credentialId: string
  expiryDays?: number // 7, 30, 365, null for no expiry
}

export interface VerificationResult {
  valid: boolean
  credential?: {
    tokenId: string
    type: CredentialType
    studentName: string
    enrollmentNumber: string
    program: string
    batch: string
    issuedAt: string
    issuer: string
    status: CredentialStatus
    cgpa?: number
    division?: string
    semesters?: SemesterVerification[]
  }
  verificationDetails?: {
    verifiedAt: string
    expiresAt?: string
    signature: string
  }
  error?: string
}

export interface SemesterVerification {
  semester: number
  sgpa: number
  credits: number
  status: string
}
