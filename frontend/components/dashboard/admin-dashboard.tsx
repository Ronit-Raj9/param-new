"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatCard } from "@/components/dashboard/stat-card"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { useAuth } from "@/providers/auth-provider"
import { useApi } from "@/hooks/use-api"
import { Users, FileText, Award, AlertCircle, Upload, CheckSquare, BookOpen, ScrollText, Loader2 } from "lucide-react"
import Link from "next/link"

interface DashboardStats {
  stats: {
    totalStudents: number
    activeStudents: number
    resultsPublished: number
    credentialsIssued: number
    activeShares: number
  }
  pendingActions: {
    results: number
    degrees: number
    corrections: number
  }
  recentActivity: Array<{
    id: string
    action: string
    entityType: string
    createdAt: string
    actor?: { name: string; email: string }
  }>
}

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
}

const quickActions = [
  { title: "Upload Results", icon: Upload, href: "/admin/results/upload" },
  { title: "Review Approvals", icon: CheckSquare, href: "/admin/approve", badgeKey: "pendingApprovals" as const },
  { title: "Manage Curriculum", icon: BookOpen, href: "/admin/curriculum" },
  { title: "View Logs", icon: ScrollText, href: "/admin/logs" },
]

export function AdminDashboard() {
  const { user } = useAuth()
  const api = useApi()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!api.isReady) return

    async function fetchDashboardStats() {
      try {
        setIsLoading(true)
        const data = await api.get<ApiResponse<DashboardStats>>("/dashboard/admin/stats")
        
        if (data.success) {
          setStats(data.data ?? null)
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err)
        setError("Failed to load dashboard data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardStats()
  }, [api.isReady])

  const totalPending = stats ? stats.pendingActions.results + stats.pendingActions.degrees + stats.pendingActions.corrections : 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name || "Administrator"}</p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline" className="bg-transparent">
            <Link href="/admin/students/upload">Upload Students</Link>
          </Button>
          <Button asChild>
            <Link href="/admin/results/upload">Upload Results</Link>
          </Button>
        </div>
      </div>

      {/* Pending Actions Alert */}
      {totalPending > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
              <AlertCircle className="h-5 w-5 text-warning" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Pending Actions Required</h3>
              <p className="text-sm text-muted-foreground">
                {stats?.pendingActions.results || 0} results, {stats?.pendingActions.degrees || 0} degree proposals, {stats?.pendingActions.corrections || 0} corrections
              </p>
            </div>
            <Button asChild size="sm">
              <Link href="/admin/approve">Review Now</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Students"
          value={stats?.stats.totalStudents?.toLocaleString() || "0"}
          icon={Users}
          description="Enrolled students"
          href="/admin/students"
        />
        <StatCard
          title="Results Published"
          value={stats?.stats.resultsPublished || 0}
          icon={FileText}
          description="Total published"
          href="/admin/results/upload"
        />
        <StatCard
          title="Credentials Issued"
          value={stats?.stats.credentialsIssued || 0}
          icon={Award}
          description="Total issued"
          href="/admin/issuance"
        />
        <StatCard
          title="Pending Approvals"
          value={totalPending}
          icon={CheckSquare}
          description="Requires attention"
          href="/admin/approve"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <Button
                key={action.title}
                asChild
                variant="outline"
                className="h-auto py-4 flex-col items-center gap-2 relative bg-transparent"
              >
                <Link href={action.href}>
                  <action.icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{action.title}</span>
                  {action.badgeKey === "pendingApprovals" && totalPending > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                    >
                      {totalPending}
                    </Badge>
                  )}
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <CardDescription>Latest system activities and changes</CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityFeed activities={stats?.recentActivity || []} />
          </CardContent>
        </Card>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Results Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Results Overview</CardTitle>
            <CardDescription>Current status summary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: "Published", value: stats?.stats.resultsPublished || 0, color: "bg-success" },
                { label: "Pending Approval", value: stats?.pendingActions.results || 0, color: "bg-warning" },
              ].map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{item.label}</span>
                    <span className="font-medium">{item.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full ${item.color} transition-all`}
                      style={{ width: item.value > 0 ? "100%" : "0%" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Credential Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Credentials Status</CardTitle>
            <CardDescription>Issuance and verification summary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Credentials Issued</p>
                <p className="text-3xl font-bold text-primary">{stats?.stats.credentialsIssued || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Total</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Active Students</p>
                <p className="text-3xl font-bold">{stats?.stats.activeStudents || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Currently enrolled</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Active Share Links</p>
                <p className="text-3xl font-bold">{stats?.stats.activeShares || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Shared credentials</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Pending Degrees</p>
                <p className="text-3xl font-bold text-warning">{stats?.pendingActions.degrees || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
