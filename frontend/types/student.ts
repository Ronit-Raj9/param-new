import type { ResultStatus } from "./result"

export interface Student {
  id: string
  enrollmentNumber: string
  name: string
  email: string
  program: string
  programId: string
  batch: string
  currentSemester: number
  cgpa?: number
  totalCredits: number
  status: StudentStatus
  dateOfBirth?: string
  phone?: string
  address?: string
  admissionDate: string
  graduationDate?: string
  profilePicture?: string
  createdAt: string
  updatedAt: string
}

export type StudentStatus = 
  | "PENDING_ACTIVATION" 
  | "ACTIVE" 
  | "LEAVE_OF_ABSENCE" 
  | "REPEAT_YEAR" 
  | "DROPPED_OUT" 
  | "EARLY_EXIT" 
  | "GRADUATED"

// Import ResultStatus from result.ts when needed
export const STUDENT_STATUSES: StudentStatus[] = [
  "PENDING_ACTIVATION",
  "ACTIVE", 
  "LEAVE_OF_ABSENCE",
  "REPEAT_YEAR",
  "DROPPED_OUT",
  "EARLY_EXIT",
  "GRADUATED"
]

// Note: ResultStatus is imported from result.ts
// Use: import { ResultStatus } from './result' when needed
export interface StudentFilters {
  search?: string
  program?: string
  batch?: string
  status?: StudentStatus
  page?: number
  limit?: number
}

export interface StudentDashboard {
  profile: StudentProfile
  latestResult?: SemesterResultSummary
  degreeStatus: DegreeStatus
  announcements: Announcement[]
}

export interface StudentProfile {
  id: string
  enrollmentNumber: string
  name: string
  email: string
  program: string
  batch: string
  currentSemester: number
  cgpa?: number
  totalCredits: number
  status: StudentStatus
}

export interface SemesterResultSummary {
  id: string
  semester: number
  academicYear: string
  sgpa: number
  credits: number
  status: ResultStatus
  publishedAt?: string
}

export interface DegreeStatus {
  issued: boolean
  degreeId?: string
  expectedDate?: string
  type?: string
}

export interface Announcement {
  id: string
  title: string
  content: string
  createdAt: string
  priority: "LOW" | "MEDIUM" | "HIGH"
}
