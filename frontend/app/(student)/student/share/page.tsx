import type { Metadata } from "next"
import { Suspense } from "react"
import { ShareManagement } from "@/components/credentials/share-management"
import { PageLoader } from "@/components/shared/loading-spinner"

export const metadata: Metadata = {
  title: "Share Credentials",
}

export default function SharePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Share Credentials</h1>
        <p className="text-muted-foreground">Manage verification links for your academic credentials</p>
      </div>
      <Suspense fallback={<PageLoader />}>
        <ShareManagement />
      </Suspense>
    </div>
  )
}
