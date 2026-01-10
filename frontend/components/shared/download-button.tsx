"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

interface DownloadButtonProps {
  url: string
  filename: string
  label?: string
  className?: string
}

export function DownloadButton({
  url,
  filename,
  label = "Download",
  className,
}: DownloadButtonProps) {
  const handleDownload = async () => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error("Download failed:", error)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      className={className}
    >
      <Download className="mr-2 h-4 w-4" />
      {label}
    </Button>
  )
}
