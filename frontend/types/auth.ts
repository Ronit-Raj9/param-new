export type UserRole = "STUDENT" | "ACADEMIC" | "ADMIN"

export interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: () => void
  logout: () => void
  refetch: () => void
}

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  profilePicture?: string
  enrollmentNumber?: string
  isActive: boolean
  createdAt: string
}

export interface LoginCredentials {
  email: string
  otp?: string
}

export interface AuthResponse {
  user: User
  token: string
}
