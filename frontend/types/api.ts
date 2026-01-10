// Standardized API response types

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  timestamp: string
}

export interface ApiError {
  success: false
  error: {
    message: string
    code?: string
    details?: Record<string, string[]>
  }
  timestamp: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

export interface ApiListResponse<T> extends ApiResponse<PaginatedResponse<T>> {}

// API Request types
export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

export interface SearchParams extends PaginationParams {
  search?: string
  filters?: Record<string, unknown>
}
