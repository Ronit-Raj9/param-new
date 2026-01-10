import type { Metadata } from "next"
import { CsvUploadPage } from "@/components/admin/csv-upload-page"

export const metadata: Metadata = {
  title: "Upload Students",
}

export default function UploadStudentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Upload Students</h1>
        <p className="text-muted-foreground">Bulk import student records via CSV file</p>
      </div>
      <CsvUploadPage type="students" />
    </div>
  )
}
