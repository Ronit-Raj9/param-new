"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Download, Filter, User, FileText, Shield, Settings, Clock } from "lucide-react"
import { format } from "date-fns"

interface LogEntry {
  id: string
  timestamp: Date
  user: string
  userRole: string
  action: string
  category: "auth" | "result" | "credential" | "admin" | "system"
  details: string
  ipAddress: string
}

const mockLogs: LogEntry[] = [
  {
    id: "1",
    timestamp: new Date("2026-01-10T14:30:00"),
    user: "admin@iiitm.ac.in",
    userRole: "Super Admin",
    action: "Published Results",
    category: "result",
    details: "Published Semester 6 results for BTech CSE 2023 batch",
    ipAddress: "192.168.1.100",
  },
  {
    id: "2",
    timestamp: new Date("2026-01-10T14:15:00"),
    user: "coe@iiitm.ac.in",
    userRole: "COE",
    action: "Approved Results",
    category: "result",
    details: "Approved Semester 6 results for verification",
    ipAddress: "192.168.1.105",
  },
  {
    id: "3",
    timestamp: new Date("2026-01-10T13:45:00"),
    user: "2021BCS001@iiitm.ac.in",
    userRole: "Student",
    action: "Generated Share Link",
    category: "credential",
    details: "Created verification link for Semester 5 results",
    ipAddress: "103.25.45.78",
  },
  {
    id: "4",
    timestamp: new Date("2026-01-10T12:00:00"),
    user: "registrar@iiitm.ac.in",
    userRole: "Data Entry",
    action: "Uploaded Student Data",
    category: "admin",
    details: "Imported 150 new students from CSV",
    ipAddress: "192.168.1.110",
  },
  {
    id: "5",
    timestamp: new Date("2026-01-10T11:30:00"),
    user: "admin@iiitm.ac.in",
    userRole: "Super Admin",
    action: "Login",
    category: "auth",
    details: "Successful login via OTP",
    ipAddress: "192.168.1.100",
  },
  {
    id: "6",
    timestamp: new Date("2026-01-10T10:00:00"),
    user: "system",
    userRole: "System",
    action: "Backup Completed",
    category: "system",
    details: "Daily automated backup completed successfully",
    ipAddress: "127.0.0.1",
  },
  {
    id: "7",
    timestamp: new Date("2026-01-09T16:30:00"),
    user: "verifier@company.com",
    userRole: "External",
    action: "Verified Credential",
    category: "credential",
    details: "Verified degree certificate for roll no 2020BCS045",
    ipAddress: "203.45.67.89",
  },
  {
    id: "8",
    timestamp: new Date("2026-01-09T15:00:00"),
    user: "admin@iiitm.ac.in",
    userRole: "Super Admin",
    action: "Updated Settings",
    category: "admin",
    details: "Modified email notification preferences",
    ipAddress: "192.168.1.100",
  },
]

const categoryConfig = {
  auth: { label: "Authentication", icon: Shield, color: "bg-blue-100 text-blue-700" },
  result: { label: "Results", icon: FileText, color: "bg-green-100 text-green-700" },
  credential: { label: "Credentials", icon: FileText, color: "bg-purple-100 text-purple-700" },
  admin: { label: "Admin", icon: Settings, color: "bg-orange-100 text-orange-700" },
  system: { label: "System", icon: Settings, color: "bg-slate-100 text-slate-700" },
}

export function AuditLogs() {
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")

  const filteredLogs = mockLogs.filter((log) => {
    const matchesSearch =
      log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === "all" || log.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">1,247</p>
                <p className="text-sm text-slate-500">Total Actions Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">342</p>
                <p className="text-sm text-slate-500">Auth Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">89</p>
                <p className="text-sm text-slate-500">Verifications</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Settings className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">15</p>
                <p className="text-sm text-slate-500">Admin Actions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-lg">Activity Log</CardTitle>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Logs
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by user, action, or details..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="auth">Authentication</SelectItem>
                <SelectItem value="result">Results</SelectItem>
                <SelectItem value="credential">Credentials</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full md:w-[150px]">
                <Clock className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Log Entries */}
          <div className="space-y-3">
            {filteredLogs.map((log) => {
              const config = categoryConfig[log.category]
              return (
                <div
                  key={log.id}
                  className="flex items-start gap-4 p-4 rounded-lg border border-slate-200 bg-slate-50/50"
                >
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${config.color}`}>
                    <config.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-slate-900">{log.action}</span>
                      <Badge variant="secondary" className="text-xs">
                        {config.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 mt-0.5">{log.details}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {log.user}
                      </span>
                      <span>{log.userRole}</span>
                      <span>IP: {log.ipAddress}</span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 whitespace-nowrap">
                    {format(log.timestamp, "MMM d, h:mm a")}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <p className="text-sm text-slate-500">
              Showing {filteredLogs.length} of {mockLogs.length} entries
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm">
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
