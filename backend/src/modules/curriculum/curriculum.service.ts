import { prisma } from "../../config/database.js";
import { ApiError } from "../../middleware/error.handler.js";
import { createLogger } from "../../utils/logger.js";
import type { Program, Curriculum, Course, Prisma } from "@prisma/client";
import type {
  CreateProgramInput,
  UpdateProgramInput,
  CreateCurriculumInput,
  UpdateCurriculumInput,
  CreateCourseInput,
  UpdateCourseInput,
  ListProgramsQuery,
  ListCurriculumsQuery,
} from "./curriculum.schema.js";

const logger = createLogger("curriculum-service");

// ============ PROGRAMS ============

export async function createProgram(input: CreateProgramInput): Promise<Program> {
  const existing = await prisma.program.findUnique({
    where: { code: input.code },
  });

  if (existing) {
    throw ApiError.conflict("Program with this code already exists");
  }

  const program = await prisma.program.create({
    data: input,
  });

  logger.info({ programId: program.id, code: input.code }, "Program created");
  return program;
}

export async function getProgramById(id: string): Promise<Program> {
  const program = await prisma.program.findUnique({
    where: { id },
    include: {
      curricula: {
        where: { status: "ACTIVE" },
        include: {
          semesters: {
            include: {
              courses: true,
            },
            orderBy: { semesterNumber: "asc" },
          },
        },
      },
      _count: {
        select: { students: true },
      },
    },
  });

  if (!program) {
    throw ApiError.notFound("Program not found");
  }

  return program;
}

export async function updateProgram(id: string, input: UpdateProgramInput): Promise<Program> {
  const existing = await prisma.program.findUnique({ where: { id } });

  if (!existing) {
    throw ApiError.notFound("Program not found");
  }

  const program = await prisma.program.update({
    where: { id },
    data: input,
  });

  logger.info({ programId: id, updates: input }, "Program updated");
  return program;
}

export async function listPrograms(query: ListProgramsQuery) {
  const { search, isActive, page, limit } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.ProgramWhereInput = {};

  if (isActive !== undefined) where.isActive = isActive;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { code: { contains: search, mode: "insensitive" } },
    ];
  }

  const [programs, total] = await Promise.all([
    prisma.program.findMany({
      where,
      include: {
        _count: {
          select: { students: true, curricula: true },
        },
      },
      orderBy: { name: "asc" },
      skip,
      take: limit,
    }),
    prisma.program.count({ where }),
  ]);

  return {
    data: programs,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// ============ CURRICULUMS ============

export async function createCurriculum(input: CreateCurriculumInput): Promise<Curriculum> {
  // Verify program exists
  const program = await prisma.program.findUnique({
    where: { id: input.programId },
  });

  if (!program) {
    throw ApiError.notFound("Program not found");
  }

  // Check for existing curriculum with same version
  const existing = await prisma.curriculum.findFirst({
    where: {
      programId: input.programId,
      version: input.version,
    },
  });

  if (existing) {
    throw ApiError.conflict("Curriculum with this version already exists");
  }

  // Create curriculum with semesters and courses
  const curriculum = await prisma.$transaction(async (tx) => {
    const newCurriculum = await tx.curriculum.create({
      data: {
        programId: input.programId,
        version: input.version,
        batch: input.batch,
        name: input.name,
        description: input.description,
        totalCredits: input.totalCredits ?? 0,
        status: "DRAFT",
      },
    });

    // Create semesters and courses
    for (const semester of input.semesters) {
      const newSemester = await tx.curriculumSemester.create({
        data: {
          curriculumId: newCurriculum.id,
          semesterNumber: semester.semesterNumber,
        },
      });

      // Create courses
      for (const course of semester.courses) {
        await tx.course.create({
          data: {
            curriculumSemesterId: newSemester.id,
            code: course.code,
            name: course.name,
            shortName: course.shortName,
            credits: course.credits,
            lectureHours: course.lectureHours,
            tutorialHours: course.tutorialHours,
            practicalHours: course.practicalHours,
            type: course.type,
          },
        });
      }
    }

    return newCurriculum;
  });

  logger.info({ curriculumId: curriculum.id }, "Curriculum created");
  return curriculum;
}

export async function getCurriculumById(id: string) {
  const curriculum = await prisma.curriculum.findUnique({
    where: { id },
    include: {
      program: true,
      semesters: {
        include: {
          courses: {
            orderBy: { code: "asc" },
          },
        },
        orderBy: { semesterNumber: "asc" },
      },
    },
  });

  if (!curriculum) {
    throw ApiError.notFound("Curriculum not found");
  }

  return curriculum;
}

export async function updateCurriculum(id: string, input: UpdateCurriculumInput): Promise<Curriculum> {
  const existing = await prisma.curriculum.findUnique({ where: { id } });

  if (!existing) {
    throw ApiError.notFound("Curriculum not found");
  }

  // If activating, deactivate other curriculums for same program
  if (input.status === "ACTIVE" && existing.status !== "ACTIVE") {
    await prisma.curriculum.updateMany({
      where: {
        programId: existing.programId,
        status: "ACTIVE",
        NOT: { id },
      },
      data: { status: "ARCHIVED" },
    });
  }

  const curriculum = await prisma.curriculum.update({
    where: { id },
    data: input,
    include: {
      program: true,
    },
  });

  logger.info({ curriculumId: id, updates: input }, "Curriculum updated");
  return curriculum;
}

export async function listCurriculums(query: ListCurriculumsQuery) {
  const { programId, status, page, limit } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.CurriculumWhereInput = {};

  if (programId) where.programId = programId;
  if (status) where.status = status;

  const [curriculums, total] = await Promise.all([
    prisma.curriculum.findMany({
      where,
      include: {
        program: {
          select: { id: true, name: true, code: true },
        },
        semesters: {
          include: {
            _count: { select: { courses: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.curriculum.count({ where }),
  ]);

  return {
    data: curriculums,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getActiveCurriculumForProgram(programId: string) {
  const curriculum = await prisma.curriculum.findFirst({
    where: {
      programId,
      status: "ACTIVE",
    },
    include: {
      program: true,
      semesters: {
        include: {
          courses: {
            orderBy: { code: "asc" },
          },
        },
        orderBy: { semesterNumber: "asc" },
      },
    },
  });

  return curriculum;
}

// ============ COURSES ============

export async function createCourse(input: CreateCourseInput): Promise<Course> {
  // Verify semester exists
  const semester = await prisma.curriculumSemester.findUnique({
    where: { id: input.curriculumSemesterId },
  });

  if (!semester) {
    throw ApiError.notFound("Curriculum semester not found");
  }

  const course = await prisma.course.create({
    data: input,
  });

  logger.info({ courseId: course.id, code: input.code }, "Course created");
  return course;
}

export async function getCourseById(id: string): Promise<Course> {
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      curriculumSemester: {
        include: {
          curriculum: {
            include: {
              program: true,
            },
          },
        },
      },
    },
  });

  if (!course) {
    throw ApiError.notFound("Course not found");
  }

  return course;
}

export async function updateCourse(id: string, input: UpdateCourseInput): Promise<Course> {
  const existing = await prisma.course.findUnique({ where: { id } });

  if (!existing) {
    throw ApiError.notFound("Course not found");
  }

  const course = await prisma.course.update({
    where: { id },
    data: input,
  });

  logger.info({ courseId: id, updates: input }, "Course updated");
  return course;
}

export async function deleteCourse(id: string): Promise<void> {
  const course = await prisma.course.findUnique({ where: { id } });

  if (!course) {
    throw ApiError.notFound("Course not found");
  }

  // Check if course has results
  const resultsCount = await prisma.courseResult.count({
    where: { courseId: id },
  });

  if (resultsCount > 0) {
    throw ApiError.conflict("Cannot delete course with existing results");
  }

  await prisma.course.delete({ where: { id } });
  logger.info({ courseId: id }, "Course deleted");
}

/**
 * List courses with filters for programId and semester
 */
export async function listCourses(query: {
  programId?: string;
  semester?: number;
  search?: string;
}) {
  const { programId, semester, search } = query;

  const where: Prisma.CourseWhereInput = {};

  // If programId is provided, filter by program's curriculums
  if (programId) {
    // Find all curriculums for the program (prefer ACTIVE)
    const curriculums = await prisma.curriculum.findMany({
      where: {
        programId,
        // Prefer active, but include all if none active
      },
      include: {
        semesters: semester ? {
          where: { semesterNumber: semester },
        } : true,
      },
      orderBy: {
        // Prefer ACTIVE status
        status: 'asc', // ACTIVE comes before DRAFT alphabetically
      },
    });

    // Collect all matching semester IDs
    const semesterIds: string[] = [];
    for (const curriculum of curriculums) {
      for (const sem of curriculum.semesters) {
        semesterIds.push(sem.id);
      }
    }

    if (semesterIds.length > 0) {
      where.curriculumSemesterId = { in: semesterIds };
    } else {
      // No matching semesters found for this program
      logger.warn({ programId, semester }, "No curriculum semesters found for program");
      return [];
    }
  } else if (semester) {
    // If only semester is provided (no programId), filter by semester number
    const semesters = await prisma.curriculumSemester.findMany({
      where: { semesterNumber: semester },
      select: { id: true },
    });
    const semesterIds = semesters.map(s => s.id);
    if (semesterIds.length > 0) {
      where.curriculumSemesterId = { in: semesterIds };
    } else {
      return [];
    }
  }
  // If neither programId nor semester is provided, return all courses

  if (search) {
    where.OR = [
      { code: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
    ];
  }

  const courses = await prisma.course.findMany({
    where,
    include: {
      curriculumSemester: {
        include: {
          curriculum: {
            include: {
              program: {
                select: { id: true, name: true, code: true },
              },
            },
          },
        },
      },
    },
    orderBy: { code: "asc" },
  });

  return courses;
}
