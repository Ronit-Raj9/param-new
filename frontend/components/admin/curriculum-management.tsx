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
import { Search, Plus, Edit2, Trash2, GraduationCap, BookOpen, Layers, Loader2, CheckCircle2 } from "lucide-react"

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

interface Curriculum {
  id: string
  programId: string
  version: string
  batch: string
  name: string
  status: "DRAFT" | "ACTIVE" | "ARCHIVED"
  totalCredits: number
  semesters: Array<{
    id: string
    semesterNumber: number
    courses: Array<{ id: string; code: string; name: string; credits: number }>
  }>
}

// StructureTab Component for Curriculum Management
function StructureTab({
  programs,
  api,
  toast
}: {
  programs: Program[]
  api: ReturnType<typeof useApi>
  toast: ReturnType<typeof useToast>["toast"]
}) {
  const [selectedProgramId, setSelectedProgramId] = useState<string>("")
  const [curriculums, setCurriculums] = useState<Curriculum[]>([])
  const [isLoadingCurriculums, setIsLoadingCurriculums] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null)

  // New curriculum form
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newCurriculum, setNewCurriculum] = useState({
    version: "",
    batch: "",
    name: "",
    totalCredits: "160",
  })

  // Fetch curriculums when program is selected
  useEffect(() => {
    async function fetchCurriculums() {
      if (!api.isReady || !selectedProgramId) {
        setCurriculums([])
        return
      }

      setIsLoadingCurriculums(true)
      try {
        const data = await api.get<{ success: boolean; data: Curriculum[] }>(
          `/v1/curriculum?programId=${selectedProgramId}`
        )
        if (data.success) {
          setCurriculums(data.data || [])
        }
      } catch (err) {
        console.error("Error fetching curriculums:", err)
        setCurriculums([])
      } finally {
        setIsLoadingCurriculums(false)
      }
    }

    fetchCurriculums()
  }, [api.isReady, selectedProgramId])

  const handleCreateCurriculum = async () => {
    if (!selectedProgramId) return

    setIsCreating(true)
    try {
      const selectedProgram = programs.find(p => p.id === selectedProgramId)
      const numSemesters = selectedProgram?.totalSemesters || 8

      // Create semesters array for the curriculum
      const semesters = Array.from({ length: numSemesters }, (_, i) => ({
        semesterNumber: i + 1,
        courses: [],
      }))

      const data = await api.post<{ success: boolean; data: Curriculum }>("/v1/curriculum", {
        programId: selectedProgramId,
        version: newCurriculum.version,
        batch: newCurriculum.batch,
        name: newCurriculum.name || `${selectedProgram?.code} Curriculum ${newCurriculum.version}`,
        totalCredits: parseInt(newCurriculum.totalCredits) || 160,
        semesters,
      })

      if (data.success) {
        // Refresh curriculums
        setCurriculums([...curriculums, data.data])
        setNewCurriculum({ version: "", batch: "", name: "", totalCredits: "160" })
        setShowCreateDialog(false)
        toast({ title: "Success", description: "Curriculum created with semesters!" })
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create curriculum"
      toast({ title: "Error", description: message, variant: "destructive" })
    } finally {
      setIsCreating(false)
    }
  }

  const handleActivateCurriculum = async (curriculumId: string) => {
    setIsUpdatingStatus(curriculumId)
    try {
      const data = await api.patch<{ success: boolean; data: Curriculum }>(
        `/v1/curriculum/${curriculumId}`,
        { status: "ACTIVE" }
      )

      if (data.success) {
        // Update local state - mark this one as active, others as archived
        setCurriculums(curriculums.map(c => ({
          ...c,
          status: c.id === curriculumId ? "ACTIVE" : (c.status === "ACTIVE" ? "ARCHIVED" : c.status)
        })))
        toast({ title: "Success", description: "Curriculum activated!" })
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to activate curriculum"
      toast({ title: "Error", description: message, variant: "destructive" })
    } finally {
      setIsUpdatingStatus(null)
    }
  }

  const selectedProgram = programs.find(p => p.id === selectedProgramId)

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg">Curriculum Structure</CardTitle>
            <CardDescription>Create and manage curriculum versions for each program</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Program Selector */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Label className="mb-2 block">Select Program</Label>
            <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a program to manage its curriculum" />
              </SelectTrigger>
              <SelectContent>
                {programs.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.code} - {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProgramId && (
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="md:mt-6">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Curriculum
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Curriculum</DialogTitle>
                  <DialogDescription>
                    Create a curriculum for {selectedProgram?.name}. This will automatically create {selectedProgram?.totalSemesters || 8} semesters.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Version *</Label>
                      <Input
                        placeholder="e.g., 2024"
                        value={newCurriculum.version}
                        onChange={(e) => setNewCurriculum({ ...newCurriculum, version: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Batch *</Label>
                      <Input
                        placeholder="e.g., 2024-2028"
                        value={newCurriculum.batch}
                        onChange={(e) => setNewCurriculum({ ...newCurriculum, batch: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Curriculum Name</Label>
                    <Input
                      placeholder={`${selectedProgram?.code} Curriculum ${newCurriculum.version || "2024"}`}
                      value={newCurriculum.name}
                      onChange={(e) => setNewCurriculum({ ...newCurriculum, name: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Total Credits</Label>
                    <Input
                      type="number"
                      placeholder="160"
                      value={newCurriculum.totalCredits}
                      onChange={(e) => setNewCurriculum({ ...newCurriculum, totalCredits: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleCreateCurriculum}
                    disabled={isCreating || !newCurriculum.version || !newCurriculum.batch}
                  >
                    {isCreating ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</>
                    ) : (
                      "Create Curriculum"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* No Program Selected */}
        {!selectedProgramId && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Layers className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Select a Program</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Choose a program above to view or create its curriculum structure
            </p>
          </div>
        )}

        {/* Loading */}
        {selectedProgramId && isLoadingCurriculums && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* No Curriculums */}
        {selectedProgramId && !isLoadingCurriculums && curriculums.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No Curriculum Found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Create a curriculum for {selectedProgram?.name} to get started
            </p>
          </div>
        )}

        {/* Curriculums List */}
        {selectedProgramId && !isLoadingCurriculums && curriculums.length > 0 && (
          <div className="space-y-4">
            {curriculums.map((curriculum) => (
              <Card key={curriculum.id} className={curriculum.status === "ACTIVE" ? "border-green-500 border-2" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {curriculum.name}
                        {curriculum.status === "ACTIVE" && (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                      </CardTitle>
                      <CardDescription>
                        Version: {curriculum.version} | Batch: {curriculum.batch} | Credits: {curriculum.totalCredits}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        curriculum.status === "ACTIVE" ? "default" :
                          curriculum.status === "DRAFT" ? "secondary" : "outline"
                      }>
                        {curriculum.status}
                      </Badge>
                      {curriculum.status === "DRAFT" && (
                        <Button
                          size="sm"
                          onClick={() => handleActivateCurriculum(curriculum.id)}
                          disabled={isUpdatingStatus === curriculum.id}
                        >
                          {isUpdatingStatus === curriculum.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Activate"
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                    {curriculum.semesters?.map((sem) => (
                      <div
                        key={sem.id}
                        className="p-2 rounded-lg border text-center hover:bg-slate-50 cursor-pointer"
                        title={`Semester ${sem.semesterNumber}: ${sem.courses?.length || 0} courses`}
                      >
                        <div className="text-xs text-muted-foreground">Sem</div>
                        <div className="font-medium">{sem.semesterNumber}</div>
                        <div className="text-xs text-muted-foreground">{sem.courses?.length || 0} courses</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    💡 To add courses, go to the Courses tab and select this program.
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
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

  // Course dialog state
  const [isAddingCourse, setIsAddingCourse] = useState(false)
  const [newCourse, setNewCourse] = useState({
    programId: "",
    semester: "",
    code: "",
    name: "",
    credits: "",
    type: "MANDATORY",
  })
  const [curriculumSemesters, setCurriculumSemesters] = useState<Array<{ id: string, semesterNumber: number, curriculumId: string }>>([])
  const [isLoadingSemesters, setIsLoadingSemesters] = useState(false)

  // Fetch curriculum semesters when program is selected in add course dialog
  useEffect(() => {
    async function fetchCurriculumSemesters() {
      if (!api.isReady || !newCourse.programId) {
        setCurriculumSemesters([])
        return
      }

      setIsLoadingSemesters(true)
      try {
        // Get active curriculum for the selected program
        const data = await api.get<{ success: boolean; data: any }>(`/v1/curriculum/active/${newCourse.programId}`)
        if (data.success && data.data?.semesters) {
          setCurriculumSemesters(data.data.semesters)
        } else {
          setCurriculumSemesters([])
        }
      } catch (err) {
        console.error("Error fetching curriculum semesters:", err)
        setCurriculumSemesters([])
      } finally {
        setIsLoadingSemesters(false)
      }
    }

    fetchCurriculumSemesters()
  }, [api.isReady, newCourse.programId])

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

  // Fetch courses when api is ready or selected program changes
  useEffect(() => {
    async function fetchCourses() {
      if (!api.isReady) return

      try {
        setIsLoadingCourses(true)
        // Build query params
        const params = new URLSearchParams()
        if (selectedProgram && selectedProgram !== "all") {
          // Find program by code to get id
          const program = programs.find(p => p.code === selectedProgram)
          if (program) {
            params.append("programId", program.id)
          }
        }
        if (searchCourse) {
          params.append("search", searchCourse)
        }

        const queryString = params.toString()
        const url = `/v1/curriculum/courses${queryString ? `?${queryString}` : ""}`

        const data = await api.get<{ success: boolean; data: Course[] }>(url)
        if (data.success) {
          // Transform backend data to frontend Course type
          const transformedCourses = (data.data || []).map((c: any) => ({
            id: c.id,
            code: c.code,
            name: c.name,
            credits: c.credits,
            type: c.type?.toLowerCase() || "core",
            semester: c.curriculumSemester?.semesterNumber || 0,
            programCode: c.curriculumSemester?.curriculum?.program?.code || "",
          }))
          setCourses(transformedCourses)
        }
      } catch (err) {
        console.error("Error fetching courses:", err)
        setCourses([])
      } finally {
        setIsLoadingCourses(false)
      }
    }

    fetchCourses()
  }, [api.isReady, selectedProgram, programs])

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

  const handleAddCourse = async () => {
    try {
      // Find the curriculum semester ID
      const selectedSemester = curriculumSemesters.find(s => s.semesterNumber === parseInt(newCourse.semester))
      if (!selectedSemester) {
        toast({ title: "Error", description: "Please select a valid semester", variant: "destructive" })
        return
      }

      const data = await api.post<{ success: boolean; data: any }>("/v1/curriculum/courses", {
        curriculumSemesterId: selectedSemester.id,
        code: newCourse.code,
        name: newCourse.name,
        credits: parseInt(newCourse.credits),
        type: newCourse.type,
        lectureHours: 3,
        tutorialHours: 1,
        practicalHours: 0,
      })

      if (data.success) {
        // Refresh courses list
        const program = programs.find(p => p.id === newCourse.programId)
        const newCourseData = {
          id: data.data.id,
          code: data.data.code,
          name: data.data.name,
          credits: data.data.credits,
          type: data.data.type?.toLowerCase() || "core",
          semester: parseInt(newCourse.semester),
          programCode: program?.code || "",
        }
        setCourses([...courses, newCourseData])
        setNewCourse({ programId: "", semester: "", code: "", name: "", credits: "", type: "MANDATORY" })
        setIsAddingCourse(false)
        toast({ title: "Success", description: "Course created successfully" })
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create course"
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
              <Dialog open={isAddingCourse} onOpenChange={setIsAddingCourse}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Course
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Add New Course</DialogTitle>
                    <DialogDescription>Add a course to a program&apos;s curriculum</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label>Program *</Label>
                      <Select
                        value={newCourse.programId}
                        onValueChange={(value) => setNewCourse({ ...newCourse, programId: value, semester: "" })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select program" />
                        </SelectTrigger>
                        <SelectContent>
                          {programs.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.code} - {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Semester *</Label>
                      <Select
                        value={newCourse.semester}
                        onValueChange={(value) => setNewCourse({ ...newCourse, semester: value })}
                        disabled={!newCourse.programId || isLoadingSemesters}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingSemesters ? "Loading..." : "Select semester"} />
                        </SelectTrigger>
                        <SelectContent>
                          {curriculumSemesters.map((s) => (
                            <SelectItem key={s.id} value={s.semesterNumber.toString()}>
                              Semester {s.semesterNumber}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Course Code *</Label>
                        <Input
                          placeholder="e.g., CS101"
                          value={newCourse.code}
                          onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Credits *</Label>
                        <Input
                          type="number"
                          placeholder="4"
                          value={newCourse.credits}
                          onChange={(e) => setNewCourse({ ...newCourse, credits: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label>Course Name *</Label>
                      <Input
                        placeholder="e.g., Introduction to Programming"
                        value={newCourse.name}
                        onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Type *</Label>
                      <Select
                        value={newCourse.type}
                        onValueChange={(value) => setNewCourse({ ...newCourse, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MANDATORY">Mandatory</SelectItem>
                          <SelectItem value="ELECTIVE">Elective</SelectItem>
                          <SelectItem value="MOOC">MOOC</SelectItem>
                          <SelectItem value="PROJECT">Project</SelectItem>
                          <SelectItem value="INTERNSHIP">Internship</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleAddCourse}
                      disabled={!newCourse.programId || !newCourse.semester || !newCourse.code || !newCourse.name || !newCourse.credits}
                    >
                      Create Course
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
        <StructureTab programs={programs} api={api} toast={toast} />
      </TabsContent>
    </Tabs>
  )
}
