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
import { SEMESTERS, GRADES } from "@/lib/constants"
import { ArrowLeft, Loader2, Search, Plus, Trash2, User } from "lucide-react"

interface Student {
    id: string
    enrollmentNumber: string
    name: string
    email: string
    program: { id: string; name: string; code: string }
    batch: string
    currentSemester: number
}

interface Course {
    id: string
    code: string
    name: string
    credits: number
}

interface CourseResult {
    courseId: string
    courseCode: string
    courseName: string
    credits: number
    grade: string
    gradePoints: number
    internalMarks: number
    externalMarks: number
}

const gradePointsMap: Record<string, number> = {
    "A+": 10, "A": 9, "B+": 8, "B": 7, "C+": 6, "C": 5, "D": 4, "F": 0
}

export function SingleStudentResult() {
    const router = useRouter()
    const { toast } = useToast()
    const api = useApi()

    // Search state
    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState<Student[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

    // Form state
    const [semester, setSemester] = useState("")
    const [academicYear, setAcademicYear] = useState(`${new Date().getFullYear()}-${new Date().getFullYear() + 1}`)
    const [courseResults, setCourseResults] = useState<CourseResult[]>([])
    const [availableCourses, setAvailableCourses] = useState<Course[]>([])
    const [isLoadingCourses, setIsLoadingCourses] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Search for students
    useEffect(() => {
        const searchStudents = async () => {
            if (!api.isReady || searchQuery.length < 2) {
                setSearchResults([])
                return
            }

            setIsSearching(true)
            try {
                const data = await api.get<{ success: boolean; data: Student[] }>(
                    `/v1/students?search=${encodeURIComponent(searchQuery)}&limit=10`
                )
                if (data.success) {
                    setSearchResults(data.data || [])
                }
            } catch (err) {
                console.error("Search error:", err)
            } finally {
                setIsSearching(false)
            }
        }

        const debounce = setTimeout(searchStudents, 300)
        return () => clearTimeout(debounce)
    }, [searchQuery, api.isReady])

    // Load courses when semester is selected
    useEffect(() => {
        const loadCourses = async () => {
            if (!api.isReady || !selectedStudent || !semester) {
                setAvailableCourses([])
                return
            }

            setIsLoadingCourses(true)
            try {
                // Build URL with only non-empty params
                const params = new URLSearchParams()
                if (selectedStudent.program?.id) {
                    params.append("programId", selectedStudent.program.id)
                }
                if (semester) {
                    params.append("semester", semester)
                }
                
                const url = `/v1/curriculum/courses?${params.toString()}`
                console.log("Fetching courses from:", url)
                
                const data = await api.get<{ success: boolean; data: Course[] }>(url)
                if (data.success && data.data) {
                    // Transform the response to match Course interface
                    const courses = data.data.map((c: any) => ({
                        id: c.id,
                        code: c.code,
                        name: c.name,
                        credits: c.credits,
                    }))
                    setAvailableCourses(courses)
                }
            } catch (err) {
                console.error("Error loading courses:", err)
                setAvailableCourses([])
            } finally {
                setIsLoadingCourses(false)
            }
        }

        loadCourses()
    }, [selectedStudent, semester, api.isReady])

    const selectStudent = (student: Student) => {
        setSelectedStudent(student)
        setSearchQuery("")
        setSearchResults([])
        setCourseResults([])
    }

    const addCourse = (course: Course) => {
        // Check if already added
        if (courseResults.some(cr => cr.courseId === course.id)) {
            toast({ title: "Course already added", variant: "destructive" })
            return
        }

        setCourseResults([...courseResults, {
            courseId: course.id,
            courseCode: course.code,
            courseName: course.name,
            credits: course.credits,
            grade: "",
            gradePoints: 0,
            internalMarks: 0,
            externalMarks: 0,
        }])
    }

    const updateCourseResult = (index: number, field: keyof CourseResult, value: string | number) => {
        const updated = [...courseResults]
        if (field === "grade") {
            updated[index].grade = value as string
            updated[index].gradePoints = gradePointsMap[value as string] || 0
        } else if (field === "internalMarks") {
            updated[index].internalMarks = value as number
        } else if (field === "externalMarks") {
            updated[index].externalMarks = value as number
        }
        setCourseResults(updated)
    }

    const removeCourse = (index: number) => {
        setCourseResults(courseResults.filter((_, i) => i !== index))
    }

    const handleSubmit = async (asDraft: boolean = true) => {
        if (!selectedStudent || !semester || courseResults.length === 0) {
            toast({
                title: "Missing information",
                description: "Please select student, semester, and add at least one course result",
                variant: "destructive",
            })
            return
        }

        // Validate all courses have grades
        const incompleteResults = courseResults.filter(cr => !cr.grade)
        if (incompleteResults.length > 0) {
            toast({
                title: "Incomplete data",
                description: "Please enter grades for all courses",
                variant: "destructive",
            })
            return
        }

        setIsSubmitting(true)
        try {
            const payload = {
                studentId: selectedStudent.id,
                semester: parseInt(semester),
                academicYear,
                courseResults: courseResults.map(cr => ({
                    courseId: cr.courseId,
                    grade: cr.grade,
                    gradePoints: cr.gradePoints,
                    internalMarks: cr.internalMarks || undefined,
                    externalMarks: cr.externalMarks || undefined,
                })),
            }

            const result = await api.post<{ success: boolean; data: { id: string } }>("/v1/results", payload)

            if (result.success) {
                toast({
                    title: "Result saved",
                    description: `Semester ${semester} result created for ${selectedStudent.name}`,
                })
                router.push("/admin/results/preview")
            }
        } catch (error) {
            console.error("Submit error:", error)
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to save result",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const calculateSGPA = () => {
        const totalCredits = courseResults.reduce((sum, cr) => sum + cr.credits, 0)
        const weightedPoints = courseResults.reduce((sum, cr) => sum + (cr.gradePoints * cr.credits), 0)
        return totalCredits > 0 ? (weightedPoints / totalCredits).toFixed(2) : "-"
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
                    <h1 className="text-2xl font-bold tracking-tight">Add Result - Single Student</h1>
                    <p className="text-muted-foreground">Add semester results for one student</p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Panel - Student Selection */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-lg">Select Student</CardTitle>
                        <CardDescription>Search by name or enrollment number</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {!selectedStudent ? (
                            <>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search students..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>

                                {isSearching && (
                                    <div className="flex items-center justify-center py-4">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    </div>
                                )}

                                {searchResults.length > 0 && (
                                    <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                                        {searchResults.map((student) => (
                                            <button
                                                key={student.id}
                                                onClick={() => selectStudent(student)}
                                                className="w-full p-3 text-left hover:bg-muted transition-colors"
                                            >
                                                <p className="font-medium">{student.name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {student.enrollmentNumber} • {student.program.code} • {student.batch}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-4">No students found</p>
                                )}
                            </>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                        <User className="h-6 w-6 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold truncate">{selectedStudent.name}</p>
                                        <p className="text-sm text-muted-foreground">{selectedStudent.enrollmentNumber}</p>
                                        <Badge variant="outline" className="mt-1">{selectedStudent.program.code}</Badge>
                                    </div>
                                </div>
                                <Button variant="outline" onClick={() => setSelectedStudent(null)} className="w-full bg-transparent">
                                    Change Student
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Right Panel - Course Entry */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg">Course Results</CardTitle>
                        <CardDescription>Enter grades for each course</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Semester & Year Selection */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Semester</Label>
                                <Select value={semester} onValueChange={setSemester} disabled={!selectedStudent}>
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
                                <Label>Academic Year</Label>
                                <Input
                                    value={academicYear}
                                    onChange={(e) => setAcademicYear(e.target.value)}
                                    placeholder="2024-2025"
                                    disabled={!selectedStudent}
                                />
                            </div>
                        </div>

                        <Separator />

                        {/* Add Course */}
                        {selectedStudent && semester && (
                            <div className="space-y-2">
                                <Label>Add Course</Label>
                                {isLoadingCourses ? (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Loading courses...
                                    </div>
                                ) : availableCourses.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {availableCourses
                                            .filter(c => !courseResults.some(cr => cr.courseId === c.id))
                                            .map((course) => (
                                                <Button
                                                    key={course.id}
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => addCourse(course)}
                                                    className="bg-transparent"
                                                >
                                                    <Plus className="h-3 w-3 mr-1" />
                                                    {course.code}
                                                </Button>
                                            ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No courses found for this semester</p>
                                )}
                            </div>
                        )}

                        {/* Course Results Table */}
                        {courseResults.length > 0 && (
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-muted">
                                        <tr>
                                            <th className="text-left p-3 text-sm font-medium">Course</th>
                                            <th className="text-center p-3 text-sm font-medium w-24">Credits</th>
                                            <th className="text-center p-3 text-sm font-medium w-28">Grade</th>
                                            <th className="text-center p-3 text-sm font-medium w-24">Internal</th>
                                            <th className="text-center p-3 text-sm font-medium w-24">External</th>
                                            <th className="w-12"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {courseResults.map((cr, index) => (
                                            <tr key={cr.courseId}>
                                                <td className="p-3">
                                                    <p className="font-medium text-sm">{cr.courseCode}</p>
                                                    <p className="text-xs text-muted-foreground">{cr.courseName}</p>
                                                </td>
                                                <td className="p-3 text-center text-sm">{cr.credits}</td>
                                                <td className="p-3">
                                                    <Select
                                                        value={cr.grade}
                                                        onValueChange={(val) => updateCourseResult(index, "grade", val)}
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
                                                <td className="p-3">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        value={cr.internalMarks || ""}
                                                        onChange={(e) => updateCourseResult(index, "internalMarks", parseInt(e.target.value) || 0)}
                                                        className="h-8 text-center"
                                                    />
                                                </td>
                                                <td className="p-3">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        value={cr.externalMarks || ""}
                                                        onChange={(e) => updateCourseResult(index, "externalMarks", parseInt(e.target.value) || 0)}
                                                        className="h-8 text-center"
                                                    />
                                                </td>
                                                <td className="p-3">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeCourse(index)}
                                                        className="h-8 w-8 text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* SGPA Preview */}
                        {courseResults.some(cr => cr.grade) && (
                            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                                <span className="font-medium">Calculated SGPA</span>
                                <span className="text-2xl font-bold text-primary">{calculateSGPA()}</span>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-4">
                            <Button variant="outline" onClick={() => router.back()} className="bg-transparent">
                                Cancel
                            </Button>
                            <div className="flex-1" />
                            <Button
                                onClick={() => handleSubmit(true)}
                                disabled={isSubmitting || !selectedStudent || !semester || courseResults.length === 0}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    "Save as Draft"
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
