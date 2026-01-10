import type { Metadata } from "next"
import { Suspense } from "react"
import { StudentDashboard } from "@/components/dashboard/student-dashboard"
import { PageLoader } from "@/components/shared/loading-spinner"

export const metadata: Metadata = {
  title: "Dashboard",
}

export default function StudentDashboardPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <StudentDashboard />
    </Suspense>
  )
}
