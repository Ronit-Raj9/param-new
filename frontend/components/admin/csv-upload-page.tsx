"use client"

import type React from "react"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BATCHES, SEMESTERS } from "@/lib/constants"
import { useToast } from "@/hooks/use-toast"
import { useApi } from "@/hooks/use-api"
import { Upload, Download, FileText, CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface CsvUploadPageProps {
  type: "students" | "results"
}

type UploadStep = "upload" | "preview" | "processing" | "complete"

interface ParsedRow {
  data: Record<string, string>
  errors: string[]
  isValid: boolean
}

interface Program {
  id: string
  code: string
  name: string
  shortName: string
}

export function CsvUploadPage({ type }: CsvUploadPageProps) {
  const { toast } = useToast()
  const api = useApi()
  const [step, setStep] = useState<UploadStep>("upload")
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ParsedRow[]>([])
  const [progress, setProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [programs, setPrograms] = useState<Program[]>([])
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(true)

  // Form state for results upload
  const [program, setProgram] = useState("")
  const [batch, setBatch] = useState("")
  const [semester, setSemester] = useState("")

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

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0] && files[0].type === "text/csv") {
      handleFile(files[0])
    } else {
      toast({
        title: "Invalid file",
        description: "Please upload a CSV file",
        variant: "destructive",
      })
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      handleFile(files[0])
    }
  }

  const handleFile = async (uploadedFile: File) => {
    setFile(uploadedFile)

    // Parse CSV (simplified - in production use papaparse)
    const text = await uploadedFile.text()
    const lines = text.split("\n").filter((line) => line.trim())
    const headers = lines[0].split(",").map((h) => h.trim())

    const parsed: ParsedRow[] = lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim())
      const data: Record<string, string> = {}
      headers.forEach((header, i) => {
        data[header] = values[i] || ""
      })

      // Simple validation
      const errors: string[] = []
      if (type === "students") {
        if (!data["enrollment_number"]) errors.push("Missing enrollment number")
        if (!data["name"]) errors.push("Missing name")
        if (!data["email"]) errors.push("Missing email")
      } else {
        if (!data["enrollment_number"]) errors.push("Missing enrollment number")
        if (!data["grade"]) errors.push("Missing grade")
      }

      return {
        data,
        errors,
        isValid: errors.length === 0,
      }
    })

    setParsedData(parsed)
    setStep("preview")
  }

  const handleUpload = async () => {
    if (!api.isReady) {
      toast({
        title: "Error",
        description: "API not ready. Please try again.",
        variant: "destructive",
      })
      return
    }

    setStep("processing")
    setProgress(0)

    try {
      // Prepare data for backend
      const validData = parsedData.filter((r) => r.isValid).map((r) => r.data)
      
      if (type === "students") {
        // Student bulk import
        const students = validData.map((row) => ({
          enrollmentNumber: row["enrollment_number"] || "",
          email: row["email"] || "",
          name: row["name"] || "",
          programId: program,
          batch: parseInt(batch) || new Date().getFullYear(),
          dateOfBirth: row["date_of_birth"] || undefined,
        }))

        setProgress(20)
        
        const result = await api.post<{ success: boolean; data: { success: string[]; errors: { enrollmentNumber: string; error: string }[] } }>(
          "/v1/students/bulk",
          { students }
        )

        setProgress(100)

        if (result.success) {
          const successCount = result.data.success?.length || 0
          const errorCount = result.data.errors?.length || 0
          
          setStep("complete")
          toast({
            title: "Upload complete",
            description: `Successfully created ${successCount} students. ${errorCount > 0 ? `${errorCount} failed.` : ""}`,
          })
        } else {
          throw new Error("Failed to upload students")
        }
      } else {
        // Results bulk upload
        if (!semester) {
          toast({
            title: "Error",
            description: "Please select a semester",
            variant: "destructive",
          })
          setStep("preview")
          return
        }

        const results = validData.map((row) => ({
          enrollmentNumber: row["enrollment_number"] || "",
          grade: row["grade"] || "",
          gradePoints: parseFloat(row["grade_points"] || "0"),
          courseCode: row["course_code"] || "",
          internalMarks: parseFloat(row["internal_marks"] || "0"),
          externalMarks: parseFloat(row["external_marks"] || "0"),
        }))

        setProgress(20)

        const result = await api.post<{ success: boolean; data: { success: string[]; errors: { enrollmentNumber: string; error: string }[] } }>(
          "/v1/results/bulk",
          {
            programId: program,
            semester: parseInt(semester),
            academicYear: `${parseInt(batch)}-${parseInt(batch) + 1}`,
            results,
          }
        )

        setProgress(100)

        if (result.success) {
          const successCount = result.data.success?.length || 0
          const errorCount = result.data.errors?.length || 0
          
          setStep("complete")
          toast({
            title: "Upload complete",
            description: `Successfully uploaded ${successCount} results. ${errorCount > 0 ? `${errorCount} failed.` : ""}`,
          })
        } else {
          throw new Error("Failed to upload results")
        }
      }
    } catch (error) {
      console.error("Upload error:", error)
      setStep("preview")
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const handleReset = () => {
    setFile(null)
    setParsedData([])
    setStep("upload")
    setProgress(0)
  }

  const validCount = parsedData.filter((r) => r.isValid).length
  const errorCount = parsedData.filter((r) => !r.isValid).length

  return (
    <div className="space-y-6">
      {/* Step 1: Upload */}
      {step === "upload" && (
        <>
          {/* Template Download */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Download Template</CardTitle>
              <CardDescription>Use our CSV template to ensure your data is formatted correctly</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="bg-transparent">
                <Download className="mr-2 h-4 w-4" />
                Download {type === "students" ? "Students" : "Results"} Template
              </Button>
            </CardContent>
          </Card>

          {/* Results-specific fields */}
          {type === "results" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Select Target</CardTitle>
                <CardDescription>Choose the program, batch, and semester for these results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Program</Label>
                    <Select value={program} onValueChange={setProgram} disabled={isLoadingPrograms}>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingPrograms ? "Loading..." : "Select program"} />
                      </SelectTrigger>
                      <SelectContent>
                        {programs.map((prog) => (
                          <SelectItem key={prog.id} value={prog.id}>
                            {prog.shortName || prog.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Batch</Label>
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
                  </div>
                  <div className="space-y-2">
                    <Label>Semester</Label>
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
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upload Zone */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upload CSV File</CardTitle>
              <CardDescription>Drag and drop your CSV file or click to browse</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-12 text-center transition-colors",
                  dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input type="file" accept=".csv" onChange={handleFileInput} className="hidden" id="csv-upload" />
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-medium mb-1">Drop your CSV file here</p>
                  <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
                  <Button variant="outline" type="button" className="bg-transparent">
                    Select File
                  </Button>
                </label>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-4">Maximum file size: 10MB</p>
            </CardContent>
          </Card>
        </>
      )}

      {/* Step 2: Preview */}
      {step === "preview" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Preview Data</CardTitle>
                <CardDescription>Review your data before uploading</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-success text-success-foreground">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  {validCount} Valid
                </Badge>
                {errorCount > 0 && (
                  <Badge variant="destructive">
                    <XCircle className="mr-1 h-3 w-3" />
                    {errorCount} Errors
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* File info */}
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg mb-6">
              <FileText className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-medium">{file?.name}</p>
                <p className="text-sm text-muted-foreground">{parsedData.length} rows found</p>
              </div>
            </div>

            {/* Error summary */}
            {errorCount > 0 && (
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {errorCount} rows have validation errors and will be skipped during upload.
                </AlertDescription>
              </Alert>
            )}

            {/* Preview table */}
            <div className="rounded-lg border overflow-hidden max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Status</TableHead>
                    {Object.keys(parsedData[0]?.data || {}).map((header) => (
                      <TableHead key={header}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.slice(0, 50).map((row, i) => (
                    <TableRow key={i} className={cn(!row.isValid && "bg-destructive/5")}>
                      <TableCell>
                        {row.isValid ? (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )}
                      </TableCell>
                      {Object.values(row.data).map((value, j) => (
                        <TableCell key={j} className="text-sm">
                          {value}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {parsedData.length > 50 && (
              <p className="text-sm text-muted-foreground text-center mt-2">
                Showing first 50 of {parsedData.length} rows
              </p>
            )}

            {/* Actions */}
            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={handleReset} className="bg-transparent">
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={validCount === 0}>
                Upload {validCount} Records
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Processing */}
      {step === "processing" && (
        <Card>
          <CardContent className="pt-12 pb-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-6" />
            <h2 className="text-xl font-semibold mb-2">Processing Upload</h2>
            <p className="text-muted-foreground mb-6">Please wait while we process your data...</p>
            <Progress value={progress} className="max-w-md mx-auto" />
            <p className="text-sm text-muted-foreground mt-2">{progress}% complete</p>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Complete */}
      {step === "complete" && (
        <Card>
          <CardContent className="pt-12 pb-8 text-center">
            <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Upload Complete</h2>
            <p className="text-muted-foreground mb-6">
              Successfully processed {validCount} records.
              {errorCount > 0 && ` ${errorCount} records were skipped due to errors.`}
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={handleReset} className="bg-transparent">
                Upload Another File
              </Button>
              <Button asChild>
                <a href={type === "students" ? "/admin/students" : "/admin/results/preview"}>View Records</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
