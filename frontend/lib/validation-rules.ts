/**
 * Business validation rules
 * Contains validation logic that mirrors backend rules
 */

import * as z from "zod"

/**
 * Enrollment number validation
 */
export const enrollmentNumberSchema = z
  .string()
  .min(5, "Enrollment number must be at least 5 characters")
  .max(20, "Enrollment number must be at most 20 characters")
  .regex(/^[A-Z0-9]+$/, "Enrollment number must contain only uppercase letters and numbers")

/**
 * Email validation (institutional domain)
 */
export const institutionalEmailSchema = z
  .string()
  .email("Invalid email address")
  .refine(
    (email) => {
      const allowedDomains = ["iiitm.ac.in", "iiitm.edu.in"]
      const domain = email.split("@")[1]?.toLowerCase()
      return allowedDomains.includes(domain)
    },
    { message: "Email must be from institutional domain (@iiitm.ac.in or @iiitm.edu.in)" }
  )

/**
 * Batch year validation
 */
export const batchYearSchema = z
  .string()
  .regex(/^\d{4}$/, "Batch must be a 4-digit year")
  .refine(
    (year) => {
      const yearNum = parseInt(year, 10)
      const currentYear = new Date().getFullYear()
      return yearNum >= 2000 && yearNum <= currentYear + 5
    },
    { message: "Batch year must be between 2000 and 5 years from now" }
  )

/**
 * Academic year validation
 */
export const academicYearSchema = z
  .string()
  .regex(/^\d{4}-\d{4}$/, "Academic year must be in YYYY-YYYY format")
  .refine(
    (year) => {
      const [start, end] = year.split("-").map(Number)
      return end === start + 1
    },
    { message: "Academic year end must be one year after start" }
  )

/**
 * Semester number validation
 */
export const semesterSchema = z
  .number()
  .int("Semester must be a whole number")
  .min(1, "Semester must be at least 1")
  .max(10, "Semester must be at most 10")

/**
 * CGPA/SGPA validation
 */
export const gpaSchema = z
  .number()
  .min(0, "GPA must be at least 0")
  .max(10, "GPA must be at most 10")
  .multipleOf(0.01, "GPA can have at most 2 decimal places")

/**
 * Credits validation
 */
export const creditsSchema = z
  .number()
  .min(0, "Credits must be at least 0")
  .max(6, "Credits must be at most 6")

/**
 * Marks validation
 */
export const marksSchema = z
  .number()
  .min(0, "Marks must be at least 0")
  .max(100, "Marks must be at most 100")

/**
 * Grade validation
 */
export const gradeSchema = z.enum(["A+", "A", "B+", "B", "C", "D", "F", "I", "W"], {
  errorMap: () => ({ message: "Invalid grade" }),
})

/**
 * Phone number validation (Indian)
 */
export const phoneSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, "Phone number must be a valid 10-digit Indian number")

/**
 * Date of birth validation
 */
export const dobSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .refine(
    (date) => {
      const dob = new Date(date)
      const age = new Date().getFullYear() - dob.getFullYear()
      return age >= 16 && age <= 60
    },
    { message: "Age must be between 16 and 60 years" }
  )

/**
 * Validate grade vs marks consistency
 */
export function validateGradeMarks(grade: string, totalMarks: number): boolean {
  const gradeRanges: Record<string, [number, number]> = {
    "A+": [90, 100],
    "A": [80, 89],
    "B+": [70, 79],
    "B": [60, 69],
    "C": [50, 59],
    "D": [40, 49],
    "F": [0, 39],
    "I": [0, 100], // Incomplete - any marks
    "W": [0, 100], // Withdrawn - any marks
  }

  const range = gradeRanges[grade]
  if (!range) return false

  return totalMarks >= range[0] && totalMarks <= range[1]
}

/**
 * Calculate grade from marks
 */
export function calculateGrade(totalMarks: number): string {
  if (totalMarks >= 90) return "A+"
  if (totalMarks >= 80) return "A"
  if (totalMarks >= 70) return "B+"
  if (totalMarks >= 60) return "B"
  if (totalMarks >= 50) return "C"
  if (totalMarks >= 40) return "D"
  return "F"
}

/**
 * Calculate grade points from grade
 */
export function calculateGradePoints(grade: string): number {
  const gradePoints: Record<string, number> = {
    "A+": 10,
    "A": 9,
    "B+": 8,
    "B": 7,
    "C": 6,
    "D": 5,
    "F": 0,
    "I": 0,
    "W": 0,
  }

  return gradePoints[grade] ?? 0
}

/**
 * Calculate SGPA from subjects
 */
export function calculateSgpa(
  subjects: Array<{ credits: number; gradePoints: number }>
): number {
  const totalCredits = subjects.reduce((sum, s) => sum + s.credits, 0)
  const weightedGradePoints = subjects.reduce(
    (sum, s) => sum + s.credits * s.gradePoints,
    0
  )

  if (totalCredits === 0) return 0

  return Number((weightedGradePoints / totalCredits).toFixed(2))
}

/**
 * Calculate CGPA from semesters
 */
export function calculateCgpa(
  semesters: Array<{ credits: number; sgpa: number }>
): number {
  const totalCredits = semesters.reduce((sum, s) => sum + s.credits, 0)
  const weightedSgpa = semesters.reduce((sum, s) => sum + s.credits * s.sgpa, 0)

  if (totalCredits === 0) return 0

  return Number((weightedSgpa / totalCredits).toFixed(2))
}

/**
 * Get division/class from CGPA
 */
export function getDivision(cgpa: number): string {
  if (cgpa >= 8.5) return "First Division with Distinction"
  if (cgpa >= 6.5) return "First Division"
  if (cgpa >= 5.5) return "Second Division"
  return "Pass"
}

/**
 * Validate credit requirements
 */
export function validateCredits(
  earnedCredits: number,
  requiredCredits: number
): { valid: boolean; message?: string } {
  if (earnedCredits < requiredCredits) {
    return {
      valid: false,
      message: `Insufficient credits. Required: ${requiredCredits}, Earned: ${earnedCredits}`,
    }
  }

  return { valid: true }
}
