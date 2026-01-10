"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, XCircle, Download, Copy, Printer, Shield } from "lucide-react"
import { formatDate, formatGPA } from "@/lib/format"
import { siteConfig } from "@/config/site"
import { useToast } from "@/hooks/use-toast"
import type { VerificationResult as VerificationResultType } from "@/types"

interface VerificationResultProps {
  data: VerificationResultType
}

export function VerificationResult({ data }: VerificationResultProps) {
  const { toast } = useToast()

  const handleCopy = async () => {
    await navigator.clipboard.writeText(window.location.href)
    toast({
      title: "Link copied",
      description: "Verification link has been copied to clipboard",
    })
  }

  const handlePrint = () => {
    window.print()
  }

  if (!data.valid) {
    return (
      <div className="container max-w-2xl">
        <Card className="border-destructive/50">
          <CardContent className="pt-12 pb-8 text-center">
            <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-destructive mb-2">Verification Failed</h1>
            <p className="text-muted-foreground">{data.error || "This credential could not be verified."}</p>
            <p className="mt-4 text-sm text-muted-foreground">
              The token may be invalid, expired, or the credential has been revoked.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { credential, verificationDetails } = data

  return (
    <div className="container max-w-4xl">
      {/* Verification Badge */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-3 rounded-full border-2 border-success bg-success/5 px-6 py-3">
          <CheckCircle2 className="h-6 w-6 text-success" />
          <span className="font-semibold text-success">Verified Credential</span>
        </div>
      </div>

      {/* Main Card */}
      <Card className="mb-6 print:shadow-none">
        <CardHeader className="text-center border-b">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-primary">Issued by {credential?.issuer}</span>
          </div>
          <CardTitle className="text-2xl">{credential?.studentName}</CardTitle>
          <CardDescription className="text-base">
            {credential?.program} | Batch {credential?.batch}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Student Details */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Enrollment Number</p>
              <p className="font-medium">{credential?.enrollmentNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Credential Type</p>
              <Badge variant="secondary">{credential?.type}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Issue Date</p>
              <p className="font-medium">{credential?.issuedAt ? formatDate(credential.issuedAt) : "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={credential?.status === "VALID" ? "default" : "destructive"} className="bg-success">
                {credential?.status}
              </Badge>
            </div>
          </div>

          {/* Academic Details */}
          {credential?.cgpa && (
            <>
              <Separator className="my-6" />
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">CGPA</p>
                  <p className="text-3xl font-bold text-primary">{formatGPA(credential.cgpa)}</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Division</p>
                  <p className="font-semibold">{credential.division}</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Total Semesters</p>
                  <p className="text-3xl font-bold">{credential.semesters?.length || 0}</p>
                </div>
              </div>
            </>
          )}

          {/* Semester Breakdown */}
          {credential?.semesters && credential.semesters.length > 0 && (
            <>
              <Separator className="my-6" />
              <h3 className="font-semibold mb-4">Semester-wise Performance</h3>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Semester</TableHead>
                      <TableHead className="text-center">SGPA</TableHead>
                      <TableHead className="text-center">Credits</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {credential.semesters.map((sem) => (
                      <TableRow key={sem.semester}>
                        <TableCell className="font-medium">Semester {sem.semester}</TableCell>
                        <TableCell className="text-center">{formatGPA(sem.sgpa)}</TableCell>
                        <TableCell className="text-center">{sem.credits}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="text-success border-success">
                            {sem.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          {/* Verification Metadata */}
          <Separator className="my-6" />
          <div className="rounded-lg bg-muted/50 p-4">
            <h3 className="font-semibold mb-3 text-sm">Verification Details</h3>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Verified At</span>
                <span className="font-mono">
                  {verificationDetails?.verifiedAt ? formatDate(verificationDetails.verifiedAt, "PPpp") : "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Credential ID</span>
                <span className="font-mono text-xs">{credential?.tokenId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Signature</span>
                <span className="font-mono text-xs">{verificationDetails?.signature}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap justify-center gap-3 no-print">
        <Button variant="outline" onClick={handleCopy}>
          <Copy className="mr-2 h-4 w-4" />
          Copy Link
        </Button>
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Download Receipt
        </Button>
      </div>

      {/* Institution Notice */}
      <p className="mt-8 text-center text-xs text-muted-foreground">
        This credential was issued by {siteConfig.institution.fullName}.<br />
        For queries, contact {siteConfig.supportEmail}
      </p>
    </div>
  )
}
