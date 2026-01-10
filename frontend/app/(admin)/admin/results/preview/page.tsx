import type { Metadata } from "next"
import { Suspense } from "react"
import { ResultsPreview } from "@/components/admin/results-preview"
import { PageLoader } from "@/components/shared/loading-spinner"

export const metadata: Metadata = {
  title: "Results Preview",
}

export default function ResultsPreviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Results Preview</h1>
        <p className="text-muted-foreground">Review and edit results before submission for approval</p>
      </div>
      <Suspense fallback={<PageLoader />}>
        <ResultsPreview />
      </Suspense>
    </div>
  )
}
