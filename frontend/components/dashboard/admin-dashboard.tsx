"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatCard } from "@/components/dashboard/stat-card"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { useAuth } from "@/providers/auth-provider"
import { Users, FileText, Award, AlertCircle, Upload, CheckSquare, BookOpen, ScrollText } from "lucide-react"
import Link from "next/link"

// Mock data
const mockStats = {
  totalStudents: 2450,
  resultsPublished: 156,
  credentialsIssued: 89,
  activeShareLinks: 234,
  pendingApprovals: 5,
  pendingCorrections: 2,
}

const quickActions = [
  { title: "Upload Results", icon: Upload, href: "/admin/results/upload" },
  { title: "Review Approvals", icon: CheckSquare, href: "/admin/approve", badge: 5 },
  { title: "Manage Curriculum", icon: BookOpen, href: "/admin/curriculum" },
  { title: "View Logs", icon: ScrollText, href: "/admin/logs" },
]

export function AdminDashboard() {
  const { user } = useAuth()

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
      {(mockStats.pendingApprovals > 0 || mockStats.pendingCorrections > 0) && (
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
              <AlertCircle className="h-5 w-5 text-warning" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Pending Actions Required</h3>
              <p className="text-sm text-muted-foreground">
                {mockStats.pendingApprovals} results awaiting approval, {mockStats.pendingCorrections} correction
                requests
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
          value={mockStats.totalStudents.toLocaleString()}
          icon={Users}
          description="Enrolled students"
          href="/admin/students"
        />
        <StatCard
          title="Results Published"
          value={mockStats.resultsPublished}
          icon={FileText}
          description="This semester"
          href="/admin/results/upload"
        />
        <StatCard
          title="Credentials Issued"
          value={mockStats.credentialsIssued}
          icon={Award}
          description="This month"
          href="/admin/issuance"
        />
        <StatCard
          title="Pending Approvals"
          value={mockStats.pendingApprovals}
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
                  {action.badge && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                    >
                      {action.badge}
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
            <ActivityFeed />
          </CardContent>
        </Card>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Results Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Results Overview</CardTitle>
            <CardDescription>Current semester status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: "Published", value: 156, total: 200, color: "bg-success" },
                { label: "Pending Approval", value: 5, total: 200, color: "bg-warning" },
                { label: "Draft", value: 39, total: 200, color: "bg-muted" },
              ].map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{item.label}</span>
                    <span className="font-medium">
                      {item.value} / {item.total}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full ${item.color} transition-all`}
                      style={{ width: `${(item.value / item.total) * 100}%` }}
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
                <p className="text-sm text-muted-foreground">Degrees Issued</p>
                <p className="text-3xl font-bold text-primary">89</p>
                <p className="text-xs text-muted-foreground mt-1">This year</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Verifications</p>
                <p className="text-3xl font-bold">1,234</p>
                <p className="text-xs text-muted-foreground mt-1">Total checks</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Active Links</p>
                <p className="text-3xl font-bold">234</p>
                <p className="text-xs text-muted-foreground mt-1">Share links</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-3xl font-bold text-warning">12</p>
                <p className="text-xs text-muted-foreground mt-1">Degree proposals</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
