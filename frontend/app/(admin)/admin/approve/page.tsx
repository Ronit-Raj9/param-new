import type { Metadata } from "next"
import { Suspense } from "react"
import { ApprovalsQueue } from "@/components/admin/approvals-queue"
import { PageLoader } from "@/components/shared/loading-spinner"

export const metadata: Metadata = {
  title: "Approvals",
}

export const dynamic = 'force-dynamic'

export default function ApprovalsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Approval Queue</h1>
        <p className="text-muted-foreground">Review and approve pending results and credentials</p>
      </div>
      <Suspense fallback={<PageLoader />}>
        <ApprovalsQueue />
      </Suspense>
    </div>
  )
}
