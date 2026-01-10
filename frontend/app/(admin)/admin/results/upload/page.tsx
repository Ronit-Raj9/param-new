import type { Metadata } from "next"
import { CsvUploadPage } from "@/components/admin/csv-upload-page"

export const metadata: Metadata = {
  title: "Upload Results",
}

export default function UploadResultsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Upload Results</h1>
        <p className="text-muted-foreground">Bulk import semester results via CSV file</p>
      </div>
      <CsvUploadPage type="results" />
    </div>
  )
}
