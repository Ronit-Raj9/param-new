"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { PROGRAMS, BATCHES, SEMESTERS } from "@/lib/constants"
import { useToast } from "@/hooks/use-toast"
import { Award, FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react"

export function CredentialIssuance() {
  const { toast } = useToast()
  const [issuanceType, setIssuanceType] = useState<"results" | "degree">("results")
  const [program, setProgram] = useState("")
  const [batch, setBatch] = useState("")
  const [semester, setSemester] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [jobStatus, setJobStatus] = useState<"idle" | "processing" | "complete" | "error">("idle")

  const handleIssue = async () => {
    setIsProcessing(true)
    setJobStatus("processing")
    setProgress(0)

    // Simulate issuance process
    for (let i = 0; i <= 100; i += 5) {
      await new Promise((resolve) => setTimeout(resolve, 100))
      setProgress(i)
    }

    setJobStatus("complete")
    setIsProcessing(false)
    toast({
      title: "Issuance complete",
      description: `Successfully issued ${issuanceType === "results" ? "semester results" : "degree certificates"}`,
    })
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
                  <span className="text-foreground">Program:</span> {PROGRAMS.find((p) => p.value === program)?.label}
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
                  <span className="text-foreground">Eligible Students:</span> 45
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
                  <p className="font-medium">{Math.floor((progress / 100) * 45)}</p>
                  <p className="text-muted-foreground">Processed</p>
                </div>
                <div>
                  <p className="font-medium">{45 - Math.floor((progress / 100) * 45)}</p>
                  <p className="text-muted-foreground">Remaining</p>
                </div>
                <div>
                  <p className="font-medium">0</p>
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
              <p className="text-muted-foreground mt-1">45 credentials issued successfully</p>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted text-center">
                  <p className="text-2xl font-bold text-success">45</p>
                  <p className="text-sm text-muted-foreground">Success</p>
                </div>
                <div className="p-4 rounded-lg bg-muted text-center">
                  <p className="text-2xl font-bold">0</p>
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

          {/* Recent Jobs */}
          {jobStatus !== "processing" && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-medium mb-3">Recent Jobs</h4>
              <div className="space-y-3">
                {[
                  { title: "B.Tech CSE 2020 - Sem 7", status: "success", time: "2 hours ago" },
                  { title: "B.Tech IT 2021 - Sem 5", status: "success", time: "Yesterday" },
                  { title: "MBA 2022 - Sem 4", status: "success", time: "3 days ago" },
                ].map((job, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span>{job.title}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-success border-success">
                        {job.status}
                      </Badge>
                      <span className="text-muted-foreground">{job.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
