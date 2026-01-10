import type { Metadata } from "next"
import { Suspense } from "react"
import { ResultsList } from "@/components/results/results-list"
import { PageLoader } from "@/components/shared/loading-spinner"

export const metadata: Metadata = {
  title: "My Results",
}

export default function ResultsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Results</h1>
        <p className="text-muted-foreground">View and download your semester results</p>
      </div>
      <Suspense fallback={<PageLoader />}>
        <ResultsList />
      </Suspense>
    </div>
  )
}
