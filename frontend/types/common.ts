import type React from "react"

// Removed PaginatedResponse and ApiError - they're in api.ts

export interface SelectOption {
  value: string
  label: string
}

export interface DateRange {
  from: Date
  to: Date
}

export type SortDirection = "asc" | "desc"

export interface SortConfig {
  field: string
  direction: SortDirection
}

export interface TableColumn<T> {
  key: keyof T | string
  header: string
  sortable?: boolean
  className?: string
  render?: (value: unknown, row: T) => React.ReactNode
}
