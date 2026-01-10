// Background job types

export interface Job {
  id: string
  type: JobType
  status: JobStatus
  progress: number
  total?: number
  processed?: number
  failed?: number
  startedAt: string
  completedAt?: string
  errorMessage?: string
  result?: JobResult
  metadata: Record<string, unknown>
}

export type JobType =
  | "CSV_UPLOAD_STUDENTS"
  | "CSV_UPLOAD_RESULTS"
  | "PDF_GENERATION"
  | "CREDENTIAL_ISSUANCE"
  | "BULK_EMAIL"
  | "DATA_EXPORT"
  | "CGPA_RECALCULATION"

export type JobStatus =
  | "QUEUED"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"

export interface JobResult {
  success: number
  failed: number
  errors?: JobError[]
  downloadUrl?: string
}

export interface JobError {
  row?: number
  field?: string
  message: string
  data?: Record<string, unknown>
}

export interface JobProgress {
  jobId: string
  status: JobStatus
  progress: number
  message?: string
  timestamp: string
}
