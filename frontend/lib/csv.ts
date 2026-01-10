import Papa from "papaparse"
import * as z from "zod"

/**
 * CSV parsing and validation utilities
 */

export interface CsvParseResult<T> {
  data: T[]
  errors: CsvError[]
  meta: {
    totalRows: number
    validRows: number
    errorRows: number
  }
}

export interface CsvError {
  row: number
  field?: string
  message: string
  data?: Record<string, unknown>
}

/**
 * Parse CSV file with validation
 */
export async function parseCsv<T>(
  file: File,
  schema: z.ZodSchema<T>
): Promise<CsvParseResult<T>> {
  return new Promise((resolve, reject) => {
    const validData: T[] = []
    const errors: CsvError[] = []
    let rowIndex = 0

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
      step: (row: any) => {
        rowIndex++
        
        const result = schema.safeParse(row.data)
        
        if (result.success) {
          validData.push(result.data)
        } else {
          result.error.errors.forEach((err) => {
            errors.push({
              row: rowIndex,
              field: err.path.join("."),
              message: err.message,
              data: row.data as Record<string, unknown>,
            })
          })
        }
      },
      complete: () => {
        resolve({
          data: validData,
          errors,
          meta: {
            totalRows: rowIndex,
            validRows: validData.length,
            errorRows: errors.length,
          },
        })
      },
      error: (error: Error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`))
      },
    })
  })
}

/**
 * Preview CSV file (first N rows)
 */
export async function previewCsv(file: File, limit: number = 50): Promise<{
  headers: string[]
  rows: Record<string, unknown>[]
}> {
  return new Promise((resolve, reject) => {
    const rows: Record<string, unknown>[] = []
    let headers: string[] = []

    Papa.parse(file, {
      header: true,
      preview: limit,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
      complete: (results: any) => {
        headers = results.meta.fields || []
        rows.push(...(results.data as Record<string, unknown>[]))
        resolve({ headers, rows })
      },
      error: (error: Error) => {
        reject(new Error(`CSV preview failed: ${error.message}`))
      },
    })
  })
}

/**
 * Validate CSV headers
 */
export function validateHeaders(
  actual: string[],
  expected: string[]
): { valid: boolean; missing: string[]; extra: string[] } {
  const actualSet = new Set(actual.map((h) => h.toLowerCase()))
  const expectedSet = new Set(expected.map((h) => h.toLowerCase()))

  const missing = expected.filter((h) => !actualSet.has(h.toLowerCase()))
  const extra = actual.filter((h) => !expectedSet.has(h.toLowerCase()))

  return {
    valid: missing.length === 0,
    missing,
    extra,
  }
}

/**
 * Convert data to CSV string
 */
export function toCsv<T extends Record<string, unknown>>(
  data: T[],
  fields?: (keyof T)[]
): string {
  if (data.length === 0) return ""

  const headers = fields || (Object.keys(data[0]) as (keyof T)[])
  const rows = data.map((item) =>
    headers.map((field) => {
      const value = item[field]
      // Handle values with commas or quotes
      if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    })
  )

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n")

  return csvContent
}

/**
 * Download CSV file
 */
export function downloadCsv(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Student CSV schema
 */
export const studentCsvSchema = z.object({
  enrollment_number: z
    .string()
    .min(5, "Enrollment number must be at least 5 characters")
    .max(20, "Enrollment number must be at most 20 characters"),
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  email: z.string().email("Invalid email address"),
  program: z.string().min(1, "Program is required"),
  batch: z.string().regex(/^\d{4}$/, "Batch must be YYYY format"),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format"),
  gender: z.enum(["M", "F", "O"], { errorMap: () => ({ message: "Gender must be M, F, or O" }) }),
  phone: z.string().regex(/^\d{10}$/, "Phone must be 10 digits"),
})

/**
 * Result CSV schema
 */
export const resultCsvSchema = z.object({
  enrollment_number: z.string().min(5),
  semester: z.coerce.number().int().min(1).max(10),
  academic_year: z.string().regex(/^\d{4}-\d{4}$/),
  subject_code: z.string().min(1),
  subject_name: z.string().min(1),
  credits: z.coerce.number().min(0).max(6),
  grade: z.enum(["A+", "A", "B+", "B", "C", "D", "F", "I", "W"]),
  grade_points: z.coerce.number().min(0).max(10),
  internal_marks: z.coerce.number().min(0).max(100),
  external_marks: z.coerce.number().min(0).max(100),
  total_marks: z.coerce.number().min(0).max(100),
  attendance_percent: z.coerce.number().min(0).max(100),
})

export type StudentCsvRow = z.infer<typeof studentCsvSchema>
export type ResultCsvRow = z.infer<typeof resultCsvSchema>
