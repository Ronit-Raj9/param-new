import type { Metadata } from "next"
import { Suspense } from "react"
import { UsersManagement } from "@/components/admin/users-management"
import { PageLoader } from "@/components/shared/loading-spinner"

export const metadata: Metadata = {
  title: "User Management",
}

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">Create and manage user accounts and roles</p>
      </div>
      <Suspense fallback={<PageLoader />}>
        <UsersManagement />
      </Suspense>
    </div>
  )
}
