"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

interface TemplateDownloadButtonProps {
  templateUrl: string
  fileName: string
  label?: string
}

export function TemplateDownloadButton({
  templateUrl,
  fileName,
  label = "Download Template",
}: TemplateDownloadButtonProps) {
  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = templateUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Button variant="outline" size="sm" onClick={handleDownload}>
      <Download className="mr-2 h-4 w-4" />
      {label}
    </Button>
  )
}
