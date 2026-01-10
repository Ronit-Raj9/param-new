import {
  format,
  parseISO,
  isValid,
  addDays as dateFnsAddDays,
  addMonths,
  startOfDay,
  endOfDay,
  differenceInDays,
  differenceInYears,
} from "date-fns";

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  return dateFnsAddDays(date, days);
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string, pattern: string = "dd MMM yyyy"): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return isValid(d) ? format(d, pattern) : "";
}

/**
 * Format date and time
 */
export function formatDateTime(date: Date | string): string {
  return formatDate(date, "dd MMM yyyy, HH:mm");
}

/**
 * Get academic year from date (e.g., "2023-24")
 */
export function getAcademicYear(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  // Academic year starts in July (month 6)
  if (month >= 6) {
    return `${year}-${(year + 1).toString().slice(-2)}`;
  }
  return `${year - 1}-${year.toString().slice(-2)}`;
}

/**
 * Get batch string from admission year (e.g., "2020-2024")
 */
export function getBatchString(admissionYear: number, durationYears: number = 4): string {
  return `${admissionYear}-${admissionYear + durationYears}`;
}

/**
 * Calculate expiry date
 */
export function getExpiryDate(days: number): Date {
  return addDays(new Date(), days);
}

/**
 * Check if date is expired
 */
export function isExpired(date: Date | string): boolean {
  const d = typeof date === "string" ? parseISO(date) : date;
  return d < new Date();
}

/**
 * Get date range for filtering
 */
export function getDateRange(date: Date): { start: Date; end: Date } {
  return {
    start: startOfDay(date),
    end: endOfDay(date),
  };
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: Date | string): number {
  const dob = typeof dateOfBirth === "string" ? parseISO(dateOfBirth) : dateOfBirth;
  return differenceInYears(new Date(), dob);
}
