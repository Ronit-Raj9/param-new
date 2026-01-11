// Re-export all types
export * from "./auth"
export * from "./user"
export * from "./common"

// Export from student (has ResultStatus and DegreeStatus that conflict)
export type { Student, StudentStatus, StudentFilters, StudentDashboard, StudentProfile } from "./student"
export { STUDENT_STATUSES } from "./student"

// Export from result (has ResultStatus that conflicts with student)
export type { SemesterResult, SubjectResult, ResultFilters, GradeInfo, ResultStatus } from "./result"
export { GRADES } from "./result"

// Export from degree (has DegreeStatus that conflicts with student)  
export type { Degree, DegreeMetadata, DegreeProposal, DegreeApproval, DegreeStatus } from "./degree"

// Export remaining types
export * from "./credential"
export * from "./approval"
export * from "./correction"
export * from "./curriculum"
export * from "./audit"
export * from "./job"

// Export from api last (has ApiError and PaginatedResponse that might conflict)
export type { ApiResponse, ApiError, PaginatedResponse, SearchParams, PaginationParams, ApiListResponse } from "./api"

// Re-export UserStatus explicitly for convenience
export type { UserStatus } from "./auth"
