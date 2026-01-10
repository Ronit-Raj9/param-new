"use client"

import * as React from "react"
import { Document, Page, pdfjs } from "react-pdf"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import "react-pdf/dist/esm/Page/AnnotationLayer.css"
import "react-pdf/dist/esm/Page/TextLayer.css"

// Configure PDF.js worker
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`
}

interface PdfPreviewModalProps {
  open: boolean
  onClose: () => void
  pdfUrl: string
  title?: string
  downloadFilename?: string
}

export function PdfPreviewModal({
  open,
  onClose,
  pdfUrl,
  title = "PDF Preview",
  downloadFilename = "document.pdf",
}: PdfPreviewModalProps) {
  const [numPages, setNumPages] = React.useState<number>(0)
  const [pageNumber, setPageNumber] = React.useState<number>(1)
  const [scale, setScale] = React.useState<number>(1.0)
  const [loading, setLoading] = React.useState<boolean>(true)
  const [error, setError] = React.useState<string | null>(null)

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setLoading(false)
    setError(null)
  }

  const onDocumentLoadError = (error: Error) => {
    console.error("PDF load error:", error)
    setError("Failed to load PDF. Please try again.")
    setLoading(false)
  }

  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(1, prev - 1))
  }

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(numPages, prev + 1))
  }

  const zoomIn = () => {
    setScale((prev) => Math.min(2.0, prev + 0.2))
  }

  const zoomOut = () => {
    setScale((prev) => Math.max(0.5, prev - 0.2))
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(pdfUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = downloadFilename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Download error:", error)
    }
  }

  // Reset state when modal closes
  React.useEffect(() => {
    if (!open) {
      setPageNumber(1)
      setScale(1.0)
      setLoading(true)
      setError(null)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {/* Controls */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevPage}
              disabled={pageNumber <= 1 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {pageNumber} of {numPages || "?"}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={pageNumber >= numPages || loading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={zoomOut} disabled={loading}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              {Math.round(scale * 100)}%
            </span>
            <Button variant="outline" size="sm" onClick={zoomIn} disabled={loading}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          <Button variant="default" size="sm" onClick={handleDownload} disabled={loading}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4 rounded-md">
          {error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-red-600 font-medium">{error}</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="flex items-center justify-center h-96">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                }
                className="shadow-lg"
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  loading={
                    <div className="flex items-center justify-center h-96">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  }
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                />
              </Document>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
