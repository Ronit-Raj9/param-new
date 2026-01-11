// Role definitions
export const ROLES = {
  ADMIN: "ADMIN",
  ACADEMIC: "ACADEMIC",
  STUDENT: "STUDENT",
  VERIFIER: "VERIFIER",
} as const;

export type RoleType = (typeof ROLES)[keyof typeof ROLES];

// Status definitions
export const USER_STATUS = {
  PENDING_ACTIVATION: "PENDING_ACTIVATION",
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
  DEACTIVATED: "DEACTIVATED",
} as const;

export const STUDENT_STATUS = {
  PENDING_ACTIVATION: "PENDING_ACTIVATION",
  ACTIVE: "ACTIVE",
  LEAVE_OF_ABSENCE: "LEAVE_OF_ABSENCE",
  REPEAT_YEAR: "REPEAT_YEAR",
  DROPPED_OUT: "DROPPED_OUT",
  EARLY_EXIT: "EARLY_EXIT",
  GRADUATED: "GRADUATED",
} as const;

export const RESULT_STATUS = {
  DRAFT: "DRAFT",
  REVIEWED: "REVIEWED",
  APPROVED: "APPROVED",
  ISSUED: "ISSUED",
  WITHHELD: "WITHHELD",
} as const;

export const CREDENTIAL_STATUS = {
  PENDING: "PENDING",
  ISSUED: "ISSUED",
  REVOKED: "REVOKED",
  REPLACED: "REPLACED",
} as const;

export const DEGREE_PROPOSAL_STATUS = {
  DRAFT: "DRAFT",
  PENDING_ACADEMIC: "PENDING_ACADEMIC",
  PENDING_ADMIN: "PENDING_ADMIN",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  ISSUED: "ISSUED",
} as const;

// Grade scale (IIITM standard)
export const DEFAULT_GRADE_SCALE = [
  { grade: "A+", gradePoints: 10, minMarks: 90, description: "Outstanding", isPassing: true },
  { grade: "A", gradePoints: 9, minMarks: 80, description: "Excellent", isPassing: true },
  { grade: "B+", gradePoints: 8, minMarks: 70, description: "Very Good", isPassing: true },
  { grade: "B", gradePoints: 7, minMarks: 60, description: "Good", isPassing: true },
  { grade: "C+", gradePoints: 6, minMarks: 55, description: "Above Average", isPassing: true },
  { grade: "C", gradePoints: 5, minMarks: 50, description: "Average", isPassing: true },
  { grade: "D", gradePoints: 4, minMarks: 40, description: "Below Average", isPassing: true },
  { grade: "F", gradePoints: 0, minMarks: 0, description: "Fail", isPassing: false },
  { grade: "I", gradePoints: 0, minMarks: null, description: "Incomplete", isPassing: false },
  { grade: "W", gradePoints: 0, minMarks: null, description: "Withdrawn", isPassing: false },
] as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// File upload limits
export const FILE_LIMITS = {
  MAX_CSV_SIZE_MB: 10,
  MAX_PDF_SIZE_MB: 5,
  MAX_IMAGE_SIZE_MB: 2,
  ALLOWED_CSV_TYPES: ["text/csv", "application/vnd.ms-excel"],
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"],
} as const;

// Job queue names
export const QUEUE_NAMES = {
  CSV: "csv-processing",
  PDF: "pdf-generation",
  BLOCKCHAIN: "blockchain-operations",
  WALLET: "wallet-operations",
  EMAIL: "email-sending",
} as const;

// Cookie names
export const COOKIE_NAMES = {
  SESSION: "param_session",
  REFRESH: "param_refresh",
} as const;

// Error codes
export const ERROR_CODES = {
  // Auth errors
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  INVALID_TOKEN: "INVALID_TOKEN",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",

  // Validation errors
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
  DUPLICATE_ENTRY: "DUPLICATE_ENTRY",

  // Resource errors
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",

  // Business logic errors
  INVALID_STATE: "INVALID_STATE",
  CREDIT_VALIDATION_FAILED: "CREDIT_VALIDATION_FAILED",
  APPROVAL_REQUIRED: "APPROVAL_REQUIRED",

  // System errors
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  DATABASE_ERROR: "DATABASE_ERROR",
  BLOCKCHAIN_ERROR: "BLOCKCHAIN_ERROR",
} as const;
