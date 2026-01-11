import { Suspense } from "react"
import { notFound } from "next/navigation"
import { Topbar } from "@/components/layout/topbar"
import { Footer } from "@/components/layout/footer"
import { VerificationResult } from "@/components/credentials/verification-result"
import { PageLoader } from "@/components/shared/loading-spinner"

interface VerifyPageProps {
  params: Promise<{ token: string }>
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"

async function getVerificationData(token: string) {
  try {
    const response = await fetch(`${API_URL}/v1/credentials/share/${token}`, {
      cache: "no-store",
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return { 
        valid: false, 
        error: errorData.error?.message || "Invalid or expired verification token" 
      }
    }

    const data = await response.json()
    
    if (!data.success || !data.data) {
      return { valid: false, error: "Invalid share link" }
    }

    const shareLink = data.data
    const credential = shareLink.credential
    const student = credential.student

    // Format credential data for verification result component
    return {
      valid: true,
      credential: {
        tokenId: credential.tokenId || shareLink.token,
        type: credential.type as "SEMESTER" | "DEGREE",
        studentName: student.user?.name || student.name,
        enrollmentNumber: student.enrollmentNumber,
        program: student.program?.name || "Unknown Program",
        batch: student.batch,
        issuedAt: credential.issuedAt,
        issuer: "ABV-IIITM Gwalior",
        status: credential.status === "ISSUED" ? "VALID" : credential.status,
        cgpa: credential.metadata?.cgpa || student.cgpa,
        sgpa: credential.metadata?.sgpa,
        semester: credential.metadata?.semester,
        division: credential.metadata?.cgpa >= 7.5 
          ? "First Class with Distinction" 
          : credential.metadata?.cgpa >= 6.0 
            ? "First Class" 
            : "Pass",
        txHash: credential.txHash,
        contractAddress: credential.contractAddress,
      },
      verificationDetails: {
        verifiedAt: new Date().toISOString(),
        expiresAt: shareLink.expiresAt,
        viewCount: shareLink.viewCount,
        signature: `sig_${shareLink.token.slice(0, 16)}`,
      },
    }
  } catch (error) {
    console.error("Verification error:", error)
    return { 
      valid: false, 
      error: "Failed to verify credential. Please try again later." 
    }
  }
}

export default async function VerifyPage({ params }: VerifyPageProps) {
  const { token } = await params
  const decodedToken = decodeURIComponent(token)

  if (!decodedToken) {
    notFound()
  }

  const data = await getVerificationData(decodedToken)

  return (
    <div className="flex min-h-screen flex-col">
      <Topbar showNav={false} />
      <main className="flex-1 py-8 md:py-12">
        <Suspense fallback={<PageLoader />}>
          <VerificationResult data={data} />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}

export async function generateMetadata({ params }: VerifyPageProps) {
  const { token } = await params
  return {
    title: "Verify Credential",
    description: `Verify academic credential with token: ${token.slice(0, 8)}...`,
  }
}
