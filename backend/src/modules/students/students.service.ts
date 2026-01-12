import { prisma } from "../../config/database.js";
import { ApiError } from "../../middleware/error.handler.js";
import { createLogger } from "../../utils/logger.js";
import { sendActivationEmail } from "../../services/email.service.js";
import { env } from "../../config/env.js";
import { randomBytes } from "crypto";
import type { Student, Prisma } from "@prisma/client";
import type {
  CreateStudentInput,
  UpdateStudentInput,
  ListStudentsQuery,
  BulkImportInput,
  UpdateStudentStatusInput
} from "./students.schema.js";

const logger = createLogger("students-service");

import { createPrivyWallet } from "../../config/privy.js";

// ... imports

/**
 * Generate a secure activation token
 */
function generateActivationToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Create a new student with associated user and send activation email
 */
export async function createStudent(input: CreateStudentInput, options?: { sendEmail?: boolean }): Promise<Student> {
  const shouldSendEmail = options?.sendEmail ?? true;

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

  // Create Privy wallet for the student
  logger.info({ enrollmentNumber: input.enrollmentNumber }, "Creating Privy wallet for new student");
  const wallet = await createPrivyWallet();

  if (!wallet) {
    throw new Error("Failed to create Privy wallet for student");
  }

  // Create user, student, and activation token in transaction
  const { student, activationToken } = await prisma.$transaction(async (tx) => {
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
        // Store the wallet info
        walletId: wallet.id,
        walletAddress: wallet.address,
        walletCreatedAt: new Date(),
      },
      include: {
        user: true,
        program: true,
        curriculum: true,
      },
    });

    // Create activation token (7 days expiry)
    const token = generateActivationToken();
    const activationTokenRecord = await tx.activationToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return { student: newStudent, activationToken: activationTokenRecord };
  });

  logger.info({
    studentId: student.id,
    enrollmentNumber: input.enrollmentNumber,
    walletAddress: wallet.address
  }, "Student created with wallet");

  // Send activation email (non-blocking)
  if (shouldSendEmail) {
    const activationLink = `${env.FRONTEND_URL}/activate?token=${activationToken.token}`;
    sendActivationEmail({
      to: input.email,
      name: input.name,
      enrollmentNumber: input.enrollmentNumber,
      activationLink,
    }).catch((error) => {
      logger.error({ error, studentId: student.id }, "Failed to send activation email");
    });
  }

  return student;
}

/**
 * Resend activation email for a student
 */
export async function resendActivationEmail(studentId: string): Promise<{ sent: boolean; message: string }> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { user: true },
  });

  if (!student) {
    throw ApiError.notFound("Student not found");
  }

  if (student.status !== "PENDING_ACTIVATION") {
    return { sent: false, message: "Student is already activated" };
  }

  // Invalidate any existing tokens
  await prisma.activationToken.updateMany({
    where: { userId: student.userId, used: false },
    data: { used: true },
  });

  // Create new activation token
  const token = generateActivationToken();
  await prisma.activationToken.create({
    data: {
      token,
      userId: student.userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  // Send email
  const activationLink = `${env.FRONTEND_URL}/activate?token=${token}`;
  const sent = await sendActivationEmail({
    to: student.email,
    name: student.name,
    enrollmentNumber: student.enrollmentNumber,
    activationLink,
  });

  logger.info({ studentId, email: student.email, sent }, "Activation email resent");

  return { sent, message: sent ? "Activation email sent successfully" : "Failed to send email" };
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

import {
  queueSyncStudent,
  queueIssueCertificate
} from "../../queues/blockchain.queue.js";

// ... (existing imports)

/**
 * Get student by user ID
 * Also auto-activates the student if they are still pending (since accessing this means they successfully logged in)
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
          privyId: true,
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
    return null;
  }

  // Auto-activate student if they are pending but have successfully logged in
  // (accessing this endpoint means they authenticated via Privy)
  if (student.status === "PENDING_ACTIVATION") {
    logger.info({ studentId: student.id, userId }, "Auto-activating student on profile access");

    await prisma.$transaction(async (tx) => {
      // Activate student
      await tx.student.update({
        where: { id: student.id },
        data: {
          status: "ACTIVE",
          statusChangedAt: new Date(),
          statusReason: "Auto-activated on first login",
        },
      });

      // Activate user if also pending
      if (student.user?.status === "PENDING_ACTIVATION") {
        await tx.user.update({
          where: { id: userId },
          data: {
            status: "ACTIVE",
            activatedAt: new Date(),
          },
        });
      }
    });

    // Update the returned student object with new status
    student.status = "ACTIVE";
    if (student.user) {
      student.user.status = "ACTIVE";
    }

    logger.info({ studentId: student.id }, "Student auto-activated successfully");

    // BLOCKCHAIN HOOK: Sync student to chain
    queueSyncStudent(student.id).catch((err) =>
      logger.error({ err, studentId: student.id }, "Failed to queue student sync")
    );
  }

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

  // BLOCKCHAIN HOOKS
  try {
    if (input.status === "ACTIVE") {
      // Sync to chain when activated
      await queueSyncStudent(id);
    } else if (input.status === "DROPPED_OUT" || input.status === "EARLY_EXIT") {
      // Issue certificate for incomplete studies
      // Calculate years completed based on current semester or admission year
      const yearsCompleted = student.currentSemester ? Math.floor(student.currentSemester / 2) : 0;

      if (yearsCompleted >= 1) { // Only issue if at least 1 year completed
        await queueIssueCertificate(
          id,
          yearsCompleted,
          input.reason || input.status
        );
      }
    }
  } catch (error) {
    logger.error({ error, studentId: id }, "Failed to trigger blockchain hook");
    // Don't fail the request, just log error
  }

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
