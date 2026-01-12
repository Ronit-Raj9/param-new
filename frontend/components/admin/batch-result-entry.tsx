"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useApi } from "@/hooks/use-api"
import { BATCHES, SEMESTERS, GRADES } from "@/lib/constants"
import { ArrowLeft, Loader2, Users } from "lucide-react"

interface Program {
    id: string
    code: string
    name: string
    shortName?: string
}

interface Course {
    id: string
    code: string
    name: string
    credits: number
}

interface Student {
    id: string
    enrollmentNumber: string
    name: string
}

interface StudentGrade {
    studentId: string
    enrollmentNumber: string
    name: string
    grade: string
    gradePoints: number
    internalMarks: number
    externalMarks: number
}

const gradePointsMap: Record<string, number> = {
    "A+": 10, "A": 9, "B+": 8, "B": 7, "C+": 6, "C": 5, "D": 4, "F": 0
}

export function BatchResultEntry() {
    const router = useRouter()
    const { toast } = useToast()
    const api = useApi()

    // Selection state
    const [programId, setProgramId] = useState("")
    const [batch, setBatch] = useState("")
    const [semester, setSemester] = useState("")
    const [academicYear, setAcademicYear] = useState(`${new Date().getFullYear()}-${new Date().getFullYear() + 1}`)
    const [courseId, setCourseId] = useState("")

    // Data state
    const [programs, setPrograms] = useState<Program[]>([])
    const [courses, setCourses] = useState<Course[]>([])
    const [students, setStudents] = useState<Student[]>([])
    const [studentGrades, setStudentGrades] = useState<StudentGrade[]>([])

    // Loading state
    const [isLoadingPrograms, setIsLoadingPrograms] = useState(true)
    const [isLoadingCourses, setIsLoadingCourses] = useState(false)
    const [isLoadingStudents, setIsLoadingStudents] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const selectedCourse = courses.find(c => c.id === courseId)

    // Fetch programs
    useEffect(() => {
        async function fetchPrograms() {
            if (!api.isReady) return
            try {
                const data = await api.get<{ success: boolean; data: Program[] }>("/v1/curriculum/programs")
                if (data.success) {
                    setPrograms(data.data || [])
                }
            } catch (err) {
                console.error("Error fetching programs:", err)
            } finally {
                setIsLoadingPrograms(false)
            }
        }
        fetchPrograms()
    }, [api.isReady])

    // Fetch courses when program/semester changes
    useEffect(() => {
        async function fetchCourses() {
            if (!api.isReady || !programId || !semester) {
                setCourses([])
                return
            }
            setIsLoadingCourses(true)
            try {
                const data = await api.get<{ success: boolean; data: Course[] }>(
                    `/v1/curriculum/courses?programId=${programId}&semester=${semester}`
                )
                if (data.success) {
                    setCourses(data.data || [])
                }
            } catch (err) {
                console.error("Error fetching courses:", err)
            } finally {
                setIsLoadingCourses(false)
            }
        }
        fetchCourses()
    }, [api.isReady, programId, semester])

    // Load students when all selections are made
    const loadStudents = async () => {
        if (!api.isReady || !programId || !batch) {
            return
        }

        setIsLoadingStudents(true)
        try {
            const data = await api.get<{ success: boolean; data: Student[] }>(
                `/v1/students?programId=${programId}&batch=${batch}&status=ACTIVE&limit=100`
            )
            if (data.success && data.data) {
                setStudents(data.data)
                // Initialize grades for all students
                setStudentGrades(data.data.map(s => ({
                    studentId: s.id,
                    enrollmentNumber: s.enrollmentNumber,
                    name: s.name,
                    grade: "",
                    gradePoints: 0,
                    internalMarks: 0,
                    externalMarks: 0,
                })))
            }
        } catch (err) {
            console.error("Error loading students:", err)
            toast({
                title: "Error",
                description: "Failed to load students",
                variant: "destructive",
            })
        } finally {
            setIsLoadingStudents(false)
        }
    }

    const updateStudentGrade = (index: number, field: keyof StudentGrade, value: string | number) => {
        const updated = [...studentGrades]
        if (field === "grade") {
            updated[index].grade = value as string
            updated[index].gradePoints = gradePointsMap[value as string] || 0
        } else if (field === "internalMarks") {
            updated[index].internalMarks = value as number
        } else if (field === "externalMarks") {
            updated[index].externalMarks = value as number
        }
        setStudentGrades(updated)
    }

    const fillAllWithGrade = (grade: string) => {
        setStudentGrades(studentGrades.map(sg => ({
            ...sg,
            grade,
            gradePoints: gradePointsMap[grade] || 0,
        })))
    }

    const handleSubmit = async () => {
        if (!courseId || studentGrades.length === 0) {
            toast({
                title: "Missing information",
                description: "Please select a course and load students",
                variant: "destructive",
            })
            return
        }

        const gradesWithData = studentGrades.filter(sg => sg.grade)
        if (gradesWithData.length === 0) {
            toast({
                title: "No grades entered",
                description: "Please enter at least one grade",
                variant: "destructive",
            })
            return
        }

        setIsSubmitting(true)
        try {
            // Use bulk upload format
            const payload = {
                semester: parseInt(semester),
                academicYear,
                programId,
                results: gradesWithData.map(sg => ({
                    enrollmentNumber: sg.enrollmentNumber,
                    courseCode: selectedCourse?.code || "",
                    grade: sg.grade,
                    gradePoints: sg.gradePoints,
                    internalMarks: sg.internalMarks || undefined,
                    externalMarks: sg.externalMarks || undefined,
                })),
            }

            const result = await api.post<{ success: boolean; data: { success: string[]; errors: { enrollmentNumber: string; error: string }[] } }>(
                "/v1/results/bulk",
                payload
            )

            if (result.success) {
                toast({
                    title: "Results saved",
                    description: `${result.data.success.length} results created successfully${result.data.errors.length > 0 ? `, ${result.data.errors.length} errors` : ""}`,
                })
                router.push("/admin/results/preview")
            }
        } catch (error) {
            console.error("Submit error:", error)
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to save results",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin/results/add">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Batch Result Entry</h1>
                    <p className="text-muted-foreground">Add results for multiple students, one course at a time</p>
                </div>
            </div>

            {/* Selection Panel */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Select Context</CardTitle>
                    <CardDescription>Choose program, batch, semester, and course</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                        <div className="space-y-2">
                            <Label>Program</Label>
                            <Select value={programId} onValueChange={setProgramId} disabled={isLoadingPrograms}>
                                <SelectTrigger>
                                    <SelectValue placeholder={isLoadingPrograms ? "Loading..." : "Select program"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {programs.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>{p.shortName || p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Batch</Label>
                            <Select value={batch} onValueChange={setBatch}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select batch" />
                                </SelectTrigger>
                                <SelectContent>
                                    {BATCHES.map((b) => (
                                        <SelectItem key={b} value={b}>{b}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Semester</Label>
                            <Select value={semester} onValueChange={setSemester}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select semester" />
                                </SelectTrigger>
                                <SelectContent>
                                    {SEMESTERS.map((s) => (
                                        <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Course</Label>
                            <Select value={courseId} onValueChange={setCourseId} disabled={isLoadingCourses || courses.length === 0}>
                                <SelectTrigger>
                                    <SelectValue placeholder={isLoadingCourses ? "Loading..." : "Select course"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {courses.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>{c.code} - {c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Academic Year</Label>
                            <Input
                                value={academicYear}
                                onChange={(e) => setAcademicYear(e.target.value)}
                                placeholder="2024-2025"
                            />
                        </div>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                        <Button
                            onClick={loadStudents}
                            disabled={!programId || !batch || isLoadingStudents}
                        >
                            {isLoadingStudents ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Loading...
                                </>
                            ) : (
                                <>
                                    <Users className="mr-2 h-4 w-4" />
                                    Load Students
                                </>
                            )}
                        </Button>
                        {studentGrades.length > 0 && (
                            <Badge variant="secondary">{studentGrades.length} students loaded</Badge>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Grades Entry */}
            {studentGrades.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg">Enter Grades</CardTitle>
                                <CardDescription>
                                    {selectedCourse ? `${selectedCourse.code} - ${selectedCourse.name} (${selectedCourse.credits} credits)` : "Select a course"}
                                </CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-sm text-muted-foreground mr-2">Quick fill:</span>
                                {["A+", "A", "B+", "B"].map((g) => (
                                    <Button key={g} variant="outline" size="sm" onClick={() => fillAllWithGrade(g)}>{g}</Button>
                                ))}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-muted">
                                    <tr>
                                        <th className="text-left p-3 text-sm font-medium">Enrollment</th>
                                        <th className="text-left p-3 text-sm font-medium">Student Name</th>
                                        <th className="text-center p-3 text-sm font-medium w-28">Grade</th>
                                        <th className="text-center p-3 text-sm font-medium w-20">Points</th>
                                        <th className="text-center p-3 text-sm font-medium w-24">Internal</th>
                                        <th className="text-center p-3 text-sm font-medium w-24">External</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {studentGrades.map((sg, index) => (
                                        <tr key={sg.studentId}>
                                            <td className="p-3 font-mono text-sm">{sg.enrollmentNumber}</td>
                                            <td className="p-3 text-sm">{sg.name}</td>
                                            <td className="p-3">
                                                <Select
                                                    value={sg.grade}
                                                    onValueChange={(val) => updateStudentGrade(index, "grade", val)}
                                                >
                                                    <SelectTrigger className="h-8">
                                                        <SelectValue placeholder="-" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {GRADES.map((g) => (
                                                            <SelectItem key={g} value={g}>{g}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </td>
                                            <td className="p-3 text-center text-sm font-medium">
                                                {sg.gradePoints || "-"}
                                            </td>
                                            <td className="p-3">
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={sg.internalMarks || ""}
                                                    onChange={(e) => updateStudentGrade(index, "internalMarks", parseInt(e.target.value) || 0)}
                                                    className="h-8 text-center"
                                                />
                                            </td>
                                            <td className="p-3">
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={sg.externalMarks || ""}
                                                    onChange={(e) => updateStudentGrade(index, "externalMarks", parseInt(e.target.value) || 0)}
                                                    className="h-8 text-center"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Summary */}
                        <div className="mt-4 flex items-center justify-between p-4 bg-muted rounded-lg">
                            <div className="flex gap-6 text-sm">
                                <span>Filled: <strong>{studentGrades.filter(sg => sg.grade).length}</strong> / {studentGrades.length}</span>
                                <span>Pending: <strong>{studentGrades.filter(sg => !sg.grade).length}</strong></span>
                            </div>
                        </div>

                        {/* Actions */}
                        <Separator className="my-6" />
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => router.back()} className="bg-transparent">
                                Cancel
                            </Button>
                            <div className="flex-1" />
                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !courseId || studentGrades.filter(sg => sg.grade).length === 0}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    `Save ${studentGrades.filter(sg => sg.grade).length} Results`
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
