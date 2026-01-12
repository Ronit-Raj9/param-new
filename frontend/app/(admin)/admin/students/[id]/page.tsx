"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { StatusBadge } from "@/components/status/status-badge"
import { PageLoader } from "@/components/shared/loading-spinner"
import { useApi } from "@/hooks/use-api"
import { formatGPA } from "@/lib/format"
import { ArrowLeft, Mail, Phone, Calendar, MapPin, User, GraduationCap, BookOpen, Award } from "lucide-react"
import type { Student } from "@/types"

interface StudentDetailData extends Student {
    user?: {
        id: string
        email: string
        status: string
        lastLoginAt?: string
    }
    walletAddress?: string
    admissionYear?: number
    expectedGradYear?: number
    guardianName?: string
    guardianPhone?: string
}

export default function StudentDetailPage() {
    const params = useParams()
    const router = useRouter()
    const api = useApi()
    const [student, setStudent] = useState<StudentDetailData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const studentId = params.id as string

    useEffect(() => {
        async function fetchStudent() {
            if (!api.isReady || !studentId) return

            try {
                setIsLoading(true)
                const data = await api.get<{ success: boolean; data: StudentDetailData }>(
                    `/v1/students/${studentId}`
                )

                if (data.success && data.data) {
                    setStudent(data.data)
                } else {
                    setError("Student not found")
                }
            } catch (err) {
                console.error("Error fetching student:", err)
                setError(err instanceof Error ? err.message : "Failed to load student details")
            } finally {
                setIsLoading(false)
            }
        }

        fetchStudent()
    }, [api.isReady, studentId])

    if (isLoading) {
        return <PageLoader />
    }

    if (error || !student) {
        return (
            <div className="space-y-6">
                <Button variant="ghost" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <User className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">Student Not Found</h3>
                        <p className="text-sm text-muted-foreground mt-1">{error || "The requested student could not be found."}</p>
                        <Button className="mt-4" onClick={() => router.push("/admin/students")}>
                            Back to Student Registry
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const programName = typeof student.program === "object" ? student.program.name : student.program

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{student.name}</h1>
                        <p className="text-muted-foreground">{student.enrollmentNumber}</p>
                    </div>
                </div>
                <StatusBadge status={student.status} />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Basic Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Personal Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Email</p>
                                <p className="font-medium">{student.email}</p>
                            </div>
                        </div>
                        {student.phone && (
                            <div className="flex items-center gap-3">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Phone</p>
                                    <p className="font-medium">{student.phone}</p>
                                </div>
                            </div>
                        )}
                        {student.dateOfBirth && (
                            <div className="flex items-center gap-3">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Date of Birth</p>
                                    <p className="font-medium">{new Date(student.dateOfBirth).toLocaleDateString()}</p>
                                </div>
                            </div>
                        )}
                        {student.address && (
                            <div className="flex items-center gap-3">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Address</p>
                                    <p className="font-medium">{student.address}</p>
                                </div>
                            </div>
                        )}
                        {student.guardianName && (
                            <Separator />
                        )}
                        {student.guardianName && (
                            <div>
                                <p className="text-sm text-muted-foreground">Guardian</p>
                                <p className="font-medium">{student.guardianName}</p>
                                {student.guardianPhone && (
                                    <p className="text-sm text-muted-foreground">{student.guardianPhone}</p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Academic Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <GraduationCap className="h-5 w-5" />
                            Academic Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Program</p>
                                <p className="font-medium">{programName || "-"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Batch</p>
                                <p className="font-medium">{student.batch}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Current Semester</p>
                                <p className="font-medium">{student.currentSemester || "-"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">CGPA</p>
                                <p className="font-medium text-lg">{student.cgpa ? formatGPA(student.cgpa) : "-"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Credits</p>
                                <p className="font-medium">{student.totalCredits || 0}</p>
                            </div>
                            {student.admissionYear && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Admission Year</p>
                                    <p className="font-medium">{student.admissionYear}</p>
                                </div>
                            )}
                            {student.expectedGradYear && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Expected Graduation</p>
                                    <p className="font-medium">{student.expectedGradYear}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Account Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5" />
                            Account Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Account Status</p>
                                <Badge variant={student.user?.status === "ACTIVE" ? "default" : "secondary"}>
                                    {student.user?.status || student.status}
                                </Badge>
                            </div>
                            {student.user?.lastLoginAt && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Last Login</p>
                                    <p className="font-medium text-sm">
                                        {new Date(student.user.lastLoginAt).toLocaleString()}
                                    </p>
                                </div>
                            )}
                        </div>
                        {student.walletAddress && (
                            <div>
                                <p className="text-sm text-muted-foreground">Wallet Address</p>
                                <p className="font-mono text-xs break-all">{student.walletAddress}</p>
                            </div>
                        )}
                        <div>
                            <p className="text-sm text-muted-foreground">Created At</p>
                            <p className="font-medium text-sm">{new Date(student.createdAt).toLocaleString()}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Award className="h-5 w-5" />
                            Quick Actions
                        </CardTitle>
                        <CardDescription>Manage student records and credentials</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button variant="outline" className="w-full justify-start" asChild>
                            <Link href={`/admin/results?student=${student.id}`}>
                                View Results
                            </Link>
                        </Button>
                        <Button variant="outline" className="w-full justify-start" asChild>
                            <Link href={`/admin/issuance?student=${student.id}`}>
                                Issue Credentials
                            </Link>
                        </Button>
                        <Button variant="outline" className="w-full justify-start" asChild>
                            <Link href={`/admin/corrections?student=${student.id}`}>
                                Corrections History
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
