"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatCard } from "@/components/dashboard/stat-card"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { StatusBadge } from "@/components/status/status-badge"
import { useAuth } from "@/providers/auth-provider"
import { formatGPA, formatDate } from "@/lib/format"
import { FileText, GraduationCap, Share2, TrendingUp } from "lucide-react"
import Link from "next/link"

// Mock data - in production this would come from API
const mockDashboardData = {
  profile: {
    id: "1",
    enrollmentNumber: "2020BCS001",
    name: "Rahul Sharma",
    email: "rahul.sharma@iiitm.ac.in",
    program: "B.Tech Computer Science & Engineering",
    batch: "2020-2024",
    currentSemester: 8,
    cgpa: 8.75,
    totalCredits: 176,
    status: "ACTIVE" as const,
  },
  latestResult: {
    id: "sem-7",
    semester: 7,
    academicYear: "2023-24",
    sgpa: 9.0,
    credits: 20,
    status: "PASSED" as const,
    publishedAt: "2024-01-15T10:00:00Z",
  },
  degreeStatus: {
    issued: false,
    expectedDate: "2024-06-30",
    type: "B.Tech",
  },
  announcements: [
    {
      id: "1",
      title: "Semester 8 Results Declaration",
      content: "Final semester results will be declared by June 15, 2024",
      createdAt: "2024-01-10T10:00:00Z",
      priority: "HIGH" as const,
    },
    {
      id: "2",
      title: "Convocation Schedule",
      content: "Annual convocation ceremony scheduled for July 2024",
      createdAt: "2024-01-05T10:00:00Z",
      priority: "MEDIUM" as const,
    },
  ],
}

export function StudentDashboard() {
  const { user } = useAuth()
  const data = mockDashboardData

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
          value={formatGPA(data.profile.cgpa)}
          icon={TrendingUp}
          description="Cumulative Grade Point Average"
        />
        <StatCard
          title="Semester"
          value={data.profile.currentSemester}
          icon={FileText}
          description="Current semester"
        />
        <StatCard
          title="Credits Earned"
          value={data.profile.totalCredits}
          icon={GraduationCap}
          description="Total credits completed"
        />
        <StatCard
          title="Share Links"
          value="3"
          icon={Share2}
          description="Active credential shares"
          href="/student/share"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Latest Result Card */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Latest Semester Result</CardTitle>
              <CardDescription>
                Semester {data.latestResult.semester} - {data.latestResult.academicYear}
              </CardDescription>
            </div>
            <StatusBadge status={data.latestResult.status} />
          </CardHeader>
          <CardContent>
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
                <p className="text-sm font-medium">{formatDate(data.latestResult.publishedAt!)}</p>
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
          </CardContent>
        </Card>

        {/* Degree Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Degree Status</CardTitle>
            <CardDescription>{data.degreeStatus.type} Certificate</CardDescription>
          </CardHeader>
          <CardContent>
            {data.degreeStatus.issued ? (
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
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Expected Date</p>
                  <p className="font-medium">{formatDate(data.degreeStatus.expectedDate!)}</p>
                </div>
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
            {data.announcements.map((announcement) => (
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
                <p className="text-xs text-muted-foreground mt-2">{formatDate(announcement.createdAt)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
