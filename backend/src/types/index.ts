import { Role, ResultStatus, CredentialStatus, ApprovalStatus, ApprovalType } from "@prisma/client";

// Note: Express Request type extensions are in src/modules/auth/auth.middleware.ts
// to use the actual Prisma User type

/**
 * Authenticated user type (subset of Prisma User)
 */
export interface AuthUser {
  id: string;
  privyId: string;
  email: string;
  name: string;
  role: Role;
  studentId?: string;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Bulk operation result
 */
export interface BulkOperationResult<T = any> {
  success: T[];
  errors: Array<{
    index: number;
    data: any;
    error: string;
  }>;
}

/**
 * Grade calculation
 */
export interface GradeInfo {
  grade: string;
  gradePoints: number;
}

/**
 * SGPA calculation result
 */
export interface SGPAResult {
  sgpa: number;
  totalCredits: number;
  totalGradePoints: number;
}

/**
 * CGPA calculation result
 */
export interface CGPAResult {
  cgpa: number;
  totalCredits: number;
  totalGradePoints: number;
  semesters: number;
}

/**
 * Degree eligibility check
 */
export interface DegreeEligibility {
  eligible: boolean;
  completedCredits: number;
  requiredCredits: number;
  cgpa: number;
  minimumCgpa: number;
  completedSemesters: number;
  requiredSemesters: number;
  pendingResults: number;
  failedCourses: number;
  issues: string[];
}

/**
 * Credential metadata for NFT
 */
export interface CredentialMetadata {
  name: string;
  description: string;
  image: string;
  external_url: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  properties: {
    credentialHash: string;
    pdfCID: string;
    studentEnrollment: string;
    issuedAt: string;
  };
}

/**
 * Approval action
 */
export interface ApprovalAction {
  action: "approve" | "reject";
  comments?: string;
  level: number;
}

/**
 * Result upload data
 */
export interface ResultUploadData {
  enrollmentNo: string;
  semester: number;
  academicYear: string;
  courses: Array<{
    courseCode: string;
    marks?: number;
    grade: string;
    gradePoints: number;
  }>;
}

/**
 * Student import data
 */
export interface StudentImportData {
  enrollmentNo: string;
  email: string;
  name: string;
  dateOfBirth?: string;
  programId: string;
  batchYear: number;
}

/**
 * Job status update
 */
export interface JobStatusUpdate {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress?: number;
  result?: any;
  error?: string;
}

export {
  Role,
  ResultStatus,
  CredentialStatus,
  ApprovalStatus,
  ApprovalType,
};
