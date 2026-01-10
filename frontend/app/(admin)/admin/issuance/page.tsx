import type { Metadata } from "next"
import { Suspense } from "react"
import { CredentialIssuance } from "@/components/admin/credential-issuance"
import { PageLoader } from "@/components/shared/loading-spinner"

export const metadata: Metadata = {
  title: "Issue Credentials",
}

export default function IssuancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Credential Issuance</h1>
        <p className="text-muted-foreground">Issue semester results and degree credentials</p>
      </div>
      <Suspense fallback={<PageLoader />}>
        <CredentialIssuance />
      </Suspense>
    </div>
  )
}
