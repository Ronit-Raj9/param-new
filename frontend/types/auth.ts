export type UserRole = "STUDENT" | "ACADEMIC" | "ADMIN" | "VERIFIER"

export type UserStatus = "PENDING_ACTIVATION" | "ACTIVE" | "SUSPENDED" | "DEACTIVATED"

export interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: () => void
  logout: () => void | Promise<void>
  refetch: () => void
}

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  profilePicture?: string
  avatarUrl?: string
  phone?: string
  enrollmentNumber?: string
  activatedAt?: string
  lastLoginAt?: string
  createdAt: string
  updatedAt?: string
}

export interface LoginCredentials {
  email: string
  otp?: string
}

export interface AuthResponse {
  user: User
  token: string
}
