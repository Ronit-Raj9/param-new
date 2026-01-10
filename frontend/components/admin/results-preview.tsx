"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { StatusBadge } from "@/components/status/status-badge"
import { GradeBadge } from "@/components/results/grade-badge"
import { formatGPA } from "@/lib/format"
import { PROGRAMS, BATCHES, SEMESTERS } from "@/lib/constants"
import { useToast } from "@/hooks/use-toast"
import { Send, Edit, Trash2 } from "lucide-react"

// Mock data
const mockResults = [
  {
    id: "1",
    enrollmentNumber: "2020BCS001",
    name: "Rahul Sharma",
    subjects: [
      { code: "CS401", grade: "A+" },
      { code: "CS402", grade: "A" },
    ],
    sgpa: 9.2,
    status: "DRAFT",
  },
  {
    id: "2",
    enrollmentNumber: "2020BCS002",
    name: "Priya Patel",
    subjects: [
      { code: "CS401", grade: "A+" },
      { code: "CS402", grade: "A+" },
    ],
    sgpa: 10.0,
    status: "DRAFT",
  },
  {
    id: "3",
    enrollmentNumber: "2020BCS003",
    name: "Amit Kumar",
    subjects: [
      { code: "CS401", grade: "B+" },
      { code: "CS402", grade: "A" },
    ],
    sgpa: 8.5,
    status: "DRAFT",
  },
]

export function ResultsPreview() {
  const { toast } = useToast()
  const [program, setProgram] = useState("")
  const [batch, setBatch] = useState("")
  const [semester, setSemester] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(mockResults.map((r) => r.id))
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

  const handleSubmitForApproval = () => {
    toast({
      title: "Submitted for approval",
      description: `${selectedIds.length} results sent for approval`,
    })
    setSelectedIds([])
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <CardTitle>Draft Results</CardTitle>
        <Button onClick={handleSubmitForApproval} disabled={selectedIds.length === 0}>
          <Send className="mr-2 h-4 w-4" />
          Submit for Approval ({selectedIds.length})
        </Button>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <Select value={program} onValueChange={setProgram}>
            <SelectTrigger>
              <SelectValue placeholder="Select program" />
            </SelectTrigger>
            <SelectContent>
              {PROGRAMS.map((prog) => (
                <SelectItem key={prog.value} value={prog.value}>
                  {prog.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={batch} onValueChange={setBatch}>
            <SelectTrigger>
              <SelectValue placeholder="Select batch" />
            </SelectTrigger>
            <SelectContent>
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
              {SEMESTERS.map((s) => (
                <SelectItem key={s} value={String(s)}>
                  Semester {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Results Table */}
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedIds.length === mockResults.length}
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
              {mockResults.map((result) => (
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
                      {result.subjects.map((sub) => (
                        <GradeBadge key={sub.code} grade={sub.grade} />
                      ))}
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
      </CardContent>
    </Card>
  )
}
