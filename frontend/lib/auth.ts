/**
 * Authentication utilities
 */

import type { User } from "@/types"

/**
 * Store auth token (if needed for non-cookie auth)
 */
export function setAuthToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("auth_token", token)
  }
}

/**
 * Get auth token
 */
export function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("auth_token")
  }
  return null
}

/**
 * Remove auth token
 */
export function removeAuthToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_token")
  }
}

/**
 * Check if user is authenticated (client-side)
 */
export function isAuthenticated(): boolean {
  return !!getAuthToken()
}

/**
 * Get user role
 */
export function getUserRole(user: User | null): string | null {
  return user?.role || null
}

/**
 * Check if user has role
 */
export function hasRole(user: User | null, roles: string[]): boolean {
  const userRole = getUserRole(user)
  return userRole ? roles.includes(userRole) : false
}

/**
 * Format user display name
 */
export function getUserDisplayName(user: User | null): string {
  if (!user) return "Guest"
  return user.name || user.email.split("@")[0]
}

/**
 * Get user initials
 */
export function getUserInitials(user: User | null): string {
  if (!user || !user.name) return "??"
  
  const nameParts = user.name.split(" ")
  if (nameParts.length >= 2) {
    return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
  }
  
  return user.name.substring(0, 2).toUpperCase()
}

/**
 * Check if password is strong
 */
export function isStrongPassword(password: string): boolean {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
  const minLength = 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)

  return (
    password.length >= minLength &&
    hasUppercase &&
    hasLowercase &&
    hasNumber &&
    hasSpecialChar
  )
}

/**
 * Generate random password
 */
export function generateRandomPassword(length: number = 12): string {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  const lowercase = "abcdefghijklmnopqrstuvwxyz"
  const numbers = "0123456789"
  const special = "!@#$%^&*"
  const all = uppercase + lowercase + numbers + special

  let password = ""
  
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += special[Math.floor(Math.random() * special.length)]

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)]
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("")
}

/**
 * Mask email for display
 */
export function maskEmail(email: string): string {
  const [username, domain] = email.split("@")
  if (username.length <= 3) return email
  
  const visibleChars = 2
  const masked = username.substring(0, visibleChars) + "***" + username.slice(-1)
  return `${masked}@${domain}`
}

/**
 * Format session expiry
 */
export function formatSessionExpiry(expiresAt: string): string {
  const expiry = new Date(expiresAt)
  const now = new Date()
  const diffMs = expiry.getTime() - now.getTime()
  const diffMin = Math.floor(diffMs / (1000 * 60))

  if (diffMin < 1) return "Expired"
  if (diffMin < 60) return `${diffMin} minutes remaining`
  
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours} hours remaining`
  
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} days remaining`
}
