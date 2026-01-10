import type {
  User,
  Student,
  SemesterResult,
  Credential,
  Degree,
  Approval,
  Correction,
  Program,
  Course,
  AuditLog,
  Job,
  PaginationParams,
  SearchParams,
  ApiResponse,
  PaginatedResponse,
} from "@/types"
import { fetcher, apiPost, apiPatch, apiDelete } from "./api"

/**
 * Typed API client with methods for all backend endpoints
 * Provides type-safe wrappers around fetch calls
 */

// ===== Authentication =====
export const authApi = {
  login: (email: string, privyToken: string) =>
    apiPost<{ user: User; sessionId: string }>("/api/auth/login", {
      email,
      privyToken,
    }),

  logout: () => apiPost<void>("/api/auth/logout", {}),

  activate: (token: string, displayName?: string) =>
    apiPost<{ user: User }>("/api/auth/activate", { token, displayName }),

  resetPassword: (email: string) =>
    apiPost<{ success: boolean }>("/api/auth/reset-password", { email }),

  me: () => fetcher<User>("/api/me"),
}

// ===== Users =====
export const usersApi = {
  list: (params?: SearchParams) =>
    fetcher<PaginatedResponse<User>>(`/api/admin/users?${new URLSearchParams(params as Record<string, string>)}`),

  get: (id: string) => fetcher<User>(`/api/admin/users/${id}`),

  create: (data: Partial<User>) => apiPost<User>("/api/admin/users", data),

  update: (id: string, data: Partial<User>) =>
    apiPatch<User>(`/api/admin/users/${id}`, data),

  delete: (id: string) => apiDelete<void>(`/api/admin/users/${id}`),

  suspend: (id: string) => apiPost<User>(`/api/admin/users/${id}/suspend`, {}),

  activate: (id: string) => apiPost<User>(`/api/admin/users/${id}/activate`, {}),
}

// ===== Students =====
export const studentsApi = {
  list: (params?: SearchParams) =>
    fetcher<PaginatedResponse<Student>>(
      `/api/admin/students?${new URLSearchParams(params as Record<string, string>)}`
    ),

  get: (id: string) => fetcher<Student>(`/api/admin/students/${id}`),

  update: (id: string, data: Partial<Student>) =>
    apiPatch<Student>(`/api/admin/students/${id}`, data),

  uploadCsv: (file: File, programId: string, batch: string) => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("programId", programId)
    formData.append("batch", batch)

    return fetch("/api/admin/students/upload", {
      method: "POST",
      credentials: "include",
      body: formData,
    }).then((res) => res.json())
  },

  downloadTemplate: () => "/templates/students_template.csv",
}

// ===== Results =====
export const resultsApi = {
  // Student endpoints
  getMyResults: () => fetcher<SemesterResult[]>("/api/student/results"),

  getMyResult: (id: string) => fetcher<SemesterResult>(`/api/student/results/${id}`),

  downloadPdf: (id: string) => `/api/student/results/${id}/pdf`,

  // Admin endpoints
  list: (params?: SearchParams) =>
    fetcher<PaginatedResponse<SemesterResult>>(
      `/api/admin/results?${new URLSearchParams(params as Record<string, string>)}`
    ),

  preview: (programId: string, batch: string, semester: number) =>
    fetcher<SemesterResult[]>(
      `/api/admin/results/preview?programId=${programId}&batch=${batch}&semester=${semester}`
    ),

  uploadCsv: (
    file: File,
    programId: string,
    batch: string,
    semester: number
  ) => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("programId", programId)
    formData.append("batch", batch)
    formData.append("semester", semester.toString())

    return fetch("/api/admin/results/upload", {
      method: "POST",
      credentials: "include",
      body: formData,
    }).then((res) => res.json())
  },

  update: (id: string, data: Partial<SemesterResult>) =>
    apiPatch<SemesterResult>(`/api/admin/results/${id}`, data),

  sendForApproval: (ids: string[]) =>
    apiPost<{ success: boolean }>("/api/admin/results/send-for-approval", {
      ids,
    }),

  downloadTemplate: () => "/templates/semester_results_template.csv",
}

// ===== Credentials =====
export const credentialsApi = {
  // Student endpoints
  getMy: () => fetcher<Credential[]>("/api/student/credentials"),

  getDegree: () => fetcher<Credential | null>("/api/student/degree"),

  createShareLink: (credentialId: string, expiresIn?: number) =>
    apiPost<{ token: string; url: string }>("/api/student/credentials/share", {
      credentialId,
      expiresIn,
    }),

  getMyShares: () =>
    fetcher<Array<{ id: string; token: string; expiresAt: string; views: number }>>(
      "/api/student/shares"
    ),

  revokeShare: (shareId: string) =>
    apiDelete<void>(`/api/student/shares/${shareId}`),

  // Public endpoints
  verify: (token: string) =>
    fetcher<{
      valid: boolean
      credential: Credential
      verificationDetails: Record<string, unknown>
    }>(`/api/verify?token=${token}`),
}

// ===== Approvals =====
export const approvalsApi = {
  list: (type?: string, status?: string) =>
    fetcher<PaginatedResponse<Approval>>(
      `/api/admin/approvals?type=${type || ""}&status=${status || ""}`
    ),

  get: (id: string) => fetcher<Approval>(`/api/admin/approvals/${id}`),

  approve: (id: string, notes?: string, overrideReason?: string) =>
    apiPost<Approval>(`/api/admin/approvals/${id}/approve`, {
      notes,
      overrideReason,
    }),

  reject: (id: string, reason: string) =>
    apiPost<Approval>(`/api/admin/approvals/${id}/reject`, { reason }),
}

// ===== Degrees =====
export const degreesApi = {
  list: (params?: SearchParams) =>
    fetcher<PaginatedResponse<Degree>>(
      `/api/admin/degrees?${new URLSearchParams(params as Record<string, string>)}`
    ),

  get: (id: string) => fetcher<Degree>(`/api/admin/degrees/${id}`),

  propose: (programId: string, batch: string, studentIds: string[]) =>
    apiPost<Degree>("/api/admin/degrees/propose", {
      programId,
      batch,
      studentIds,
    }),

  approve: (id: string, comments?: string) =>
    apiPost<Degree>(`/api/admin/degrees/${id}/approve`, { comments }),

  reject: (id: string, reason: string) =>
    apiPost<Degree>(`/api/admin/degrees/${id}/reject`, { reason }),
}

// ===== Issuance =====
export const issuanceApi = {
  getEligible: (programId: string, batch: string, type: string) =>
    fetcher<Student[]>(
      `/api/admin/issuance/eligible?programId=${programId}&batch=${batch}&type=${type}`
    ),

  issue: (studentIds: string[], credentialType: string) =>
    apiPost<{ jobId: string }>("/api/admin/issuance", {
      studentIds,
      credentialType,
    }),

  getJob: (jobId: string) => fetcher<Job>(`/api/admin/jobs/${jobId}`),
}

// ===== Corrections =====
export const correctionsApi = {
  list: (status?: string) =>
    fetcher<PaginatedResponse<Correction>>(
      `/api/admin/corrections?status=${status || ""}`
    ),

  get: (id: string) => fetcher<Correction>(`/api/admin/corrections/${id}`),

  create: (data: Partial<Correction>) =>
    apiPost<Correction>("/api/admin/corrections", data),

  approve: (id: string, notes?: string) =>
    apiPost<Correction>(`/api/admin/corrections/${id}/approve`, { notes }),

  reject: (id: string, reason: string) =>
    apiPost<Correction>(`/api/admin/corrections/${id}/reject`, { reason }),
}

// ===== Curriculum =====
export const curriculumApi = {
  listPrograms: () => fetcher<Program[]>("/api/admin/curriculum/programs"),

  getProgram: (id: string) =>
    fetcher<Program>(`/api/admin/curriculum/programs/${id}`),

  createProgram: (data: Partial<Program>) =>
    apiPost<Program>("/api/admin/curriculum/programs", data),

  updateProgram: (id: string, data: Partial<Program>) =>
    apiPatch<Program>(`/api/admin/curriculum/programs/${id}`, data),

  listCourses: (programId?: string) =>
    fetcher<Course[]>(
      `/api/admin/curriculum/courses${programId ? `?programId=${programId}` : ""}`
    ),

  getCourse: (id: string) =>
    fetcher<Course>(`/api/admin/curriculum/courses/${id}`),

  createCourse: (data: Partial<Course>) =>
    apiPost<Course>("/api/admin/curriculum/courses", data),

  updateCourse: (id: string, data: Partial<Course>) =>
    apiPatch<Course>(`/api/admin/curriculum/courses/${id}`, data),
}

// ===== Audit Logs =====
export const auditApi = {
  list: (params?: {
    userId?: string
    action?: string
    resourceType?: string
    fromDate?: string
    toDate?: string
    page?: number
    limit?: number
  }) =>
    fetcher<PaginatedResponse<AuditLog>>(
      `/api/admin/logs?${new URLSearchParams(params as Record<string, string>)}`
    ),

  export: (format: "CSV" | "JSON" | "PDF") =>
    apiPost<{ jobId: string }>("/api/admin/logs/export", { format }),
}

// ===== Export & Tools =====
export const exportApi = {
  exportStudents: (programId?: string, batch?: string) =>
    apiPost<{ downloadUrl: string }>("/api/admin/export/students", {
      programId,
      batch,
    }),

  exportResults: (programId?: string, batch?: string, semester?: number) =>
    apiPost<{ downloadUrl: string }>("/api/admin/export/results", {
      programId,
      batch,
      semester,
    }),

  rebuildSearchIndex: () =>
    apiPost<{ jobId: string }>("/api/admin/rebuild/search-index", {}),

  recalculateCgpa: (studentIds?: string[]) =>
    apiPost<{ jobId: string }>("/api/admin/rebuild/cgpa", { studentIds }),
}

// ===== Settings =====
export const settingsApi = {
  get: () =>
    fetcher<Record<string, unknown>>("/api/admin/settings"),

  update: (data: Record<string, unknown>) =>
    apiPatch<Record<string, unknown>>("/api/admin/settings", data),
}

// ===== Dashboard =====
export const dashboardApi = {
  studentDashboard: () =>
    fetcher<{
      profile: Student
      latestResult: SemesterResult | null
      degreeStatus: Credential | null
      announcements: Array<{ id: string; title: string; content: string }>
    }>("/api/student/dashboard"),

  adminDashboard: () =>
    fetcher<{
      stats: {
        totalStudents: number
        resultsPublished: number
        credentialsIssued: number
        activeShares: number
      }
      pendingActions: {
        results: number
        degrees: number
        corrections: number
      }
      recentActivity: AuditLog[]
    }>("/api/admin/dashboard/stats"),
}
