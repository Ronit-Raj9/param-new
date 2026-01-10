"use client"

import * as React from "react"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileUploadProgressProps {
  progress: number
  status: "uploading" | "processing" | "success" | "error"
  fileName: string
  errorMessage?: string
}

export function FileUploadProgress({
  progress,
  status,
  fileName,
  errorMessage,
}: FileUploadProgressProps) {
  return (
    <div className="space-y-3 p-4 border rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {status === "uploading" || status === "processing" ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : status === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-success" />
          ) : (
            <XCircle className="h-5 w-5 text-destructive" />
          )}
          <div>
            <p className="font-medium text-sm">{fileName}</p>
            <p className="text-xs text-muted-foreground">
              {status === "uploading" && "Uploading..."}
              {status === "processing" && "Processing file..."}
              {status === "success" && "Upload complete"}
              {status === "error" && "Upload failed"}
            </p>
          </div>
        </div>
        <span className="text-sm font-medium">{progress}%</span>
      </div>

      <Progress value={progress} className="h-2" />

      {errorMessage && (
        <p className="text-sm text-destructive">{errorMessage}</p>
      )}
    </div>
  )
}
