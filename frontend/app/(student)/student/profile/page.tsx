import type { Metadata } from "next"
import { Suspense } from "react"
import { StudentProfile } from "@/components/profile/student-profile"
import { PageLoader } from "@/components/shared/loading-spinner"

export const metadata: Metadata = {
  title: "Profile",
}

export const dynamic = 'force-dynamic'

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">View and manage your profile information</p>
      </div>
      <Suspense fallback={<PageLoader />}>
        <StudentProfile />
      </Suspense>
    </div>
  )
}
