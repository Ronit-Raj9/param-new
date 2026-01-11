"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatCard } from "@/components/dashboard/stat-card"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { StatusBadge } from "@/components/status/status-badge"
import { useAuth } from "@/providers/auth-provider"
import { useApi } from "@/hooks/use-api"
import { formatGPA, formatDate } from "@/lib/format"
import { FileText, GraduationCap, Share2, TrendingUp, Loader2, AlertCircle, Wallet, Copy, ExternalLink } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface StudentProfile {
  id: string
  enrollmentNumber: string
  name: string
  email: string
  program: string
  batch: string
  currentSemester: number
  cgpa: number
  totalCredits: number
  status: string
  walletAddress?: string | null
}

interface LatestResult {
  id: string
  semester: number
  academicYear: string
  sgpa: number
  credits: number
  status: string
  publishedAt: string | null
}

interface DegreeStatus {
  issued: boolean
  expectedDate: string | null
  type: string
}

interface Announcement {
  id: string
  title: string
  content: string
  createdAt: string
  priority: string
}

interface DashboardData {
  profile: StudentProfile | null
  latestResult: LatestResult | null
  degreeStatus: DegreeStatus | null
  announcements: Announcement[]
  shareLinksCount: number
}

export function StudentDashboard() {
  const { user } = useAuth()
  const api = useApi()
  const { toast } = useToast()
  const [data, setData] = useState<DashboardData>({
    profile: null,
    latestResult: null,
    degreeStatus: null,
    announcements: [],
    shareLinksCount: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const copyWalletAddress = async () => {
    if (data.profile?.walletAddress) {
      await navigator.clipboard.writeText(data.profile.walletAddress)
      toast({
        title: "Copied!",
        description: "Wallet address copied to clipboard",
      })
    }
  }

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  useEffect(() => {
    async function fetchDashboardData() {
      if (!api.isReady) return
      
      try {
        setIsLoading(true)
        const result = await api.get<{ success: boolean; data: DashboardData }>("/v1/dashboard/student")

        if (result.success) {
          setData(result.data)
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err)
        setError("Failed to load dashboard data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [api.isReady])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !data.profile) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">Unable to load dashboard</h3>
        <p className="text-sm text-muted-foreground mt-1">{error || "Please try again later"}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back, {user?.name || data.profile.name}!</h1>
          <p className="text-muted-foreground">Here is an overview of your academic progress</p>
        </div>
        <Badge variant="outline" className="w-fit text-sm">
          {data.profile.program}
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Current CGPA"
          value={data.profile.cgpa ? formatGPA(data.profile.cgpa) : "-"}
          icon={TrendingUp}
          description="Cumulative Grade Point Average"
        />
        <StatCard
          title="Semester"
          value={data.profile.currentSemester || "-"}
          icon={FileText}
          description="Current semester"
        />
        <StatCard
          title="Credits Earned"
          value={data.profile.totalCredits || 0}
          icon={GraduationCap}
          description="Total credits completed"
        />
        <StatCard
          title="Share Links"
          value={data.shareLinksCount}
          icon={Share2}
          description="Active credential shares"
          href="/student/share"
        />
      </div>

      {/* Wallet Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Credential Wallet</CardTitle>
            </div>
            <Badge variant={data.profile.walletAddress ? "default" : "secondary"}>
              {data.profile.walletAddress ? "Active" : "Pending"}
            </Badge>
          </div>
          <CardDescription>
            Your blockchain wallet for receiving academic credentials as NFTs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.profile.walletAddress ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Wallet Address</p>
                  <p className="font-mono text-sm font-medium">
                    <span className="sm:hidden">{truncateAddress(data.profile.walletAddress)}</span>
                    <span className="hidden sm:inline">{data.profile.walletAddress}</span>
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyWalletAddress} className="bg-transparent">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-transparent"
                  onClick={() => window.open(`https://sepolia.basescan.org/address/${data.profile!.walletAddress}`, "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on Explorer
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <Wallet className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Wallet being created...</p>
                <p className="text-sm text-muted-foreground">
                  Your credential wallet is being set up. This usually takes a few moments.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Latest Result Card */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Latest Semester Result</CardTitle>
              <CardDescription>
                {data.latestResult
                  ? `Semester ${data.latestResult.semester} - ${data.latestResult.academicYear}`
                  : "No results available"}
              </CardDescription>
            </div>
            {data.latestResult && <StatusBadge status={data.latestResult.status} />}
          </CardHeader>
          <CardContent>
            {data.latestResult ? (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">SGPA</p>
                    <p className="text-3xl font-bold text-primary">{formatGPA(data.latestResult.sgpa)}</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Credits</p>
                    <p className="text-3xl font-bold">{data.latestResult.credits}</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Published</p>
                    <p className="text-sm font-medium">
                      {data.latestResult.publishedAt ? formatDate(data.latestResult.publishedAt) : "-"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex gap-3">
                  <Button asChild variant="outline" size="sm" className="bg-transparent">
                    <Link href="/student/results">View All Results</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href={`/student/results/${data.latestResult.id}`}>View Details</Link>
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No results published yet</p>
                <Button asChild variant="outline" size="sm" className="mt-4">
                  <Link href="/student/results">View Results</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Degree Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Degree Status</CardTitle>
            <CardDescription>{data.degreeStatus?.type || "Degree"} Certificate</CardDescription>
          </CardHeader>
          <CardContent>
            {data.degreeStatus?.issued ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-success">
                  <GraduationCap className="h-5 w-5" />
                  <span className="font-medium">Degree Issued</span>
                </div>
                <Button asChild className="w-full">
                  <Link href="/student/degree">View & Download</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Your degree will be available after final results are published and approved.
                </p>
                {data.degreeStatus?.expectedDate && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Expected Date</p>
                    <p className="font-medium">{formatDate(data.degreeStatus.expectedDate)}</p>
                  </div>
                )}
                <Button asChild variant="outline" className="w-full bg-transparent">
                  <Link href="/student/results">View Current Results</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Announcements */}
      <div className="grid gap-6 lg:grid-cols-2">
        <QuickActions />

        {/* Announcements */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Announcements</CardTitle>
            <CardDescription>Latest updates from administration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.announcements.length > 0 ? (
              data.announcements.map((announcement) => (
                <div key={announcement.id} className="border-l-2 border-primary pl-4 py-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm">{announcement.title}</h4>
                    {announcement.priority === "HIGH" && (
                      <Badge variant="destructive" className="text-xs">
                        Important
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{announcement.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(announcement.createdAt)}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">No announcements at this time</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
