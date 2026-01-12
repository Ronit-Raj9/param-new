"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { BATCHES, SEMESTERS } from "@/lib/constants"
import { useToast } from "@/hooks/use-toast"
import { useApi } from "@/hooks/use-api"
import { Award, FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react"

interface Program {
  id: string
  code: string
  name: string
  shortName: string
}

interface EligibleStudents {
  count: number
}

export function CredentialIssuance() {
  const { toast } = useToast()
  const api = useApi()
  const [issuanceType, setIssuanceType] = useState<"results" | "degree">("results")
  const [program, setProgram] = useState("")
  const [batch, setBatch] = useState("")
  const [semester, setSemester] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [jobStatus, setJobStatus] = useState<"idle" | "processing" | "complete" | "error">("idle")
  const [programs, setPrograms] = useState<Program[]>([])
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(true)
  const [eligibleCount, setEligibleCount] = useState<number | null>(null)
  const [totalToProcess, setTotalToProcess] = useState(0)
  const [successCount, setSuccessCount] = useState(0)
  const [failedCount, setFailedCount] = useState(0)

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

  // Fetch eligible student count when selection changes
  useEffect(() => {
    async function fetchEligibleCount() {
      if (!api.isReady || !program || !batch) {
        setEligibleCount(null)
        return
      }
      try {
        const params = new URLSearchParams({ programId: program, batch })
        if (issuanceType === "results" && semester) {
          params.set("semester", semester)
        }
        // Try to get count from students endpoint
        const data = await api.get<{ success: boolean; data: { students?: unknown[]; pagination?: { total: number } } | unknown[] }>(
          `/v1/students?${params.toString()}&limit=1`
        )
        if (data.success) {
          const total = Array.isArray(data.data) ? data.data.length : (data.data?.pagination?.total ?? null)
          setEligibleCount(total)
        }
      } catch (err) {
        console.error("Error fetching eligible count:", err)
        setEligibleCount(null)
      }
    }
    fetchEligibleCount()
  }, [api.isReady, program, batch, semester, issuanceType])

  const handleIssue = async () => {
    if (!api.isReady) {
      toast({
        title: "Error",
        description: "API not ready. Please try again.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    setJobStatus("processing")
    setProgress(10)

    try {
      // First get eligible students/credentials
      const params = new URLSearchParams({
        programId: program,
        batch,
        type: issuanceType === "results" ? "SEMESTER" : "DEGREE"
      })
      if (issuanceType === "results" && semester) {
        params.set("semester", semester)
      }

      setProgress(20)

      const eligibleData = await api.get<{
        success: boolean
        data: Array<{ id: string; credentialId?: string; studentId: string }>
      }>(`/v1/issuance/eligible?${params.toString()}`)

      if (!eligibleData.success || !eligibleData.data?.length) {
        throw new Error("No eligible students found for issuance")
      }

      setProgress(40)

      // Get credential IDs to issue
      const credentialIds = eligibleData.data
        .filter(s => s.credentialId)
        .map(s => s.credentialId as string)

      if (credentialIds.length === 0) {
        throw new Error("No credentials ready for issuance")
      }

      // Set total to process for progress display
      setTotalToProcess(credentialIds.length)

      // Call bulk issuance endpoint
      const result = await api.post<{
        success: boolean
        data: {
          jobId: string
          totalQueued: number
          errors: Array<{ credentialId: string; error: string }>
        }
      }>("/v1/issuance/bulk", { credentialIds })

      setProgress(80)

      if (result.success) {
        setProgress(100)
        setSuccessCount(result.data.totalQueued)
        setFailedCount(result.data.errors?.length || 0)
        setJobStatus("complete")
        toast({
          title: "Issuance started",
          description: `${result.data.totalQueued} credentials queued for blockchain issuance. Job ID: ${result.data.jobId}`,
        })
      } else {
        throw new Error("Failed to start issuance")
      }
    } catch (error) {
      console.error("Issuance error:", error)
      setJobStatus("error")
      toast({
        title: "Issuance failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Issuance Form */}
      <Card>
        <CardHeader>
          <CardTitle>Issue Credentials</CardTitle>
          <CardDescription>Select parameters to issue credentials</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Issuance Type */}
          <div className="space-y-2">
            <Label>Credential Type</Label>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant={issuanceType === "results" ? "default" : "outline"}
                className={`h-auto py-4 flex-col gap-2 ${issuanceType !== "results" ? "bg-transparent" : ""}`}
                onClick={() => setIssuanceType("results")}
              >
                <FileText className="h-5 w-5" />
                Semester Results
              </Button>
              <Button
                variant={issuanceType === "degree" ? "default" : "outline"}
                className={`h-auto py-4 flex-col gap-2 ${issuanceType !== "degree" ? "bg-transparent" : ""}`}
                onClick={() => setIssuanceType("degree")}
              >
                <Award className="h-5 w-5" />
                Degree Certificate
              </Button>
            </div>
          </div>

          {/* Program Selection */}
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

          {/* Batch Selection */}
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

          {/* Semester Selection (only for results) */}
          {issuanceType === "results" && (
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
          )}

          {/* Preview Info */}
          {program && batch && (
            <div className="p-4 rounded-lg bg-muted">
              <h4 className="font-medium mb-2">Issuance Summary</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>
                  <span className="text-foreground">Type:</span>{" "}
                  {issuanceType === "results" ? "Semester Results" : "Degree Certificate"}
                </p>
                <p>
                  <span className="text-foreground">Program:</span> {programs.find((p) => p.id === program)?.shortName || programs.find((p) => p.id === program)?.name}
                </p>
                <p>
                  <span className="text-foreground">Batch:</span> {batch}
                </p>
                {issuanceType === "results" && semester && (
                  <p>
                    <span className="text-foreground">Semester:</span> {semester}
                  </p>
                )}
                <p>
                  <span className="text-foreground">Eligible Students:</span> {eligibleCount !== null ? eligibleCount : "–"}
                </p>
              </div>
            </div>
          )}

          {/* Issue Button */}
          <Button
            className="w-full"
            onClick={handleIssue}
            disabled={isProcessing || !program || !batch || (issuanceType === "results" && !semester)}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Award className="mr-2 h-4 w-4" />
                Issue Credentials
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Job Status */}
      <Card>
        <CardHeader>
          <CardTitle>Issuance Status</CardTitle>
          <CardDescription>Track credential issuance progress</CardDescription>
        </CardHeader>
        <CardContent>
          {jobStatus === "idle" && (
            <div className="text-center py-12">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <Award className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No active issuance job</p>
              <p className="text-sm text-muted-foreground mt-1">Configure and start a new issuance</p>
            </div>
          )}

          {jobStatus === "processing" && (
            <div className="space-y-6">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                <h3 className="font-semibold">Issuing Credentials</h3>
                <p className="text-sm text-muted-foreground">Please wait...</p>
              </div>
              <Progress value={progress} />
              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <p className="font-medium">{Math.floor((progress / 100) * totalToProcess)}</p>
                  <p className="text-muted-foreground">Processed</p>
                </div>
                <div>
                  <p className="font-medium">{totalToProcess - Math.floor((progress / 100) * totalToProcess)}</p>
                  <p className="text-muted-foreground">Remaining</p>
                </div>
                <div>
                  <p className="font-medium">{failedCount}</p>
                  <p className="text-muted-foreground">Failed</p>
                </div>
              </div>
            </div>
          )}

          {jobStatus === "complete" && (
            <div className="text-center py-8">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <h3 className="font-semibold text-lg">Issuance Complete</h3>
              <p className="text-muted-foreground mt-1">{successCount} credentials queued successfully</p>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted text-center">
                  <p className="text-2xl font-bold text-success">{successCount}</p>
                  <p className="text-sm text-muted-foreground">Success</p>
                </div>
                <div className="p-4 rounded-lg bg-muted text-center">
                  <p className="text-2xl font-bold">{failedCount}</p>
                  <p className="text-sm text-muted-foreground">Failed</p>
                </div>
              </div>
              <Button variant="outline" className="mt-6 bg-transparent" onClick={() => setJobStatus("idle")}>
                Start New Issuance
              </Button>
            </div>
          )}

          {jobStatus === "error" && (
            <div className="text-center py-8">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="font-semibold text-lg text-destructive">Issuance Failed</h3>
              <p className="text-muted-foreground mt-1">An error occurred during issuance</p>
              <Button variant="outline" className="mt-6 bg-transparent" onClick={() => setJobStatus("idle")}>
                Try Again
              </Button>
            </div>
          )}

          {/* Recent Jobs - placeholder for future implementation */}
          {jobStatus === "idle" && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-medium mb-3">Recent Jobs</h4>
              <p className="text-sm text-muted-foreground">No recent issuance jobs found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
