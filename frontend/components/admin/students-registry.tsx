"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/status/status-badge"
import { formatGPA } from "@/lib/format"
import { useDebounce } from "@/hooks/use-debounce"
import { PROGRAMS, BATCHES } from "@/lib/constants"
import { Search, Upload, Eye, ChevronLeft, ChevronRight } from "lucide-react"
import type { Student } from "@/types"

// Mock data
const mockStudents: Student[] = [
  {
    id: "1",
    enrollmentNumber: "2020BCS001",
    name: "Rahul Sharma",
    email: "rahul.sharma@iiitm.ac.in",
    program: "B.Tech Computer Science & Engineering",
    programId: "btech-cse",
    batch: "2020",
    currentSemester: 8,
    cgpa: 8.75,
    totalCredits: 176,
    status: "ACTIVE",
    admissionDate: "2020-08-01",
    createdAt: "2020-08-01T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z",
  },
  {
    id: "2",
    enrollmentNumber: "2020BCS002",
    name: "Priya Patel",
    email: "priya.patel@iiitm.ac.in",
    program: "B.Tech Computer Science & Engineering",
    programId: "btech-cse",
    batch: "2020",
    currentSemester: 8,
    cgpa: 9.12,
    totalCredits: 176,
    status: "ACTIVE",
    admissionDate: "2020-08-01",
    createdAt: "2020-08-01T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z",
  },
  {
    id: "3",
    enrollmentNumber: "2021BIT001",
    name: "Amit Kumar",
    email: "amit.kumar@iiitm.ac.in",
    program: "B.Tech Information Technology",
    programId: "btech-it",
    batch: "2021",
    currentSemester: 6,
    cgpa: 8.45,
    totalCredits: 132,
    status: "ACTIVE",
    admissionDate: "2021-08-01",
    createdAt: "2021-08-01T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z",
  },
  {
    id: "4",
    enrollmentNumber: "2019BCS045",
    name: "Sneha Gupta",
    email: "sneha.gupta@iiitm.ac.in",
    program: "B.Tech Computer Science & Engineering",
    programId: "btech-cse",
    batch: "2019",
    currentSemester: 8,
    cgpa: 8.92,
    totalCredits: 176,
    status: "GRADUATED",
    admissionDate: "2019-08-01",
    graduationDate: "2023-06-30",
    createdAt: "2019-08-01T00:00:00Z",
    updatedAt: "2023-06-30T00:00:00Z",
  },
  {
    id: "5",
    enrollmentNumber: "2022BMBA001",
    name: "Vikram Singh",
    email: "vikram.singh@iiitm.ac.in",
    program: "Master of Business Administration",
    programId: "mba",
    batch: "2022",
    currentSemester: 4,
    cgpa: 7.85,
    totalCredits: 72,
    status: "ACTIVE",
    admissionDate: "2022-08-01",
    createdAt: "2022-08-01T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z",
  },
]

export function StudentsRegistry() {
  const [search, setSearch] = useState("")
  const [programFilter, setProgramFilter] = useState<string>("all")
  const [batchFilter, setBatchFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const perPage = 10

  const debouncedSearch = useDebounce(search, 300)

  const filteredStudents = mockStudents.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      student.enrollmentNumber.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      student.email.toLowerCase().includes(debouncedSearch.toLowerCase())
    const matchesProgram = programFilter === "all" || student.programId === programFilter
    const matchesBatch = batchFilter === "all" || student.batch === batchFilter
    const matchesStatus = statusFilter === "all" || student.status === statusFilter
    return matchesSearch && matchesProgram && matchesBatch && matchesStatus
  })

  const totalPages = Math.ceil(filteredStudents.length / perPage)
  const paginatedStudents = filteredStudents.slice((page - 1) * perPage, page * perPage)

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <CardTitle>Students ({filteredStudents.length})</CardTitle>
        <Button asChild>
          <Link href="/admin/students/upload">
            <Upload className="mr-2 h-4 w-4" />
            Upload CSV
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-6">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, enrollment, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={programFilter} onValueChange={setProgramFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Program" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              {PROGRAMS.map((prog) => (
                <SelectItem key={prog.value} value={prog.value}>
                  {prog.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={batchFilter} onValueChange={setBatchFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Batch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Batches</SelectItem>
              {BATCHES.map((batch) => (
                <SelectItem key={batch} value={batch}>
                  {batch}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="GRADUATED">Graduated</SelectItem>
              <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Enrollment No.</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead className="text-center">Semester</TableHead>
                <TableHead className="text-center">CGPA</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-mono text-sm">{student.enrollmentNumber}</TableCell>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">{student.program}</TableCell>
                  <TableCell>{student.batch}</TableCell>
                  <TableCell className="text-center">{student.currentSemester}</TableCell>
                  <TableCell className="text-center font-medium">{formatGPA(student.cgpa)}</TableCell>
                  <TableCell className="text-center">
                    <StatusBadge status={student.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="icon">
                      <Link href={`/admin/students/${student.id}`}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View details</span>
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, filteredStudents.length)} of{" "}
            {filteredStudents.length} students
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {page} of {totalPages || 1}
            </span>
            <Button variant="outline" size="icon" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
