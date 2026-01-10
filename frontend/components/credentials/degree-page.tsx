"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ShareLinkManager } from "@/components/credentials/share-link-manager"
import { formatDate, formatGPA } from "@/lib/format"
import { GraduationCap, Download, Share2, CheckCircle2, Clock } from "lucide-react"
import type { Credential, ShareLink } from "@/types"

// Mock data
const mockDegree: Credential | null = {
  id: "deg-1",
  tokenId: "0x123abc456def",
  type: "DEGREE",
  studentId: "1",
  studentName: "Rahul Sharma",
  enrollmentNumber: "2020BCS001",
  program: "B.Tech Computer Science & Engineering",
  batch: "2020-2024",
  status: "VALID",
  issuedAt: "2024-06-30T10:00:00Z",
  issuer: "IIITM Gwalior",
  metadata: {
    cgpa: 8.75,
    division: "First Class with Distinction",
    specialization: "Artificial Intelligence",
  },
}

const mockShareLinks: ShareLink[] = [
  {
    id: "1",
    credentialId: "deg-1",
    token: "abc123",
    url: "https://param.iiitm.ac.in/verify/abc123",
    expiresAt: "2025-01-01T00:00:00Z",
    viewCount: 12,
    isActive: true,
    createdAt: "2024-07-01T10:00:00Z",
  },
  {
    id: "2",
    credentialId: "deg-1",
    token: "def456",
    url: "https://param.iiitm.ac.in/verify/def456",
    viewCount: 5,
    isActive: true,
    createdAt: "2024-07-15T10:00:00Z",
  },
]

export function DegreePage() {
  const [showShareManager, setShowShareManager] = useState(false)
  const degree = mockDegree

  if (!degree) {
    return (
      <Card>
        <CardContent className="pt-12 pb-8 text-center">
          <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-muted flex items-center justify-center">
            <Clock className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Degree Not Yet Issued</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Your degree certificate will be available after your final semester results are published and approved by
            the examination committee.
          </p>
          <div className="mt-6 p-4 rounded-lg bg-muted/50 max-w-xs mx-auto">
            <p className="text-sm text-muted-foreground">Expected Availability</p>
            <p className="font-semibold">June 2024</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Degree Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground">
          <div className="flex items-start justify-between">
            <div>
              <Badge variant="secondary" className="mb-4">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Verified Credential
              </Badge>
              <h2 className="text-2xl font-bold">{degree.program}</h2>
              <p className="mt-1 opacity-90">{degree.issuer}</p>
            </div>
            <div className="h-16 w-16 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <GraduationCap className="h-8 w-8" />
            </div>
          </div>
        </div>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Student Name</p>
              <p className="font-medium">{degree.studentName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Enrollment Number</p>
              <p className="font-medium font-mono">{degree.enrollmentNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Batch</p>
              <p className="font-medium">{degree.batch}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Issue Date</p>
              <p className="font-medium">{formatDate(degree.issuedAt)}</p>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Final CGPA</p>
              <p className="text-3xl font-bold text-primary">{formatGPA(degree.metadata?.cgpa)}</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Division</p>
              <p className="font-semibold">{degree.metadata?.division}</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Specialization</p>
              <p className="font-semibold">{degree.metadata?.specialization || "N/A"}</p>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="flex flex-wrap gap-3">
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Download Degree
            </Button>
            <Button variant="outline" className="bg-transparent">
              <Download className="mr-2 h-4 w-4" />
              Download Transcript
            </Button>
            <Button variant="outline" onClick={() => setShowShareManager(!showShareManager)} className="bg-transparent">
              <Share2 className="mr-2 h-4 w-4" />
              {showShareManager ? "Hide Share Links" : "Manage Share Links"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Share Links Manager */}
      {showShareManager && (
        <Card>
          <CardHeader>
            <CardTitle>Share Links</CardTitle>
            <CardDescription>Manage verification links for your degree certificate</CardDescription>
          </CardHeader>
          <CardContent>
            <ShareLinkManager links={mockShareLinks} credentialId={degree.id} />
          </CardContent>
        </Card>
      )}

      {/* Credential Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Credential Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Credential ID</span>
              <span className="font-mono">{degree.tokenId}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Credential Type</span>
              <span>{degree.type}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Status</span>
              <Badge variant="default" className="bg-success">
                {degree.status}
              </Badge>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Issued By</span>
              <span>{degree.issuer}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
