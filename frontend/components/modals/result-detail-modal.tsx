"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { GradeBadge } from "@/components/results/grade-badge"
import { formatGPA, formatDate } from "@/lib/format"
import { Download, Share2 } from "lucide-react"
import type { SemesterResult } from "@/types"

interface ResultDetailModalProps {
  result: SemesterResult | null
  onClose: () => void
}

// Mock subject data
const mockSubjects = [
  { id: "1", courseCode: "CS401", courseName: "Machine Learning", credits: 4, grade: "A+", gradePoints: 10 },
  { id: "2", courseCode: "CS402", courseName: "Computer Networks", credits: 4, grade: "A", gradePoints: 9 },
  { id: "3", courseCode: "CS403", courseName: "Database Systems", credits: 4, grade: "A+", gradePoints: 10 },
  { id: "4", courseCode: "CS404", courseName: "Software Engineering", credits: 3, grade: "B+", gradePoints: 8 },
  { id: "5", courseCode: "HS401", courseName: "Technical Writing", credits: 2, grade: "A", gradePoints: 9 },
  { id: "6", courseCode: "CS491", courseName: "Project Work", credits: 3, grade: "A+", gradePoints: 10 },
]

export function ResultDetailModal({ result, onClose }: ResultDetailModalProps) {
  if (!result) return null

  return (
    <Dialog open={!!result} onOpenChange={() => onClose()}>
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
                {mockSubjects.map((subject) => (
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
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button variant="outline" disabled={result.status !== "PUBLISHED"} className="bg-transparent">
            <Share2 className="mr-2 h-4 w-4" />
            Share Result
          </Button>
          <Button disabled={result.status !== "PUBLISHED"}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
