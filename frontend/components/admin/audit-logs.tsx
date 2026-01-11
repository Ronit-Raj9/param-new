"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useApi } from "@/hooks/use-api"
import { Search, Download, Filter, User, FileText, Shield, Settings, Clock, Loader2, History } from "lucide-react"
import { format } from "date-fns"

interface LogEntry {
  id: string
  timestamp: string
  user: string
  userRole: string
  action: string
  category: "auth" | "result" | "credential" | "admin" | "system"
  details: string
  ipAddress: string
}

interface AuditStats {
  totalToday: number
  authEvents: number
  verifications: number
  adminActions: number
}

const categoryConfig = {
  auth: { label: "Authentication", icon: Shield, color: "bg-blue-100 text-blue-700" },
  result: { label: "Results", icon: FileText, color: "bg-green-100 text-green-700" },
  credential: { label: "Credentials", icon: FileText, color: "bg-purple-100 text-purple-700" },
  admin: { label: "Admin", icon: Settings, color: "bg-orange-100 text-orange-700" },
  system: { label: "System", icon: Settings, color: "bg-slate-100 text-slate-700" },
}

export function AuditLogs() {
  const api = useApi()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [stats, setStats] = useState<AuditStats>({ totalToday: 0, authEvents: 0, verifications: 0, adminActions: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)

  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")

  // Fetch audit logs
  const fetchLogs = useCallback(async () => {
    if (!api.isReady) return
    
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (categoryFilter !== "all") params.set("category", categoryFilter)
      if (dateFilter !== "all") params.set("dateRange", dateFilter)
      params.set("page", page.toString())
      params.set("limit", "20")

      const data = await api.get<{ success: boolean; data: { logs?: LogEntry[]; pagination?: { total: number } } }>(
        `/v1/audit/logs?${params.toString()}`
      )

      if (data.success) {
        setLogs(data.data.logs || [])
        setTotalCount(data.data.pagination?.total || 0)
      }
    } catch (err) {
      console.error("Error fetching audit logs:", err)
      setLogs([])
    } finally {
      setIsLoading(false)
    }
  }, [api, search, categoryFilter, dateFilter, page])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // Fetch stats
  useEffect(() => {
    async function fetchStats() {
      if (!api.isReady) return
      
      try {
        const data = await api.get<{ success: boolean; data: AuditStats }>("/v1/audit/stats")
        if (data.success) {
          setStats(data.data)
        }
      } catch (err) {
        console.error("Error fetching audit stats:", err)
      }
    }

    fetchStats()
  }, [api.isReady])

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
                <p className="text-2xl font-bold">{stats.totalToday}</p>
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
                <p className="text-2xl font-bold">{stats.authEvents}</p>
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
                <p className="text-2xl font-bold">{stats.verifications}</p>
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
                <p className="text-2xl font-bold">{stats.adminActions}</p>
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

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Empty State */}
          {!isLoading && logs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <History className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No audit logs found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {search || categoryFilter !== "all" ? "Try adjusting your filters" : "Activity logs will appear here"}
              </p>
            </div>
          )}

          {/* Log Entries */}
          {!isLoading && logs.length > 0 && (
            <>
              <div className="space-y-3">
                {logs.map((log) => {
                  const config = categoryConfig[log.category] || categoryConfig.system
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
                        {format(new Date(log.timestamp), "MMM d, h:mm a")}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <p className="text-sm text-slate-500">
                  Showing {logs.length} of {totalCount} entries
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={logs.length < 20}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
