export type ResultStatus = "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "PUBLISHED" | "WITHHELD" | "REJECTED"

export interface SemesterResult {
  id: string
  studentId: string
  semester: number
  academicYear: string
  sgpa: number
  cgpa: number
  totalCredits: number
  earnedCredits: number
  status: ResultStatus
  subjects: SubjectResult[]
  publishedAt?: string
  approvedBy?: string
  approvedAt?: string
  createdAt: string
  updatedAt: string
}

export interface SubjectResult {
  id: string
  courseCode: string
  courseName: string
  credits: number
  grade: string
  gradePoints: number
  marks?: number
  maxMarks?: number
  attendance?: number
}

export interface ResultFilters {
  semester?: number
  status?: ResultStatus
  academicYear?: string
  page?: number
  limit?: number
}

export interface GradeInfo {
  grade: string
  points: number
  minMarks: number
  maxMarks: number
  color: string
}

export const GRADES: GradeInfo[] = [
  { grade: "A+", points: 10, minMarks: 90, maxMarks: 100, color: "emerald" },
  { grade: "A", points: 9, minMarks: 80, maxMarks: 89, color: "green" },
  { grade: "B+", points: 8, minMarks: 70, maxMarks: 79, color: "lime" },
  { grade: "B", points: 7, minMarks: 60, maxMarks: 69, color: "yellow" },
  { grade: "C+", points: 6, minMarks: 55, maxMarks: 59, color: "amber" },
  { grade: "C", points: 5, minMarks: 50, maxMarks: 54, color: "orange" },
  { grade: "D", points: 4, minMarks: 40, maxMarks: 49, color: "red" },
  { grade: "F", points: 0, minMarks: 0, maxMarks: 39, color: "destructive" },
]
