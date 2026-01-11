"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CreateUserModal } from "@/components/modals/create-user-modal"
import { formatDate, formatRelativeTime } from "@/lib/format"
import { useDebounce } from "@/hooks/use-debounce"
import { useApi } from "@/hooks/use-api"
import { Search, Plus, MoreHorizontal, Edit, UserX, UserCheck, Trash2, Loader2, Users } from "lucide-react"
import type { UserRole, UserStatus } from "@/types"

interface UserRecord {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  lastLoginAt?: string
  createdAt: string
}

const roleColors: Record<UserRole, string> = {
  ADMIN: "bg-primary text-primary-foreground",
  ACADEMIC: "bg-info text-info-foreground",
  STUDENT: "bg-secondary text-secondary-foreground",
  VERIFIER: "bg-warning text-warning-foreground",
}

export function UsersManagement() {
  const api = useApi()
  const [users, setUsers] = useState<UserRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [showCreateModal, setShowCreateModal] = useState(false)

  const debouncedSearch = useDebounce(search, 300)

  const fetchUsers = useCallback(async () => {
    if (!api.isReady) return
    
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (debouncedSearch) params.set("search", debouncedSearch)
      if (roleFilter !== "all") params.set("role", roleFilter)
      
      const data = await api.get<{ success: boolean; data: { users?: UserRecord[] } | UserRecord[] }>(
        `/v1/users?${params.toString()}`
      )
      
      if (data.success) {
        const usersData = Array.isArray(data.data) ? data.data : (data.data.users || [])
        setUsers(usersData)
      }
    } catch (err) {
      console.error("Error fetching users:", err)
      setUsers([])
    } finally {
      setIsLoading(false)
    }
  }, [api, debouncedSearch, roleFilter])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      user.email.toLowerCase().includes(debouncedSearch.toLowerCase())
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create User
          </Button>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="ACADEMIC">Academic</SelectItem>
                <SelectItem value="STUDENT">Student</SelectItem>
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
          {!isLoading && filteredUsers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No users found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {search || roleFilter !== "all" 
                  ? "Try adjusting your filters" 
                  : "Create your first user to get started"}
              </p>
              <Button className="mt-4" onClick={() => setShowCreateModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create User
              </Button>
            </div>
          )}

          {/* Table */}
          {!isLoading && filteredUsers.length > 0 && (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell className="text-sm">{user.email}</TableCell>
                      <TableCell>
                        <Badge className={roleColors[user.role]}>{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.status === "ACTIVE" ? "default" : "secondary"}
                          className={user.status === "ACTIVE" ? "bg-success" : ""}
                        >
                          {user.status === "ACTIVE" ? "Active" : user.status === "SUSPENDED" ? "Suspended" : user.status === "PENDING_ACTIVATION" ? "Pending" : "Deactivated"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.lastLoginAt ? formatRelativeTime(user.lastLoginAt) : "Never"}
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(user.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              {user.status === "ACTIVE" ? (
                                <>
                                  <UserX className="mr-2 h-4 w-4" />
                                  Suspend
                                </>
                              ) : (
                                <>
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateUserModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </>
  )
}
