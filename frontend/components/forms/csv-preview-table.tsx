"use client"

import * as React from "react"
import { DataTable } from "@/components/data-table/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertCircle } from "lucide-react"

interface CsvPreviewTableProps {
  data: Record<string, unknown>[]
  errors?: Array<{ row: number; field?: string; message: string }>
  maxRows?: number
}

export function CsvPreviewTable({
  data,
  errors = [],
  maxRows = 50,
}: CsvPreviewTableProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border rounded-lg">
        <p className="text-muted-foreground">No data to preview</p>
      </div>
    )
  }

  // Generate columns from first row
  const columns: ColumnDef<Record<string, unknown>>[] = Object.keys(data[0]).map((key) => ({
    accessorKey: key,
    header: key,
    cell: ({ row, column }: { row: any; column: any }) => {
      const rowIndex = row.index + 1
      const hasError = errors.some(
        (err) => err.row === rowIndex && (!err.field || err.field === column.id)
      )

      return (
        <div className={hasError ? "text-destructive" : ""}>
          {String(row.getValue(column.id))}
        </div>
      )
    },
  }))

  const displayData = data.slice(0, maxRows)

  return (
    <div className="space-y-4">
      {/* Error Summary */}
      {errors.length > 0 && (
        <div className="flex items-start gap-2 p-4 border border-destructive/50 bg-destructive/10 rounded-lg">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
          <div>
            <p className="font-medium text-destructive">
              {errors.length} validation error{errors.length > 1 ? "s" : ""} found
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Errors are highlighted in red in the table below
            </p>
          </div>
        </div>
      )}

      {/* Data Stats */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>Total rows: {data.length}</span>
        <span>Showing: {Math.min(maxRows, data.length)}</span>
        {data.length > maxRows && (
          <Badge variant="secondary">
            +{data.length - maxRows} more rows
          </Badge>
        )}
      </div>

      {/* Table */}
      <ScrollArea className="h-[400px] rounded-md border">
        <DataTable
          columns={columns}
          data={displayData}
          emptyMessage="No data to display"
        />
      </ScrollArea>
    </div>
  )
}
