import type { UserRole, UserStatus } from "./auth"

export interface UserProfile {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  profilePicture?: string
  avatarUrl?: string
  phone?: string
  address?: string
  activatedAt?: string
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
}

export interface CreateUserInput {
  email: string
  name: string
  role: UserRole
  sendActivationEmail?: boolean
}

export interface UpdateUserInput {
  name?: string
  phone?: string
  address?: string
  status?: UserStatus
}
