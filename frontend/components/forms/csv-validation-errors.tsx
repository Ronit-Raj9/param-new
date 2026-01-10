"use client"

import * as React from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { AlertCircle } from "lucide-react"

interface CsvError {
  row: number
  field?: string
  message: string
  data?: Record<string, unknown>
}

interface CsvValidationErrorsProps {
  errors: CsvError[]
  maxDisplay?: number
}

export function CsvValidationErrors({
  errors,
  maxDisplay = 20,
}: CsvValidationErrorsProps) {
  if (errors.length === 0) {
    return null
  }

  const displayedErrors = errors.slice(0, maxDisplay)
  const hasMore = errors.length > maxDisplay

  // Group errors by row
  const errorsByRow = displayedErrors.reduce((acc, error) => {
    const rowNum = error.row
    if (!acc[rowNum]) {
      acc[rowNum] = []
    }
    acc[rowNum].push(error)
    return acc
  }, {} as Record<number, CsvError[]>)

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Validation Errors ({errors.length})</AlertTitle>
      <AlertDescription>
        <ScrollArea className="h-[300px] mt-2">
          <div className="space-y-3">
            {Object.entries(errorsByRow).map(([rowNum, rowErrors]) => (
              <div key={rowNum} className="space-y-1 p-3 bg-background rounded-md">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">
                    Row {rowNum}
                  </Badge>
                  {rowErrors.length > 1 && (
                    <span className="text-xs text-muted-foreground">
                      ({rowErrors.length} errors)
                    </span>
                  )}
                </div>
                <ul className="space-y-1 mt-2">
                  {rowErrors.map((error, idx) => (
                    <li key={idx} className="text-sm">
                      {error.field && (
                        <span className="font-medium">{error.field}: </span>
                      )}
                      {error.message}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {hasMore && (
              <div className="text-sm text-muted-foreground text-center p-2">
                ... and {errors.length - maxDisplay} more errors
              </div>
            )}
          </div>
        </ScrollArea>
      </AlertDescription>
    </Alert>
  )
}
