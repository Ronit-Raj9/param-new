"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Edit2, Trash2, GraduationCap, BookOpen, Layers } from "lucide-react"

interface Program {
  id: string
  code: string
  name: string
  department: string
  duration: number
  totalCredits: number
  totalSemesters: number
  status: "active" | "discontinued"
}

interface Course {
  id: string
  code: string
  name: string
  credits: number
  type: "core" | "elective" | "lab"
  semester: number
  program: string
}

const mockPrograms: Program[] = [
  {
    id: "1",
    code: "BCS",
    name: "Bachelor of Technology in Computer Science",
    department: "Computer Science",
    duration: 4,
    totalCredits: 160,
    totalSemesters: 8,
    status: "active",
  },
  {
    id: "2",
    code: "BIT",
    name: "Bachelor of Technology in Information Technology",
    department: "Information Technology",
    duration: 4,
    totalCredits: 160,
    totalSemesters: 8,
    status: "active",
  },
  {
    id: "3",
    code: "MCS",
    name: "Master of Technology in Computer Science",
    department: "Computer Science",
    duration: 2,
    totalCredits: 80,
    totalSemesters: 4,
    status: "active",
  },
  {
    id: "4",
    code: "IPG",
    name: "Integrated Post Graduate (B.Tech + M.Tech)",
    department: "Computer Science",
    duration: 5,
    totalCredits: 200,
    totalSemesters: 10,
    status: "active",
  },
]

const mockCourses: Course[] = [
  {
    id: "1",
    code: "CS101",
    name: "Introduction to Programming",
    credits: 4,
    type: "core",
    semester: 1,
    program: "BCS",
  },
  { id: "2", code: "CS102", name: "Digital Logic Design", credits: 3, type: "core", semester: 1, program: "BCS" },
  { id: "3", code: "CS201", name: "Data Structures", credits: 4, type: "core", semester: 3, program: "BCS" },
  {
    id: "4",
    code: "CS202",
    name: "Object Oriented Programming",
    credits: 4,
    type: "core",
    semester: 3,
    program: "BCS",
  },
  {
    id: "5",
    code: "CS301",
    name: "Database Management Systems",
    credits: 4,
    type: "core",
    semester: 5,
    program: "BCS",
  },
  { id: "6", code: "CS302", name: "Operating Systems", credits: 4, type: "core", semester: 5, program: "BCS" },
  { id: "7", code: "CS401", name: "Machine Learning", credits: 3, type: "elective", semester: 7, program: "BCS" },
  { id: "8", code: "CS402", name: "Cloud Computing", credits: 3, type: "elective", semester: 7, program: "BCS" },
]

export function CurriculumManagement() {
  const [searchProgram, setSearchProgram] = useState("")
  const [searchCourse, setSearchCourse] = useState("")
  const [selectedProgram, setSelectedProgram] = useState<string>("all")

  const filteredPrograms = mockPrograms.filter(
    (p) =>
      p.name.toLowerCase().includes(searchProgram.toLowerCase()) ||
      p.code.toLowerCase().includes(searchProgram.toLowerCase()),
  )

  const filteredCourses = mockCourses.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchCourse.toLowerCase()) ||
      c.code.toLowerCase().includes(searchCourse.toLowerCase())
    const matchesProgram = selectedProgram === "all" || c.program === selectedProgram
    return matchesSearch && matchesProgram
  })

  return (
    <Tabs defaultValue="programs" className="space-y-6">
      <TabsList className="bg-slate-100">
        <TabsTrigger value="programs" className="gap-2">
          <GraduationCap className="h-4 w-4" />
          Programs
        </TabsTrigger>
        <TabsTrigger value="courses" className="gap-2">
          <BookOpen className="h-4 w-4" />
          Courses
        </TabsTrigger>
        <TabsTrigger value="structure" className="gap-2">
          <Layers className="h-4 w-4" />
          Structure
        </TabsTrigger>
      </TabsList>

      <TabsContent value="programs" className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Academic Programs</CardTitle>
                <CardDescription>Manage degree programs offered by the institution</CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Program
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Program</DialogTitle>
                    <DialogDescription>Create a new academic program</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label>Program Code</Label>
                      <Input placeholder="e.g., BCS, MCS" />
                    </div>
                    <div className="grid gap-2">
                      <Label>Program Name</Label>
                      <Input placeholder="Full program name" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Duration (Years)</Label>
                        <Input type="number" placeholder="4" />
                      </div>
                      <div className="grid gap-2">
                        <Label>Total Credits</Label>
                        <Input type="number" placeholder="160" />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button>Create Program</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search programs..."
                  value={searchProgram}
                  onChange={(e) => setSearchProgram(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Program Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrograms.map((program) => (
                  <TableRow key={program.id}>
                    <TableCell className="font-mono font-medium">{program.code}</TableCell>
                    <TableCell>{program.name}</TableCell>
                    <TableCell>{program.department}</TableCell>
                    <TableCell>{program.duration} years</TableCell>
                    <TableCell>{program.totalCredits}</TableCell>
                    <TableCell>
                      <Badge variant={program.status === "active" ? "default" : "secondary"}>{program.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="courses" className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Courses</CardTitle>
                <CardDescription>Manage individual courses and their details</CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Course
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Course</DialogTitle>
                    <DialogDescription>Create a new course</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Course Code</Label>
                        <Input placeholder="e.g., CS101" />
                      </div>
                      <div className="grid gap-2">
                        <Label>Credits</Label>
                        <Input type="number" placeholder="4" />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label>Course Name</Label>
                      <Input placeholder="Full course name" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Type</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="core">Core</SelectItem>
                            <SelectItem value="elective">Elective</SelectItem>
                            <SelectItem value="lab">Lab</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Semester</Label>
                        <Input type="number" placeholder="1-8" />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button>Create Course</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search courses..."
                  value={searchCourse}
                  onChange={(e) => setSearchCourse(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filter by program" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs</SelectItem>
                  {mockPrograms.map((p) => (
                    <SelectItem key={p.id} value={p.code}>
                      {p.code} - {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Course Name</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-mono font-medium">{course.code}</TableCell>
                    <TableCell>{course.name}</TableCell>
                    <TableCell>{course.credits}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          course.type === "core"
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : course.type === "elective"
                              ? "border-purple-200 bg-purple-50 text-purple-700"
                              : "border-green-200 bg-green-50 text-green-700"
                        }
                      >
                        {course.type}
                      </Badge>
                    </TableCell>
                    <TableCell>Sem {course.semester}</TableCell>
                    <TableCell>{course.program}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="structure" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Curriculum Structure</CardTitle>
            <CardDescription>View and manage semester-wise course distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <Select defaultValue="BCS">
                <SelectTrigger className="w-full md:w-[300px]">
                  <SelectValue placeholder="Select program" />
                </SelectTrigger>
                <SelectContent>
                  {mockPrograms.map((p) => (
                    <SelectItem key={p.id} value={p.code}>
                      {p.code} - {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => {
                const semCourses = mockCourses.filter((c) => c.semester === sem)
                const totalCredits = semCourses.reduce((acc, c) => acc + c.credits, 0)
                return (
                  <Card key={sem} className="border-slate-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center justify-between">
                        Semester {sem}
                        <Badge variant="secondary">{totalCredits} credits</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {semCourses.length > 0 ? (
                        <ul className="space-y-2">
                          {semCourses.map((course) => (
                            <li key={course.id} className="flex items-center justify-between text-sm">
                              <span className="text-slate-600">{course.code}</span>
                              <span className="text-slate-400">{course.credits}cr</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-slate-400 italic">No courses assigned</p>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
