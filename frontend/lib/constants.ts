export const APP_NAME = "PARAM"
export const INSTITUTION_NAME = "IIITM Gwalior"
export const INSTITUTION_FULL_NAME = "ABV-Indian Institute of Information Technology and Management Gwalior"

export const PROGRAMS = [
  { value: "btech-cse", label: "B.Tech Computer Science & Engineering" },
  { value: "btech-it", label: "B.Tech Information Technology" },
  { value: "btech-ece", label: "B.Tech Electronics & Communication Engineering" },
  { value: "mtech-cse", label: "M.Tech Computer Science & Engineering" },
  { value: "mtech-it", label: "M.Tech Information Technology" },
  { value: "mba", label: "Master of Business Administration" },
  { value: "phd", label: "Doctor of Philosophy" },
] as const

export const BATCHES = ["2020", "2021", "2022", "2023", "2024", "2025"] as const

export const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8] as const

export const STUDENT_STATUSES = [
  { value: "ACTIVE", label: "Active", color: "success" },
  { value: "GRADUATED", label: "Graduated", color: "info" },
  { value: "WITHDRAWN", label: "Withdrawn", color: "warning" },
  { value: "SUSPENDED", label: "Suspended", color: "destructive" },
] as const

export const RESULT_STATUSES = [
  { value: "DRAFT", label: "Draft", color: "warning" },
  { value: "PENDING_APPROVAL", label: "Pending Approval", color: "info" },
  { value: "APPROVED", label: "Approved", color: "success" },
  { value: "PUBLISHED", label: "Published", color: "success" },
  { value: "WITHHELD", label: "Withheld", color: "destructive" },
  { value: "REJECTED", label: "Rejected", color: "destructive" },
] as const

export const SHARE_EXPIRY_OPTIONS = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "365", label: "1 year" },
  { value: "never", label: "No expiry" },
] as const

export const ROUTES = {
  home: "/",
  login: "/login",
  activate: "/activate",
  verify: (token: string) => `/verify/${token}`,
  docs: "/docs",
  support: "/support",

  // Student routes
  student: {
    dashboard: "/student",
    results: "/student/results",
    resultDetail: (id: string) => `/student/results/${id}`,
    degree: "/student/degree",
    share: "/student/share",
    profile: "/student/profile",
  },

  // Admin routes
  admin: {
    dashboard: "/admin",
    users: "/admin/users",
    userDetail: (id: string) => `/admin/users/${id}`,
    students: "/admin/students",
    studentDetail: (id: string) => `/admin/students/${id}`,
    studentsUpload: "/admin/students/upload",
    resultsUpload: "/admin/results/upload",
    resultsPreview: "/admin/results/preview",
    approve: "/admin/approve",
    approveDetail: (id: string) => `/admin/approve/${id}`,
    issuance: "/admin/issuance",
    degrees: "/admin/degrees",
    corrections: "/admin/corrections",
    curriculum: "/admin/curriculum",
    logs: "/admin/logs",
    export: "/admin/export",
    settings: "/admin/settings",
  },
} as const
