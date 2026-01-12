"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { StatusBadge } from "@/components/status/status-badge"
import { useAuth } from "@/providers/auth-provider"
import { useApi } from "@/hooks/use-api"
import { formatDate, formatGPA } from "@/lib/format"
import { Loader2, UserCircle } from "lucide-react"

interface StudentData {
  id: string
  enrollmentNumber: string
  name: string
  email: string
  program: string | { id: string; name: string; code: string; shortName?: string }
  programId: string
  batch: string
  currentSemester: number
  cgpa: number | null
  totalCredits: number
  status: string
  dateOfBirth: string | null
  phone: string | null
  address: string | null
  admissionDate: string | null
  createdAt: string
  updatedAt: string
}

export function StudentProfile() {
  const { user } = useAuth()
  const api = useApi()
  const [student, setStudent] = useState<StudentData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchProfile() {
      if (!api.isReady) return

      try {
        setIsLoading(true)
        const data = await api.get<{ success: boolean; data: StudentData }>("/v1/students/me")

        if (data.success) {
          setStudent(data.data)
        }
      } catch (err) {
        console.error("Error fetching profile:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [api.isReady])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <UserCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">Profile not found</h3>
        <p className="text-sm text-muted-foreground mt-1">Unable to load your profile data</p>
      </div>
    )
  }

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
              {student.phone && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-medium">{student.phone}</span>
                </div>
              )}
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
                <p className="font-medium">
                  {typeof student.program === "object" && student.program !== null
                    ? student.program.name || student.program.shortName
                    : student.program}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Batch</p>
                <p className="font-medium">{student.batch}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Semester</p>
                <p className="font-medium">Semester {student.currentSemester || "-"}</p>
              </div>
              {student.admissionDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Admission Date</p>
                  <p className="font-medium">{formatDate(student.admissionDate)}</p>
                </div>
              )}
            </div>
            <Separator className="my-4" />
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">CGPA</p>
                <p className="text-2xl font-bold text-primary">
                  {student.cgpa ? formatGPA(student.cgpa) : "-"}
                </p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Credits Earned</p>
                <p className="text-2xl font-bold">{student.totalCredits || 0}</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-2xl font-bold">{student.status}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Your personal details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {student.dateOfBirth && (
                <div>
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">{formatDate(student.dateOfBirth)}</p>
                </div>
              )}
              {student.address && (
                <div className="sm:col-span-2">
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{student.address}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Account Created</p>
                <p className="font-medium">{formatDate(student.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">{formatDate(student.updatedAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
