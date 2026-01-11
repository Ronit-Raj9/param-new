"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { GradeBadge } from "@/components/results/grade-badge"
import { formatGPA, formatDate } from "@/lib/format"
import { Download, Share2, FileText } from "lucide-react"
import type { SemesterResult, SubjectResult } from "@/types"

interface ResultDetailModalProps {
  result: SemesterResult | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ResultDetailModal({ result, open, onOpenChange }: ResultDetailModalProps) {
  if (!result) return null

  const subjects: SubjectResult[] = result.subjects || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Semester {result.semester} Result</DialogTitle>
          <DialogDescription>Academic Year: {result.academicYear}</DialogDescription>
        </DialogHeader>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">SGPA</p>
            <p className="text-2xl font-bold text-primary">{formatGPA(result.sgpa)}</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">CGPA</p>
            <p className="text-2xl font-bold">{formatGPA(result.cgpa)}</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">Credits Earned</p>
            <p className="text-2xl font-bold">{result.earnedCredits}</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">Published</p>
            <p className="text-sm font-medium">{result.publishedAt ? formatDate(result.publishedAt) : "-"}</p>
          </div>
        </div>

        <Separator />

        {/* Subject-wise Marks */}
        <div>
          <h4 className="font-semibold mb-3">Subject-wise Performance</h4>
          {subjects.length > 0 ? (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead className="text-center">Credits</TableHead>
                    <TableHead className="text-center">Grade</TableHead>
                    <TableHead className="text-center">Points</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjects.map((subject) => (
                    <TableRow key={subject.id}>
                      <TableCell className="font-mono text-sm">{subject.courseCode}</TableCell>
                      <TableCell>{subject.courseName}</TableCell>
                      <TableCell className="text-center">{subject.credits}</TableCell>
                      <TableCell className="text-center">
                        <GradeBadge grade={subject.grade} />
                      </TableCell>
                      <TableCell className="text-center">{subject.gradePoints}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center border rounded-lg">
              <FileText className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Subject details not available</p>
            </div>
          )}
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button variant="outline" disabled={result.status === "DRAFT" || result.status === "WITHHELD"} className="bg-transparent">
            <Share2 className="mr-2 h-4 w-4" />
            Share Result
          </Button>
          <Button disabled={result.status === "DRAFT" || result.status === "WITHHELD"}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
