"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { StatusBadge } from "@/components/status/status-badge"
import { formatGPA } from "@/lib/format"
import { useDebounce } from "@/hooks/use-debounce"
import { useToast } from "@/hooks/use-toast"
import { useApi } from "@/hooks/use-api"
import { BATCHES } from "@/lib/constants"
import { Search, Upload, Eye, ChevronLeft, ChevronRight, Loader2, GraduationCap, UserPlus, Plus } from "lucide-react"
import type { Student } from "@/types"

interface Program {
  id: string
  code: string
  name: string
  shortName: string
}

interface NewStudentForm {
  enrollmentNumber: string
  name: string
  email: string
  programId: string
  batch: string
  admissionYear: string
  expectedGradYear: string
  dateOfBirth: string
  phone: string
  address: string
  guardianName: string
  guardianPhone: string
}

const currentYear = new Date().getFullYear()

const initialFormState: NewStudentForm = {
  enrollmentNumber: "",
  name: "",
  email: "",
  programId: "",
  batch: "",
  admissionYear: currentYear.toString(),
  expectedGradYear: (currentYear + 4).toString(),
  dateOfBirth: "",
  phone: "",
  address: "",
  guardianName: "",
  guardianPhone: "",
}

export function StudentsRegistry() {
  const { toast } = useToast()
  const api = useApi()
  const [students, setStudents] = useState<Student[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  
  // Filters
  const [search, setSearch] = useState("")
  const [programFilter, setProgramFilter] = useState<string>("all")
  const [batchFilter, setBatchFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const perPage = 10

  // Add Student Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<NewStudentForm>(initialFormState)
  const [formErrors, setFormErrors] = useState<Partial<NewStudentForm>>({})

  const debouncedSearch = useDebounce(search, 300)

  // Fetch programs for filter dropdown
  useEffect(() => {
    async function fetchPrograms() {
      if (!api.isReady) return
      try {
        const data = await api.get<{ success: boolean; data: Program[] }>("/v1/curriculum/programs")
        if (data.success) {
          setPrograms(data.data || [])
        }
      } catch (err) {
        console.error("Error fetching programs:", err)
      }
    }
    fetchPrograms()
  }, [api.isReady])

  // Fetch students
  const fetchStudents = useCallback(async () => {
    if (!api.isReady) return
    
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (debouncedSearch) params.set("search", debouncedSearch)
      if (programFilter !== "all") params.set("programId", programFilter)
      if (batchFilter !== "all") params.set("batch", batchFilter)
      if (statusFilter !== "all") params.set("status", statusFilter)
      params.set("page", page.toString())
      params.set("limit", perPage.toString())

      const data = await api.get<{ success: boolean; data: { students?: Student[]; pagination?: { total: number } } | Student[] }>(
        `/v1/students?${params.toString()}`
      )

      if (data.success) {
        const studentsData = Array.isArray(data.data) ? data.data : (data.data.students || [])
        const total = Array.isArray(data.data) ? data.data.length : (data.data.pagination?.total || 0)
        setStudents(studentsData)
        setTotalCount(total)
      }
    } catch (err) {
      console.error("Error fetching students:", err)
      setStudents([])
    } finally {
      setIsLoading(false)
    }
  }, [api, debouncedSearch, programFilter, batchFilter, statusFilter, page])

  useEffect(() => {
    fetchStudents()
  }, [debouncedSearch, programFilter, batchFilter, statusFilter, page])

  const totalPages = Math.ceil(totalCount / perPage)

  // Form validation
  const validateForm = (): boolean => {
    const errors: Partial<NewStudentForm> = {}

    if (!formData.enrollmentNumber.trim()) {
      errors.enrollmentNumber = "Enrollment number is required"
    }
    if (!formData.name.trim()) {
      errors.name = "Name is required"
    }
    if (!formData.email.trim()) {
      errors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Invalid email format"
    }
    if (!formData.programId) {
      errors.programId = "Program is required"
    }
    if (!formData.batch) {
      errors.batch = "Batch is required"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle form input changes
  const handleInputChange = (field: keyof NewStudentForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  // Handle form submission
  const handleAddStudent = async () => {
    if (!validateForm()) return

    try {
      setIsSubmitting(true)
      const data = await api.post<{ success: boolean; message?: string }>("/v1/students", {
        enrollmentNumber: formData.enrollmentNumber,
        name: formData.name,
        email: formData.email,
        programId: formData.programId,
        batch: formData.batch,
        admissionYear: parseInt(formData.admissionYear),
        expectedGradYear: parseInt(formData.expectedGradYear),
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        guardianName: formData.guardianName || undefined,
        guardianPhone: formData.guardianPhone || undefined,
      })

      if (data.success) {
        toast({
          title: "Success",
          description: "Student registered successfully",
        })
        setIsAddModalOpen(false)
        setFormData(initialFormState)
        fetchStudents() // Refresh the list
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to register student",
          variant: "destructive",
        })
      }
    } catch (err: unknown) {
      console.error("Error adding student:", err)
      const message = err instanceof Error ? err.message : "Failed to register student. Please try again."
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset form when modal closes
  const handleModalClose = () => {
    setIsAddModalOpen(false)
    setFormData(initialFormState)
    setFormErrors({})
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>Students ({totalCount})</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsAddModalOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
            <Button asChild>
              <Link href="/admin/students/upload">
                <Upload className="mr-2 h-4 w-4" />
                Upload CSV
              </Link>
            </Button>
          </div>
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
                {programs.map((prog) => (
                  <SelectItem key={prog.id} value={prog.id}>
                    {prog.shortName || prog.name}
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
                <SelectItem value="DROPPED_OUT">Dropped Out</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Empty State */}
          {!isLoading && students.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No students found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {search || programFilter !== "all" || batchFilter !== "all" || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Add students manually or upload via CSV"}
              </p>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsAddModalOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Student
                </Button>
                <Button asChild>
                  <Link href="/admin/students/upload">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Students
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {/* Table */}
          {!isLoading && students.length > 0 && (
            <>
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
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-mono text-sm">{student.enrollmentNumber}</TableCell>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">
                          {typeof student.program === "string" ? student.program : student.program || "-"}
                        </TableCell>
                        <TableCell>{student.batch}</TableCell>
                        <TableCell className="text-center">{student.currentSemester || "-"}</TableCell>
                        <TableCell className="text-center font-medium">
                          {student.cgpa ? formatGPA(student.cgpa) : "-"}
                        </TableCell>
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
                  Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, totalCount)} of {totalCount} students
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Student Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={handleModalClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
            <DialogDescription>
              Fill in the student details below. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Required Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="enrollmentNumber">
                  Enrollment Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="enrollmentNumber"
                  placeholder="e.g., 2024BCS001"
                  value={formData.enrollmentNumber}
                  onChange={(e) => handleInputChange("enrollmentNumber", e.target.value)}
                  className={formErrors.enrollmentNumber ? "border-destructive" : ""}
                />
                {formErrors.enrollmentNumber && (
                  <p className="text-xs text-destructive">{formErrors.enrollmentNumber}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className={formErrors.name ? "border-destructive" : ""}
                />
                {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="student@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={formErrors.email ? "border-destructive" : ""}
              />
              {formErrors.email && <p className="text-xs text-destructive">{formErrors.email}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="programId">
                  Program <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.programId}
                  onValueChange={(value) => handleInputChange("programId", value)}
                >
                  <SelectTrigger className={formErrors.programId ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select program" />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((prog) => (
                      <SelectItem key={prog.id} value={prog.id}>
                        {prog.name} ({prog.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.programId && <p className="text-xs text-destructive">{formErrors.programId}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="batch">
                  Batch <span className="text-destructive">*</span>
                </Label>
                <Select value={formData.batch} onValueChange={(value) => handleInputChange("batch", value)}>
                  <SelectTrigger className={formErrors.batch ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {BATCHES.map((batch) => (
                      <SelectItem key={batch} value={batch}>
                        {batch}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.batch && <p className="text-xs text-destructive">{formErrors.batch}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="admissionYear">
                  Admission Year <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.admissionYear}
                  onValueChange={(value) => handleInputChange("admissionYear", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => currentYear - 5 + i).map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expectedGradYear">
                  Expected Graduation Year <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.expectedGradYear}
                  onValueChange={(value) => handleInputChange("expectedGradYear", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => currentYear + i).map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Optional Fields */}
            <div className="pt-2 border-t">
              <p className="text-sm font-medium text-muted-foreground mb-3">Optional Information</p>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    placeholder="Enter address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="guardianName">Guardian Name</Label>
                    <Input
                      id="guardianName"
                      placeholder="Enter guardian name"
                      value={formData.guardianName}
                      onChange={(e) => handleInputChange("guardianName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guardianPhone">Guardian Phone</Label>
                    <Input
                      id="guardianPhone"
                      placeholder="+91 98765 43210"
                      value={formData.guardianPhone}
                      onChange={(e) => handleInputChange("guardianPhone", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleModalClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleAddStudent} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Student
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
