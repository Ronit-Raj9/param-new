import { prisma } from "../../config/database.js";
import { ApiError } from "../../middleware/error.handler.js";
import { createLogger } from "../../utils/logger.js";
import type { Student, Prisma } from "@prisma/client";
import type { 
  CreateStudentInput, 
  UpdateStudentInput, 
  ListStudentsQuery, 
  BulkImportInput,
  UpdateStudentStatusInput 
} from "./students.schema.js";

const logger = createLogger("students-service");

/**
 * Create a new student with associated user
 */
export async function createStudent(input: CreateStudentInput): Promise<Student> {
  // Check if enrollment number already exists
  const existingEnrollment = await prisma.student.findUnique({
    where: { enrollmentNumber: input.enrollmentNumber },
  });

  if (existingEnrollment) {
    throw ApiError.conflict("Student with this enrollment number already exists");
  }

  // Check if email already exists as a user
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser?.id) {
    // Check if already linked to a student
    const existingStudent = await prisma.student.findUnique({
      where: { userId: existingUser.id },
    });
    if (existingStudent) {
      throw ApiError.conflict("User already linked to a student profile");
    }
  }

  // Create user and student in transaction
  const student = await prisma.$transaction(async (tx) => {
    // Create or get user
    let user = existingUser;
    if (!user) {
      // Create a placeholder user - will be updated when student activates via Privy
      user = await tx.user.create({
        data: {
          privyId: `pending_${input.enrollmentNumber}`, // Placeholder until activation
          email: input.email,
          name: input.name,
          role: "STUDENT",
          status: "PENDING_ACTIVATION",
        },
      });
    }

    // Create student
    const newStudent = await tx.student.create({
      data: {
        userId: user.id,
        enrollmentNumber: input.enrollmentNumber,
        name: input.name,
        email: input.email,
        programId: input.programId,
        curriculumId: input.curriculumId,
        batch: input.batch,
        admissionYear: input.admissionYear,
        expectedGradYear: input.expectedGradYear,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
        phone: input.phone,
        address: input.address,
        guardianName: input.guardianName,
        guardianPhone: input.guardianPhone,
        status: "PENDING_ACTIVATION",
      },
      include: {
        user: true,
        program: true,
        curriculum: true,
      },
    });

    return newStudent;
  });

  logger.info({ studentId: student.id, enrollmentNumber: input.enrollmentNumber }, "Student created");
  return student;
}

/**
 * Get student by ID
 */
export async function getStudentById(id: string) {
  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          status: true,
        },
      },
      program: true,
      curriculum: true,
      semesterResults: {
        include: {
          courseResults: {
            include: {
              course: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      credentials: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!student) {
    throw ApiError.notFound("Student not found");
  }

  return student;
}

/**
 * Get student by enrollment number
 */
export async function getStudentByEnrollment(enrollmentNumber: string) {
  const student = await prisma.student.findUnique({
    where: { enrollmentNumber },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          status: true,
        },
      },
      program: true,
      curriculum: true,
    },
  });

  if (!student) {
    throw ApiError.notFound("Student not found");
  }

  return student;
}

/**
 * Get student by user ID
 */
export async function getStudentByUserId(userId: string) {
  const student = await prisma.student.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          status: true,
        },
      },
      program: true,
      curriculum: true,
      semesterResults: {
        include: {
          courseResults: {
            include: {
              course: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      credentials: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return student;
}

/**
 * Update student
 */
export async function updateStudent(id: string, input: UpdateStudentInput): Promise<Student> {
  const existing = await prisma.student.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!existing) {
    throw ApiError.notFound("Student not found");
  }

  const student = await prisma.$transaction(async (tx) => {
    // Update student
    const updated = await tx.student.update({
      where: { id },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.email && { email: input.email }),
        ...(input.programId && { programId: input.programId }),
        ...(input.curriculumId && { curriculumId: input.curriculumId }),
        ...(input.batch && { batch: input.batch }),
        ...(input.currentSemester && { currentSemester: input.currentSemester }),
        ...(input.status && { 
          status: input.status,
          statusChangedAt: new Date(),
          statusReason: input.statusReason,
        }),
        ...(input.dateOfBirth && { dateOfBirth: new Date(input.dateOfBirth) }),
        ...(input.phone !== undefined && { phone: input.phone }),
        ...(input.address !== undefined && { address: input.address }),
        ...(input.guardianName !== undefined && { guardianName: input.guardianName }),
        ...(input.guardianPhone !== undefined && { guardianPhone: input.guardianPhone }),
      },
      include: {
        user: true,
        program: true,
        curriculum: true,
      },
    });

    // Update user name if provided
    if (input.name) {
      await tx.user.update({
        where: { id: existing.userId },
        data: { name: input.name },
      });
    }

    return updated;
  });

  logger.info({ studentId: id, updates: Object.keys(input) }, "Student updated");
  return student;
}

/**
 * Update student status
 */
export async function updateStudentStatus(
  id: string, 
  input: UpdateStudentStatusInput
): Promise<Student> {
  const existing = await prisma.student.findUnique({ where: { id } });

  if (!existing) {
    throw ApiError.notFound("Student not found");
  }

  const student = await prisma.student.update({
    where: { id },
    data: {
      status: input.status,
      statusReason: input.reason,
      statusChangedAt: new Date(),
    },
    include: {
      user: true,
      program: true,
    },
  });

  logger.info({ studentId: id, status: input.status }, "Student status updated");
  return student;
}

/**
 * List students with filters
 */
export async function listStudents(query: ListStudentsQuery) {
  const { programId, batch, admissionYear, status, search, page, limit } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.StudentWhereInput = {};

  if (programId) where.programId = programId;
  if (batch) where.batch = batch;
  if (admissionYear) where.admissionYear = admissionYear;
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { enrollmentNumber: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            status: true,
          },
        },
        program: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.student.count({ where }),
  ]);

  return {
    data: students,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Bulk import students
 */
export async function bulkImportStudents(input: BulkImportInput, createdBy: string) {
  const results = {
    success: [] as string[],
    errors: [] as { enrollmentNumber: string; error: string }[],
  };

  for (const studentData of input.students) {
    try {
      const student = await createStudent(studentData);
      results.success.push(student.enrollmentNumber);
    } catch (error) {
      results.errors.push({
        enrollmentNumber: studentData.enrollmentNumber,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  logger.info({ 
    createdBy, 
    successCount: results.success.length, 
    errorCount: results.errors.length 
  }, "Bulk import completed");

  return results;
}

/**
 * Get student statistics
 */
export async function getStudentStats() {
  const [total, byStatus, byProgram, byBatch] = await Promise.all([
    prisma.student.count(),
    prisma.student.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    prisma.student.groupBy({
      by: ["programId"],
      _count: { programId: true },
    }),
    prisma.student.groupBy({
      by: ["batch"],
      _count: { batch: true },
      orderBy: { batch: "desc" },
      take: 5,
    }),
  ]);

  // Get program names
  const programIds = byProgram.map((p) => p.programId);
  const programs = await prisma.program.findMany({
    where: { id: { in: programIds } },
    select: { id: true, name: true, code: true },
  });

  const programMap = new Map(programs.map((p) => [p.id, p]));

  return {
    total,
    byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count.status])),
    byProgram: byProgram.map((p) => ({
      program: programMap.get(p.programId),
      count: p._count.programId,
    })),
    byBatch: byBatch.map((b) => ({
      batch: b.batch,
      count: b._count.batch,
    })),
  };
}

/**
 * Get academic progress for a student
 */
export async function getStudentAcademicProgress(id: string) {
  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      program: true,
      curriculum: {
        include: {
          semesters: {
            include: { courses: true },
          },
        },
      },
      semesterResults: {
        include: {
          courseResults: {
            include: { course: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      credentials: {
        where: { status: "ISSUED" },
      },
    },
  });

  if (!student) {
    throw ApiError.notFound("Student not found");
  }

  return {
    student: {
      id: student.id,
      name: student.name,
      enrollmentNumber: student.enrollmentNumber,
      program: student.program,
      batch: student.batch,
      currentSemester: student.currentSemester,
      cgpa: student.cgpa,
      totalCredits: student.totalCredits,
    },
    semesterResults: student.semesterResults,
    credentials: student.credentials,
  };
}
