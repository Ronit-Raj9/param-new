import type { Metadata } from "next"
import { Suspense } from "react"
import { BatchResultEntry } from "@/components/admin/batch-result-entry"
import { PageLoader } from "@/components/shared/loading-spinner"

export const metadata: Metadata = {
    title: "Batch Result Entry",
}

export default function BatchResultEntryPage() {
    return (
        <Suspense fallback={<PageLoader />}>
            <BatchResultEntry />
        </Suspense>
    )
}
