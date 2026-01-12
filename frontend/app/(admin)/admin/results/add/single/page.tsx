import type { Metadata } from "next"
import { Suspense } from "react"
import { SingleStudentResult } from "@/components/admin/single-student-result"
import { PageLoader } from "@/components/shared/loading-spinner"

export const metadata: Metadata = {
    title: "Add Result - Single Student",
}

export default function SingleStudentResultPage() {
    return (
        <Suspense fallback={<PageLoader />}>
            <SingleStudentResult />
        </Suspense>
    )
}
