"use client"

import * as React from "react"

interface UsePaginationProps {
  totalItems: number
  itemsPerPage?: number
  initialPage?: number
}

interface UsePaginationReturn {
  currentPage: number
  totalPages: number
  itemsPerPage: number
  startIndex: number
  endIndex: number
  goToPage: (page: number) => void
  nextPage: () => void
  previousPage: () => void
  canGoNext: boolean
  canGoPrevious: boolean
  reset: () => void
}

/**
 * Hook for pagination logic
 * 
 * @example
 * ```tsx
 * const pagination = usePagination({ totalItems: 100, itemsPerPage: 10 })
 * 
 * const visibleItems = items.slice(pagination.startIndex, pagination.endIndex)
 * 
 * <Pagination
 *   currentPage={pagination.currentPage}
 *   totalPages={pagination.totalPages}
 *   onPageChange={pagination.goToPage}
 * />
 * ```
 */
export function usePagination({
  totalItems,
  itemsPerPage = 10,
  initialPage = 1,
}: UsePaginationProps): UsePaginationReturn {
  const [currentPage, setCurrentPage] = React.useState(initialPage)

  const totalPages = React.useMemo(() => {
    return Math.ceil(totalItems / itemsPerPage)
  }, [totalItems, itemsPerPage])

  const startIndex = React.useMemo(() => {
    return (currentPage - 1) * itemsPerPage
  }, [currentPage, itemsPerPage])

  const endIndex = React.useMemo(() => {
    return Math.min(startIndex + itemsPerPage, totalItems)
  }, [startIndex, itemsPerPage, totalItems])

  const canGoNext = React.useMemo(() => {
    return currentPage < totalPages
  }, [currentPage, totalPages])

  const canGoPrevious = React.useMemo(() => {
    return currentPage > 1
  }, [currentPage])

  const goToPage = React.useCallback(
    (page: number) => {
      const validPage = Math.max(1, Math.min(page, totalPages))
      setCurrentPage(validPage)
    },
    [totalPages]
  )

  const nextPage = React.useCallback(() => {
    if (canGoNext) {
      setCurrentPage((prev) => prev + 1)
    }
  }, [canGoNext])

  const previousPage = React.useCallback(() => {
    if (canGoPrevious) {
      setCurrentPage((prev) => prev - 1)
    }
  }, [canGoPrevious])

  const reset = React.useCallback(() => {
    setCurrentPage(initialPage)
  }, [initialPage])

  // Reset to page 1 when total items change
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1)
    }
  }, [totalPages, currentPage])

  return {
    currentPage,
    totalPages,
    itemsPerPage,
    startIndex,
    endIndex,
    goToPage,
    nextPage,
    previousPage,
    canGoNext,
    canGoPrevious,
    reset,
  }
}
