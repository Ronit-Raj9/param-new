"use client"

import { useState } from "react"
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
import { Search, Plus, MoreHorizontal, Edit, UserX, UserCheck, Trash2 } from "lucide-react"
import type { UserRole } from "@/types"

interface UserRecord {
  id: string
  name: string
  email: string
  role: UserRole
  isActive: boolean
  lastLogin?: string
  createdAt: string
}

// Mock data
const mockUsers: UserRecord[] = [
  {
    id: "1",
    name: "Dr. Amit Kumar",
    email: "amit.kumar@iiitm.ac.in",
    role: "ADMIN",
    isActive: true,
    lastLogin: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    createdAt: "2022-01-15T00:00:00Z",
  },
  {
    id: "2",
    name: "Prof. Meena Sharma",
    email: "meena.sharma@iiitm.ac.in",
    role: "ACADEMIC",
    isActive: true,
    lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    createdAt: "2022-03-20T00:00:00Z",
  },
  {
    id: "3",
    name: "Dr. Raj Singh",
    email: "raj.singh@iiitm.ac.in",
    role: "ACADEMIC",
    isActive: true,
    lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    createdAt: "2022-06-10T00:00:00Z",
  },
  {
    id: "4",
    name: "Rahul Sharma",
    email: "rahul.sharma@iiitm.ac.in",
    role: "STUDENT",
    isActive: true,
    lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    createdAt: "2020-08-01T00:00:00Z",
  },
  {
    id: "5",
    name: "Priya Patel",
    email: "priya.patel@iiitm.ac.in",
    role: "STUDENT",
    isActive: false,
    createdAt: "2021-08-01T00:00:00Z",
  },
]

const roleColors: Record<UserRole, string> = {
  ADMIN: "bg-primary text-primary-foreground",
  ACADEMIC: "bg-info text-info-foreground",
  STUDENT: "bg-secondary text-secondary-foreground",
}

export function UsersManagement() {
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [showCreateModal, setShowCreateModal] = useState(false)

  const debouncedSearch = useDebounce(search, 300)

  const filteredUsers = mockUsers.filter((user) => {
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

          {/* Table */}
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
                        variant={user.isActive ? "default" : "secondary"}
                        className={user.isActive ? "bg-success" : ""}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.lastLogin ? formatRelativeTime(user.lastLogin) : "Never"}
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
                            {user.isActive ? (
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
        </CardContent>
      </Card>

      <CreateUserModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </>
  )
}
