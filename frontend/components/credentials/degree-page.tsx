"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ShareLinkManager } from "@/components/credentials/share-link-manager"
import { useApi } from "@/hooks/use-api"
import { formatDate, formatGPA } from "@/lib/format"
import { GraduationCap, Download, Share2, CheckCircle2, Clock, Loader2 } from "lucide-react"
import type { Credential, ShareLink } from "@/types"

export function DegreePage() {
  const api = useApi()
  const [degree, setDegree] = useState<Credential | null>(null)
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showShareManager, setShowShareManager] = useState(false)

  useEffect(() => {
    async function fetchDegree() {
      if (!api.isReady) return
      
      try {
        setIsLoading(true)
        const data = await api.get<{ success: boolean; data: { degree: Credential | null; shareLinks: ShareLink[] } }>(
          "/v1/credentials/degree"
        )

        if (data.success && data.data) {
          setDegree(data.data.degree || null)
          setShareLinks(data.data.shareLinks || [])
        }
      } catch (err) {
        console.error("Error fetching degree:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDegree()
  }, [api.isReady])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

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
              <p className="text-sm text-muted-foreground">Enrollment No.</p>
              <p className="font-medium font-mono">{degree.enrollmentNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Batch</p>
              <p className="font-medium">{degree.batch}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Issued On</p>
              <p className="font-medium">{degree.issuedAt ? formatDate(degree.issuedAt) : "-"}</p>
            </div>
          </div>

          {degree.metadata && (
            <>
              <Separator className="my-4" />
              <div className="grid gap-4 sm:grid-cols-3">
                {degree.metadata.cgpa && (
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Final CGPA</p>
                    <p className="text-2xl font-bold text-primary">{formatGPA(degree.metadata.cgpa)}</p>
                  </div>
                )}
                {degree.metadata.division && (
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Division</p>
                    <p className="text-lg font-semibold">{degree.metadata.division}</p>
                  </div>
                )}
                {degree.metadata.specialization && (
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Specialization</p>
                    <p className="text-lg font-semibold">{degree.metadata.specialization}</p>
                  </div>
                )}
              </div>
            </>
          )}

          <Separator className="my-4" />

          <div className="flex gap-3">
            <Button variant="outline" className="bg-transparent" onClick={() => setShowShareManager(!showShareManager)}>
              <Share2 className="mr-2 h-4 w-4" />
              {showShareManager ? "Hide Share Links" : "Manage Share Links"}
            </Button>
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Download Certificate
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Blockchain Verification */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Blockchain Verification</CardTitle>
          <CardDescription>This credential is securely stored on the blockchain</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Token ID</p>
              <p className="font-mono text-sm break-all">{degree.tokenId || "Not minted"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={degree.status === "VALID" ? "default" : "secondary"}>{degree.status}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Share Links */}
      {showShareManager && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Share Links</CardTitle>
            <CardDescription>Manage verification links for this credential</CardDescription>
          </CardHeader>
          <CardContent>
            <ShareLinkManager links={shareLinks} credentialId={degree.id} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
