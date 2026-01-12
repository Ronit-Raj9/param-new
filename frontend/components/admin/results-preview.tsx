"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { StatusBadge } from "@/components/status/status-badge"
import { GradeBadge } from "@/components/results/grade-badge"
import { formatGPA } from "@/lib/format"
import { BATCHES, SEMESTERS } from "@/lib/constants"
import { useToast } from "@/hooks/use-toast"
import { useApi } from "@/hooks/use-api"
import { Send, Edit, Trash2, Loader2, FileText } from "lucide-react"

interface DraftResult {
  id: string
  enrollmentNumber: string
  name: string
  subjects: { code: string; grade: string }[]
  sgpa: number
  status: string
}

interface Program {
  id: string
  code: string
  name: string
  shortName: string
}

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
}

export function ResultsPreview() {
  const { toast } = useToast()
  const api = useApi()
  const [results, setResults] = useState<DraftResult[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(true)
  const [program, setProgram] = useState("")
  const [batch, setBatch] = useState("")
  const [semester, setSemester] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch programs from API
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
      } finally {
        setIsLoadingPrograms(false)
      }
    }
    fetchPrograms()
  }, [api.isReady])

  // Fetch draft results
  useEffect(() => {
    if (!api.isReady) return

    async function fetchDraftResults() {
      try {
        setIsLoading(true)
        const params = new URLSearchParams()
        if (program && program !== "all") params.set("programId", program)
        if (batch && batch !== "all") params.set("batchYear", batch.split("-")[0]) // Extract year from "2023-2027"
        if (semester && semester !== "all") params.set("semester", semester)
        params.set("status", "DRAFT")

        // Use the correct API endpoint with query params
        const response = await api.get<{
          success: boolean
          data: Array<{
            id: string
            semester: number
            sgpa: number | null
            status: string
            student: {
              enrollmentNumber: string
              name: string
              user?: { name: string }
            }
            courseResults?: Array<{
              course: { code: string }
              grade: string
            }>
          }>
          pagination?: { total: number }
        }>(`/v1/results?${params.toString()}`)

        if (response.success && response.data) {
          // Transform response to match DraftResult interface
          const transformedResults: DraftResult[] = response.data.map((r) => ({
            id: r.id,
            enrollmentNumber: r.student.enrollmentNumber,
            name: r.student.user?.name || r.student.name,
            subjects: r.courseResults?.map((cr) => ({
              code: cr.course.code,
              grade: cr.grade,
            })) || [],
            sgpa: r.sgpa || 0,
            status: r.status,
          }))
          setResults(transformedResults)
        }
      } catch (err) {
        console.error("Error fetching draft results:", err)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchDraftResults()
  }, [api.isReady, program, batch, semester])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(results.map((r) => r.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id])
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id))
    }
  }

  const handleSubmitForApproval = async () => {
    if (selectedIds.length === 0) return

    try {
      setIsSubmitting(true)

      // Submit each result for approval by updating its status to REVIEWED
      const promises = selectedIds.map((id) =>
        api.patch<ApiResponse>(`/v1/results/${id}/status`, { status: "REVIEWED" })
      )

      const results = await Promise.allSettled(promises)
      const successCount = results.filter((r) => r.status === "fulfilled").length
      const failedCount = results.filter((r) => r.status === "rejected").length

      if (successCount > 0) {
        toast({
          title: "Submitted for approval",
          description: `${successCount} results sent for approval${failedCount > 0 ? `. ${failedCount} failed.` : ""}`,
        })
        // Remove submitted results from the list
        setResults((prev) => prev.filter((r) => !selectedIds.includes(r.id)))
        setSelectedIds([])
      } else {
        toast({
          title: "Error",
          description: "Failed to submit results for approval",
          variant: "destructive",
        })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to submit results for approval",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <CardTitle>Draft Results</CardTitle>
        <Button onClick={handleSubmitForApproval} disabled={selectedIds.length === 0 || isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Submit for Approval ({selectedIds.length})
        </Button>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <Select value={program} onValueChange={setProgram} disabled={isLoadingPrograms}>
            <SelectTrigger>
              <SelectValue placeholder={isLoadingPrograms ? "Loading..." : "Select program"} />
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
          <Select value={batch} onValueChange={setBatch}>
            <SelectTrigger>
              <SelectValue placeholder="Select batch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Batches</SelectItem>
              {BATCHES.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={semester} onValueChange={setSemester}>
            <SelectTrigger>
              <SelectValue placeholder="Select semester" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Semesters</SelectItem>
              {SEMESTERS.map((s) => (
                <SelectItem key={s} value={String(s)}>
                  Semester {s}
                </SelectItem>
              ))}
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
        {!isLoading && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No draft results</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {program || batch || semester ? "Try adjusting your filters" : "Upload results to see them here"}
            </p>
          </div>
        )}

        {/* Results Table */}
        {!isLoading && results.length > 0 && (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectedIds.length === results.length && results.length > 0}
                      onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                    />
                  </TableHead>
                  <TableHead>Enrollment No.</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Subjects</TableHead>
                  <TableHead className="text-center">SGPA</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(result.id)}
                        onCheckedChange={(checked) => handleSelect(result.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm">{result.enrollmentNumber}</TableCell>
                    <TableCell className="font-medium">{result.name}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {result.subjects.slice(0, 3).map((sub) => (
                          <GradeBadge key={sub.code} grade={sub.grade} />
                        ))}
                        {result.subjects.length > 3 && (
                          <span className="text-sm text-muted-foreground">+{result.subjects.length - 3}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-medium">{formatGPA(result.sgpa)}</TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={result.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
