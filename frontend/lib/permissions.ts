/**
 * Role and permission utilities
 */

export const USER_ROLES = {
  ADMIN: "ADMIN",
  ACADEMIC: "ACADEMIC",
  STUDENT: "STUDENT",
  VERIFIER: "VERIFIER",
} as const

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES]

// Permission definitions
export const PERMISSIONS = {
  // User management
  MANAGE_USERS: "MANAGE_USERS",
  VIEW_USERS: "VIEW_USERS",

  // Student management
  MANAGE_STUDENTS: "MANAGE_STUDENTS",
  VIEW_STUDENTS: "VIEW_STUDENTS",
  UPLOAD_STUDENTS: "UPLOAD_STUDENTS",

  // Results management
  UPLOAD_RESULTS: "UPLOAD_RESULTS",
  EDIT_RESULTS: "EDIT_RESULTS",
  VIEW_RESULTS: "VIEW_RESULTS",
  APPROVE_RESULTS: "APPROVE_RESULTS",

  // Credential management
  ISSUE_CREDENTIALS: "ISSUE_CREDENTIALS",
  REVOKE_CREDENTIALS: "REVOKE_CREDENTIALS",
  VIEW_CREDENTIALS: "VIEW_CREDENTIALS",

  // Degree management
  PROPOSE_DEGREES: "PROPOSE_DEGREES",
  APPROVE_DEGREES: "APPROVE_DEGREES",

  // Correction management
  CREATE_CORRECTIONS: "CREATE_CORRECTIONS",
  APPROVE_CORRECTIONS: "APPROVE_CORRECTIONS",

  // Curriculum management
  MANAGE_CURRICULUM: "MANAGE_CURRICULUM",
  VIEW_CURRICULUM: "VIEW_CURRICULUM",

  // System management
  MANAGE_SETTINGS: "MANAGE_SETTINGS",
  VIEW_AUDIT_LOGS: "VIEW_AUDIT_LOGS",
  EXPORT_DATA: "EXPORT_DATA",

  // Approval workflow
  OVERRIDE_APPROVAL: "OVERRIDE_APPROVAL",
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

// Role to permissions mapping
const rolePermissions: Record<UserRole, Permission[]> = {
  ADMIN: Object.values(PERMISSIONS) as Permission[],
  
  ACADEMIC: [
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.VIEW_STUDENTS,
    PERMISSIONS.UPLOAD_STUDENTS,
    PERMISSIONS.UPLOAD_RESULTS,
    PERMISSIONS.EDIT_RESULTS,
    PERMISSIONS.VIEW_RESULTS,
    PERMISSIONS.PROPOSE_DEGREES,
    PERMISSIONS.VIEW_CREDENTIALS,
    PERMISSIONS.CREATE_CORRECTIONS,
    PERMISSIONS.VIEW_CURRICULUM,
    PERMISSIONS.MANAGE_CURRICULUM,
  ],
  
  STUDENT: [
    PERMISSIONS.VIEW_RESULTS,
    PERMISSIONS.VIEW_CREDENTIALS,
    PERMISSIONS.CREATE_CORRECTIONS,
  ],
  
  VERIFIER: [
    PERMISSIONS.VIEW_CREDENTIALS,
  ],
}

/**
 * Check if role has permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false
}

/**
 * Check if role has any of the permissions
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission))
}

/**
 * Check if role has all permissions
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((permission) => hasPermission(role, permission))
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return rolePermissions[role] || []
}

/**
 * Check if role can access admin panel
 */
export function canAccessAdmin(role: UserRole): boolean {
  return role === USER_ROLES.ADMIN || role === USER_ROLES.ACADEMIC
}

/**
 * Check if role can access student portal
 */
export function canAccessStudent(role: UserRole): boolean {
  return role === USER_ROLES.STUDENT
}

/**
 * Get default redirect path for role
 */
export function getDefaultPath(role: UserRole): string {
  switch (role) {
    case USER_ROLES.ADMIN:
    case USER_ROLES.ACADEMIC:
      return "/admin"
    case USER_ROLES.STUDENT:
      return "/student"
    case USER_ROLES.VERIFIER:
      return "/verify"
    default:
      return "/"
  }
}
