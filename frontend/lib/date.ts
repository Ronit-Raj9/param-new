/**
 * Date formatting utilities
 * Consistent date handling across the application
 */

/**
 * Format date to readable string
 * @example formatDate("2024-01-15") => "15 Jan 2024"
 */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  }

  return new Intl.DateTimeFormat("en-IN", defaultOptions).format(dateObj)
}

/**
 * Format date with time
 * @example formatDateTime("2024-01-15T10:30:00Z") => "15 Jan 2024, 10:30 AM"
 */
export function formatDateTime(date: string | Date): string {
  return formatDate(date, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * Format date to relative time
 * @example formatRelativeTime("2024-01-14") => "Yesterday"
 */
export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - dateObj.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return "Just now"
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`
  if (diffDay === 1) return "Yesterday"
  if (diffDay < 7) return `${diffDay} days ago`
  
  return formatDate(dateObj)
}

/**
 * Format date to ISO string for API
 * @example toIsoDate(new Date()) => "2024-01-15"
 */
export function toIsoDate(date: Date): string {
  return date.toISOString().split("T")[0]
}

/**
 * Parse academic year
 * @example parseAcademicYear("2023-2024") => { start: 2023, end: 2024 }
 */
export function parseAcademicYear(year: string): { start: number; end: number } {
  const [start, end] = year.split("-").map(Number)
  return { start, end }
}

/**
 * Format academic year
 * @example formatAcademicYear(2023, 2024) => "2023-2024"
 */
export function formatAcademicYear(startYear: number, endYear?: number): string {
  if (!endYear) {
    endYear = startYear + 1
  }
  return `${startYear}-${endYear}`
}

/**
 * Get current academic year
 * Assuming academic year starts in July
 */
export function getCurrentAcademicYear(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1 // 1-indexed

  if (month >= 7) {
    return formatAcademicYear(year, year + 1)
  } else {
    return formatAcademicYear(year - 1, year)
  }
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dob: string | Date): number {
  const dobDate = typeof dob === "string" ? new Date(dob) : dob
  const today = new Date()
  let age = today.getFullYear() - dobDate.getFullYear()
  const monthDiff = today.getMonth() - dobDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
    age--
  }
  
  return age
}

/**
 * Check if date is in the past
 */
export function isPast(date: string | Date): boolean {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return dateObj < new Date()
}

/**
 * Check if date is in the future
 */
export function isFuture(date: string | Date): boolean {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return dateObj > new Date()
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Subtract days from a date
 */
export function subtractDays(date: Date, days: number): Date {
  return addDays(date, -days)
}
