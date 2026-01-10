import { format, formatDistanceToNow, parseISO } from "date-fns"

export function formatDate(date: string | Date, pattern = "MMM d, yyyy"): string {
  const d = typeof date === "string" ? parseISO(date) : date
  return format(d, pattern)
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date
  return format(d, "MMM d, yyyy h:mm a")
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date
  return formatDistanceToNow(d, { addSuffix: true })
}

export function formatGPA(gpa: number | undefined | null): string {
  if (gpa === undefined || gpa === null) return "-"
  return gpa.toFixed(2)
}

export function formatCredits(credits: number): string {
  return `${credits} ${credits === 1 ? "credit" : "credits"}`
}

export function formatEnrollmentNumber(enrollmentNumber: string): string {
  return enrollmentNumber.toUpperCase()
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return `${str.slice(0, length)}...`
}
