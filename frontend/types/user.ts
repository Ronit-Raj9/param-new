import type { UserRole } from "./auth"

export interface UserProfile {
  id: string
  name: string
  email: string
  role: UserRole
  profilePicture?: string
  phone?: string
  address?: string
  isActive: boolean
  lastLogin?: string
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
  isActive?: boolean
}
