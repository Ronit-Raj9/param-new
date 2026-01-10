import { Suspense } from "react"
import { notFound } from "next/navigation"
import { Topbar } from "@/components/layout/topbar"
import { Footer } from "@/components/layout/footer"
import { VerificationResult } from "@/components/credentials/verification-result"
import { PageLoader } from "@/components/shared/loading-spinner"

interface VerifyPageProps {
  params: Promise<{ token: string }>
}

async function getVerificationData(token: string) {
  // In production, this would call the actual API
  // For demo, return mock data
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Simulate invalid token
  if (token === "invalid") {
    return { valid: false, error: "Invalid or expired verification token" }
  }

  return {
    valid: true,
    credential: {
      tokenId: token,
      type: "DEGREE" as const,
      studentName: "Rahul Sharma",
      enrollmentNumber: "2020BCS001",
      program: "B.Tech Computer Science & Engineering",
      batch: "2020-2024",
      issuedAt: "2024-06-15T10:00:00Z",
      issuer: "IIITM Gwalior",
      status: "VALID" as const,
      cgpa: 8.75,
      division: "First Class with Distinction",
      semesters: [
        { semester: 1, sgpa: 8.5, credits: 22, status: "PASSED" },
        { semester: 2, sgpa: 8.7, credits: 24, status: "PASSED" },
        { semester: 3, sgpa: 8.6, credits: 24, status: "PASSED" },
        { semester: 4, sgpa: 8.8, credits: 24, status: "PASSED" },
        { semester: 5, sgpa: 8.9, credits: 22, status: "PASSED" },
        { semester: 6, sgpa: 8.7, credits: 22, status: "PASSED" },
        { semester: 7, sgpa: 9.0, credits: 20, status: "PASSED" },
        { semester: 8, sgpa: 8.8, credits: 18, status: "PASSED" },
      ],
    },
    verificationDetails: {
      verifiedAt: new Date().toISOString(),
      expiresAt: undefined,
      signature: "sig_" + token.slice(0, 16),
    },
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
