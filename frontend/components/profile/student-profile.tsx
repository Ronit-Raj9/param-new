"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { StatusBadge } from "@/components/status/status-badge"
import { useAuth } from "@/providers/auth-provider"
import { formatDate, formatGPA } from "@/lib/format"

// Mock data
const mockStudentData = {
  id: "1",
  enrollmentNumber: "2020BCS001",
  name: "Rahul Sharma",
  email: "rahul.sharma@iiitm.ac.in",
  program: "B.Tech Computer Science & Engineering",
  programId: "btech-cse",
  batch: "2020-2024",
  currentSemester: 8,
  cgpa: 8.75,
  totalCredits: 176,
  status: "ACTIVE" as const,
  dateOfBirth: "2002-05-15",
  phone: "+91 98765 43210",
  address: "123 Main Street, Gwalior, MP 474001",
  admissionDate: "2020-08-01",
  createdAt: "2020-08-01T00:00:00Z",
  updatedAt: "2024-01-15T00:00:00Z",
}

export function StudentProfile() {
  const { user } = useAuth()
  const student = mockStudentData

  const initials = student.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Profile Card */}
      <Card className="lg:col-span-1">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage src="/placeholder.svg" alt={student.name} />
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">{initials}</AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-semibold">{student.name}</h2>
            <p className="text-muted-foreground font-mono">{student.enrollmentNumber}</p>
            <div className="mt-2">
              <StatusBadge status={student.status} />
            </div>
            <Separator className="my-4 w-full" />
            <div className="w-full space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium truncate max-w-[180px]">{student.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone</span>
                <span className="font-medium">{student.phone}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Cards */}
      <div className="lg:col-span-2 space-y-6">
        {/* Academic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Academic Information</CardTitle>
            <CardDescription>Your program and academic details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Program</p>
                <p className="font-medium">{student.program}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Batch</p>
                <p className="font-medium">{student.batch}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Semester</p>
                <p className="font-medium">Semester {student.currentSemester}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Admission Date</p>
                <p className="font-medium">{formatDate(student.admissionDate)}</p>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">CGPA</p>
                <p className="text-2xl font-bold text-primary">{formatGPA(student.cgpa)}</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Credits Earned</p>
                <p className="text-2xl font-bold">{student.totalCredits}</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Semesters</p>
                <p className="text-2xl font-bold">{student.currentSemester}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Your personal details on record</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="font-medium">{student.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date of Birth</p>
                <p className="font-medium">{formatDate(student.dateOfBirth!)}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{student.address}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your PARAM account details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Account Created</span>
                <span>{formatDate(student.createdAt)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Last Updated</span>
                <span>{formatDate(student.updatedAt)}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              To update your personal information, please contact the academic office.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
