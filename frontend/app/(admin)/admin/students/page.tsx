import type { Metadata } from "next"
import { Suspense } from "react"
import { StudentsRegistry } from "@/components/admin/students-registry"
import { PageLoader } from "@/components/shared/loading-spinner"

export const metadata: Metadata = {
  title: "Student Registry",
}

export default function StudentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Student Registry</h1>
        <p className="text-muted-foreground">Browse and manage student records</p>
      </div>
      <Suspense fallback={<PageLoader />}>
        <StudentsRegistry />
      </Suspense>
    </div>
  )
}
