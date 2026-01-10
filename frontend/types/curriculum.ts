// Curriculum-related types

export interface Program {
  id: string
  code: string
  name: string
  type: "BACHELOR" | "MASTER" | "DOCTORATE" | "DIPLOMA"
  department: string
  duration: number
  totalCredits: number
  currentVersion: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ProgramVersion {
  id: string
  programId: string
  version: number
  effectiveFrom: string
  effectiveTo?: string
  semesters: Semester[]
  creditRequirements: CreditRequirements
  gradingScheme: GradingScheme
}

export interface Semester {
  number: number
  courses: Course[]
  minCredits: number
  maxCredits: number
}

export interface Course {
  id: string
  code: string
  name: string
  credits: number
  type: "CORE" | "ELECTIVE" | "AUDIT"
  prerequisites?: string[]
}

export interface CreditRequirements {
  total: number
  core: number
  elective: number
  audit?: number
}

export interface GradingScheme {
  id: string
  name: string
  grades: Grade[]
}

export interface Grade {
  grade: string
  minMarks: number
  maxMarks: number
  gradePoints: number
  description: string
}

export interface Curriculum {
  program: Program
  version: ProgramVersion
  courses: Course[]
}
