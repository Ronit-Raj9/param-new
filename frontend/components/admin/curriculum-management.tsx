"use client"

import { useState, useEffect } from "react"
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
import { useToast } from "@/hooks/use-toast"
import { useApi } from "@/hooks/use-api"
import { Search, Plus, Edit2, Trash2, GraduationCap, BookOpen, Layers, Loader2 } from "lucide-react"

interface Program {
  id: string
  code: string
  name: string
  department: string
  duration: number
  durationYears: number
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
  programCode: string
}

export function CurriculumManagement() {
  const { toast } = useToast()
  const api = useApi()
  const [programs, setPrograms] = useState<Program[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(true)
  const [isLoadingCourses, setIsLoadingCourses] = useState(true)

  const [searchProgram, setSearchProgram] = useState("")
  const [searchCourse, setSearchCourse] = useState("")
  const [selectedProgram, setSelectedProgram] = useState<string>("all")

  const [isAddingProgram, setIsAddingProgram] = useState(false)
  const [newProgram, setNewProgram] = useState({ 
    code: "", 
    name: "", 
    shortName: "",
    degreeType: "",
    duration: "", 
    totalCredits: "" 
  })

  // Fetch programs
  useEffect(() => {
    async function fetchPrograms() {
      if (!api.isReady) return
      
      try {
        setIsLoadingPrograms(true)
        const data = await api.get<{ success: boolean; data: Program[] }>("/v1/curriculum/programs")
        if (data.success) {
          setPrograms(data.data || [])
        }
      } catch (err) {
        console.error("Error fetching programs:", err)
        setPrograms([])
      } finally {
        setIsLoadingPrograms(false)
      }
    }

    fetchPrograms()
  }, [api.isReady])

  // Note: Courses are fetched as part of curriculums, not separately
  // The courses tab will show courses from selected curriculum
  useEffect(() => {
    // Reset courses loading when api is ready
    if (api.isReady) {
      setIsLoadingCourses(false)
    }
  }, [api.isReady])

  const filteredPrograms = programs.filter(
    (p) =>
      p.name.toLowerCase().includes(searchProgram.toLowerCase()) ||
      p.code.toLowerCase().includes(searchProgram.toLowerCase())
  )

  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchCourse.toLowerCase()) ||
      c.code.toLowerCase().includes(searchCourse.toLowerCase())
    return matchesSearch
  })

  const handleAddProgram = async () => {
    try {
      const data = await api.post<{ success: boolean; data: Program }>("/v1/curriculum/programs", {
        code: newProgram.code,
        name: newProgram.name,
        shortName: newProgram.shortName || newProgram.code,
        degreeType: newProgram.degreeType,
        durationYears: parseInt(newProgram.duration),
        totalCredits: parseInt(newProgram.totalCredits),
        totalSemesters: parseInt(newProgram.duration) * 2,
      })

      if (data.success) {
        setPrograms([...programs, data.data])
        setNewProgram({ code: "", name: "", shortName: "", degreeType: "", duration: "", totalCredits: "" })
        setIsAddingProgram(false)
        toast({ title: "Success", description: "Program created successfully" })
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create program"
      toast({ title: "Error", description: message, variant: "destructive" })
    }
  }

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

      {/* Programs Tab */}
      <TabsContent value="programs" className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Academic Programs</CardTitle>
                <CardDescription>Manage degree programs offered by the institution</CardDescription>
              </div>
              <Dialog open={isAddingProgram} onOpenChange={setIsAddingProgram}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Program
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Add New Program</DialogTitle>
                    <DialogDescription>Create a new academic program</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Program Code *</Label>
                        <Input
                          placeholder="e.g., BT-CSE"
                          value={newProgram.code}
                          onChange={(e) => setNewProgram({ ...newProgram, code: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Short Name</Label>
                        <Input
                          placeholder="e.g., B.Tech CSE"
                          value={newProgram.shortName}
                          onChange={(e) => setNewProgram({ ...newProgram, shortName: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label>Program Name *</Label>
                      <Input
                        placeholder="e.g., Bachelor of Technology in Computer Science"
                        value={newProgram.name}
                        onChange={(e) => setNewProgram({ ...newProgram, name: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Degree Type *</Label>
                      <Select
                        value={newProgram.degreeType}
                        onValueChange={(value) => setNewProgram({ ...newProgram, degreeType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select degree type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Bachelor of Technology">Bachelor of Technology</SelectItem>
                          <SelectItem value="Bachelor of Science">Bachelor of Science</SelectItem>
                          <SelectItem value="Bachelor of Arts">Bachelor of Arts</SelectItem>
                          <SelectItem value="Master of Technology">Master of Technology</SelectItem>
                          <SelectItem value="Master of Science">Master of Science</SelectItem>
                          <SelectItem value="Master of Business Administration">Master of Business Administration</SelectItem>
                          <SelectItem value="Doctor of Philosophy">Doctor of Philosophy</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Duration (Years) *</Label>
                        <Input
                          type="number"
                          placeholder="4"
                          value={newProgram.duration}
                          onChange={(e) => setNewProgram({ ...newProgram, duration: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Total Credits *</Label>
                        <Input
                          type="number"
                          placeholder="160"
                          value={newProgram.totalCredits}
                          onChange={(e) => setNewProgram({ ...newProgram, totalCredits: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddProgram}>Create Program</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
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

            {/* Loading State */}
            {isLoadingPrograms && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {/* Empty State */}
            {!isLoadingPrograms && filteredPrograms.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No programs found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchProgram ? "Try a different search term" : "Add your first program to get started"}
                </p>
              </div>
            )}

            {/* Programs Table */}
            {!isLoadingPrograms && filteredPrograms.length > 0 && (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-center">Duration</TableHead>
                      <TableHead className="text-center">Credits</TableHead>
                      <TableHead className="text-center">Semesters</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPrograms.map((program) => (
                      <TableRow key={program.id}>
                        <TableCell className="font-mono font-medium">{program.code}</TableCell>
                        <TableCell className="max-w-[300px] truncate">{program.name}</TableCell>
                        <TableCell className="text-center">{program.durationYears || program.duration} yrs</TableCell>
                        <TableCell className="text-center">{program.totalCredits}</TableCell>
                        <TableCell className="text-center">{program.totalSemesters}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={program.status === "active" ? "default" : "secondary"}>
                            {program.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
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
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Courses Tab */}
      <TabsContent value="courses" className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Courses</CardTitle>
                <CardDescription>Manage courses for each program</CardDescription>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Course
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-4">
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
                  {programs.map((p) => (
                    <SelectItem key={p.id} value={p.code}>
                      {p.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Loading State */}
            {isLoadingCourses && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {/* Empty State */}
            {!isLoadingCourses && filteredCourses.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No courses found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchCourse || selectedProgram !== "all"
                    ? "Try adjusting your filters"
                    : "Add courses to your programs"}
                </p>
              </div>
            )}

            {/* Courses Table */}
            {!isLoadingCourses && filteredCourses.length > 0 && (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-center">Credits</TableHead>
                      <TableHead className="text-center">Type</TableHead>
                      <TableHead className="text-center">Semester</TableHead>
                      <TableHead className="text-center">Program</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCourses.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell className="font-mono font-medium">{course.code}</TableCell>
                        <TableCell className="max-w-[250px] truncate">{course.name}</TableCell>
                        <TableCell className="text-center">{course.credits}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{course.type}</Badge>
                        </TableCell>
                        <TableCell className="text-center">{course.semester}</TableCell>
                        <TableCell className="text-center font-mono">{course.programCode}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
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
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Structure Tab */}
      <TabsContent value="structure" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Curriculum Structure</CardTitle>
            <CardDescription>View and manage the curriculum structure for each program</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Layers className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Structure View</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Select a program to view its curriculum structure
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
