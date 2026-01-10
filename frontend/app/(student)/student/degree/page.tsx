import type { Metadata } from "next"
import { DegreePageWrapper } from "@/components/credentials/degree-page-wrapper"

export const metadata: Metadata = {
  title: "Degree",
}

export const dynamic = 'force-dynamic'

export default function DegreeCredentialPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Degree Certificate</h1>
        <p className="text-muted-foreground">View, download, and share your degree certificate</p>
      </div>
      <DegreePageWrapper />
    </div>
  )
}
