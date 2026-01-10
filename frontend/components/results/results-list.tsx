"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/status/status-badge"
import { ResultDetailModal } from "@/components/modals/result-detail-modal"
import { formatGPA } from "@/lib/format"
import { Download, Share2, Eye } from "lucide-react"
import type { SemesterResult } from "@/types"

// Mock data
const mockResults: SemesterResult[] = [
  {
    id: "sem-8",
    studentId: "1",
    semester: 8,
    academicYear: "2023-24",
    sgpa: 8.8,
    cgpa: 8.75,
    totalCredits: 18,
    earnedCredits: 18,
    status: "PUBLISHED",
    subjects: [],
    publishedAt: "2024-06-15T10:00:00Z",
    createdAt: "2024-05-01T10:00:00Z",
    updatedAt: "2024-06-15T10:00:00Z",
  },
  {
    id: "sem-7",
    studentId: "1",
    semester: 7,
    academicYear: "2023-24",
    sgpa: 9.0,
    cgpa: 8.72,
    totalCredits: 20,
    earnedCredits: 20,
    status: "PUBLISHED",
    subjects: [],
    publishedAt: "2024-01-15T10:00:00Z",
    createdAt: "2023-12-01T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "sem-6",
    studentId: "1",
    semester: 6,
    academicYear: "2022-23",
    sgpa: 8.7,
    cgpa: 8.65,
    totalCredits: 22,
    earnedCredits: 22,
    status: "PUBLISHED",
    subjects: [],
    publishedAt: "2023-06-15T10:00:00Z",
    createdAt: "2023-05-01T10:00:00Z",
    updatedAt: "2023-06-15T10:00:00Z",
  },
  {
    id: "sem-5",
    studentId: "1",
    semester: 5,
    academicYear: "2022-23",
    sgpa: 8.9,
    cgpa: 8.6,
    totalCredits: 22,
    earnedCredits: 22,
    status: "PUBLISHED",
    subjects: [],
    publishedAt: "2023-01-15T10:00:00Z",
    createdAt: "2022-12-01T10:00:00Z",
    updatedAt: "2023-01-15T10:00:00Z",
  },
  {
    id: "sem-4",
    studentId: "1",
    semester: 4,
    academicYear: "2021-22",
    sgpa: 8.8,
    cgpa: 8.55,
    totalCredits: 24,
    earnedCredits: 24,
    status: "PUBLISHED",
    subjects: [],
    publishedAt: "2022-06-15T10:00:00Z",
    createdAt: "2022-05-01T10:00:00Z",
    updatedAt: "2022-06-15T10:00:00Z",
  },
]

export function ResultsList() {
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortOrder, setSortOrder] = useState<string>("desc")
  const [selectedResult, setSelectedResult] = useState<SemesterResult | null>(null)

  const filteredResults = mockResults
    .filter((result) => statusFilter === "all" || result.status === statusFilter)
    .sort((a, b) => {
      const order = sortOrder === "desc" ? -1 : 1
      return (a.semester - b.semester) * order
    })

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>Semester Results</CardTitle>
          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Latest First</SelectItem>
                <SelectItem value="asc">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Semester</TableHead>
                  <TableHead>Academic Year</TableHead>
                  <TableHead className="text-center">SGPA</TableHead>
                  <TableHead className="text-center">CGPA</TableHead>
                  <TableHead className="text-center">Credits</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResults.map((result) => (
                  <TableRow key={result.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">Semester {result.semester}</TableCell>
                    <TableCell>{result.academicYear}</TableCell>
                    <TableCell className="text-center font-medium">{formatGPA(result.sgpa)}</TableCell>
                    <TableCell className="text-center">{formatGPA(result.cgpa)}</TableCell>
                    <TableCell className="text-center">{result.earnedCredits}</TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={result.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedResult(result)}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View details</span>
                        </Button>
                        <Button variant="ghost" size="icon" disabled={result.status !== "PUBLISHED"}>
                          <Download className="h-4 w-4" />
                          <span className="sr-only">Download</span>
                        </Button>
                        <Button variant="ghost" size="icon" disabled={result.status !== "PUBLISHED"}>
                          <Share2 className="h-4 w-4" />
                          <span className="sr-only">Share</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ResultDetailModal result={selectedResult} onClose={() => setSelectedResult(null)} />
    </>
  )
}
