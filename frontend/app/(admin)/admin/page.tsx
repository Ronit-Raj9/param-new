import type { Metadata } from "next"
import { Suspense } from "react"
import { AdminDashboard } from "@/components/dashboard/admin-dashboard"
import { PageLoader } from "@/components/shared/loading-spinner"

export const metadata: Metadata = {
  title: "Dashboard",
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AdminDashboard />
    </Suspense>
  )
}
