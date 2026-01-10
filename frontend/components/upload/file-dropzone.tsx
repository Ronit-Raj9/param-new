"use client"

import * as React from "react"
import { useDropzone } from "react-dropzone"
import { Upload, FileText, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface FileDropzoneProps {
  onFileSelect: (file: File) => void
  accept?: Record<string, string[]>
  maxSize?: number
  disabled?: boolean
  file?: File | null
  onClear?: () => void
}

export function FileDropzone({
  onFileSelect,
  accept = { "text/csv": [".csv"] },
  maxSize = 10 * 1024 * 1024, // 10MB
  disabled = false,
  file,
  onClear,
}: FileDropzoneProps) {
  const [error, setError] = React.useState<string | null>(null)

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    maxSize,
    disabled,
    multiple: false,
    onDrop: (acceptedFiles: File[], rejectedFiles: any[]) => {
      setError(null)

      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0]
        if (rejection.errors[0]?.code === "file-too-large") {
          setError(`File is too large. Maximum size is ${maxSize / (1024 * 1024)}MB`)
        } else if (rejection.errors[0]?.code === "file-invalid-type") {
          setError("Invalid file type. Please upload a CSV file")
        } else {
          setError(rejection.errors[0]?.message || "File upload failed")
        }
        return
      }

      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0])
      }
    },
  })

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setError(null)
    onClear?.()
  }

  return (
    <div className="w-full">
      {file ? (
        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClear}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            isDragActive && "border-primary bg-primary/5",
            disabled && "opacity-50 cursor-not-allowed",
            error && "border-destructive",
            !error && !isDragActive && "border-border hover:border-primary/50"
          )}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          {isDragActive ? (
            <p className="text-primary font-medium">Drop the file here...</p>
          ) : (
            <div className="space-y-2">
              <p className="font-medium">
                Drag & drop a file here, or click to select
              </p>
              <p className="text-sm text-muted-foreground">
                CSV files only, max {maxSize / (1024 * 1024)}MB
              </p>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
