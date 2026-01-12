import { prisma } from "../../config/database.js";
import { ApiError } from "../../middleware/error.handler.js";
import { createLogger } from "../../utils/logger.js";
import { DEFAULT_GRADE_SCALE } from "../../utils/constants.js";
import type { SemesterResult, CourseResult, CorrectionRequest, Prisma } from "@prisma/client";
import type {
  CreateSemesterResultInput,
  BulkUploadResultsInput,
  UpdateCourseResultInput,
  UpdateSemesterResultStatusInput,
  ListResultsQuery,
  CreateCorrectionRequestInput,
  ReviewCorrectionRequestInput,
} from "./results.schema.js";

const logger = createLogger("results-service");

/**
 * Calculate grade from percentage
 */
export function calculateGrade(percentage: number): { grade: string; gradePoints: number } {
  // Find the highest minMarks that the percentage meets
  for (const scale of DEFAULT_GRADE_SCALE) {
    // Skip grades with null minMarks (I, W)
    if (scale.minMarks === null) continue;
    if (percentage >= scale.minMarks) {
      return { grade: scale.grade, gradePoints: scale.gradePoints };
    }
  }

  return { grade: "F", gradePoints: 0 };
}

/**
 * Calculate SGPA for a semester
 */
export function calculateSGPA(courseResults: { credits: number; gradePoints: number }[]): number {
  const totalCredits = courseResults.reduce((sum, cr) => sum + cr.credits, 0);
  const totalPoints = courseResults.reduce((sum, cr) => sum + (cr.credits * cr.gradePoints), 0);

  return totalCredits > 0 ? Number((totalPoints / totalCredits).toFixed(2)) : 0;
}

/**
 * Create semester result with course results
 */
export async function createSemesterResult(input: CreateSemesterResultInput): Promise<SemesterResult> {
  // Verify student exists
  const student = await prisma.student.findUnique({
    where: { id: input.studentId },
    include: { program: true },
  });

  if (!student) {
    throw ApiError.notFound("Student not found");
  }

  // Check for existing result for this semester
  const existing = await prisma.semesterResult.findFirst({
    where: {
      studentId: input.studentId,
      semester: input.semester,
      academicYear: input.academicYear,
    },
  });

  if (existing) {
    throw ApiError.conflict("Result for this semester already exists");
  }

  // Get course details for credit information
  const courseIds = input.courseResults.map((cr) => cr.courseId);
  const courses = await prisma.course.findMany({
    where: { id: { in: courseIds } },
  });

  const courseMap = new Map(courses.map((c) => [c.id, c]));

  // Process results - calculate grades if not provided
  const processedResults = input.courseResults.map((cr) => {
    const course = courseMap.get(cr.courseId);
    if (!course) throw ApiError.badRequest(`Course ${cr.courseId} not found`);

    // If grade not provided, calculate from totalMarks if available
    let grade = cr.grade;
    let gradePoints = cr.gradePoints;

    if (!grade && cr.totalMarks !== undefined) {
      const calculated = calculateGrade(cr.totalMarks);
      grade = calculated.grade;
      gradePoints = calculated.gradePoints;
    }

    // Default grade if still not set
    if (!grade) {
      grade = "F";
      gradePoints = 0;
    }

    // Earned credits = credits if passed (grade != F), 0 otherwise
    const earnedCredits = grade !== "F" ? course.credits : 0;

    return {
      courseId: cr.courseId,
      studentId: input.studentId,
      grade,
      gradePoints: gradePoints ?? 0,
      credits: course.credits,
      earnedCredits,
      internalMarks: cr.internalMarks,
      externalMarks: cr.externalMarks,
      totalMarks: cr.totalMarks,
      attendance: cr.attendance,
    };
  });

  const sgpa = calculateSGPA(processedResults.map((r) => ({
    credits: r.credits,
    gradePoints: r.gradePoints,
  })));

  const totalCredits = processedResults.reduce((sum, r) => sum + r.credits, 0);
  const earnedCredits = processedResults.reduce((sum, r) => sum + r.earnedCredits, 0);

  // Create result in transaction
  const semesterResult = await prisma.$transaction(async (tx) => {
    const result = await tx.semesterResult.create({
      data: {
        studentId: input.studentId,
        semester: input.semester,
        academicYear: input.academicYear,
        sgpa,
        totalCredits,
        earnedCredits,
        status: "DRAFT",
      },
    });

    // Create course results with all required fields
    await tx.courseResult.createMany({
      data: processedResults.map((cr) => ({
        semesterResultId: result.id,
        studentId: cr.studentId,
        courseId: cr.courseId,
        grade: cr.grade,
        gradePoints: cr.gradePoints,
        credits: cr.credits,
        earnedCredits: cr.earnedCredits,
        internalMarks: cr.internalMarks,
        externalMarks: cr.externalMarks,
        totalMarks: cr.totalMarks,
        attendance: cr.attendance,
      })),
    });

    return result;
  });

  logger.info({
    semesterResultId: semesterResult.id,
    studentId: input.studentId,
    semester: input.semester
  }, "Semester result created");

  return semesterResult;
}

/**
 * Bulk upload results from CSV data
 */
export async function bulkUploadResults(input: BulkUploadResultsInput, uploadedBy: string) {
  const results = {
    success: [] as string[],
    errors: [] as { enrollmentNumber: string; error: string }[],
  };

  // Group results by student
  const resultsByStudent = new Map<string, typeof input.results>();

  for (const result of input.results) {
    if (!resultsByStudent.has(result.enrollmentNumber)) {
      resultsByStudent.set(result.enrollmentNumber, []);
    }
    resultsByStudent.get(result.enrollmentNumber)!.push(result);
  }

  // Get all courses for the program
  const curriculum = await prisma.curriculum.findFirst({
    where: { programId: input.programId, status: "ACTIVE" },
    include: {
      semesters: {
        where: { semesterNumber: input.semester },
        include: { courses: true },
      },
    },
  });

  if (!curriculum || curriculum.semesters.length === 0) {
    throw ApiError.notFound("Active curriculum not found for this program/semester");
  }

  const semesterData = curriculum.semesters[0];
  if (!semesterData) {
    throw ApiError.notFound("Semester data not found");
  }
  const courses = semesterData.courses;
  const courseMap = new Map(courses.map((c) => [c.code, c]));

  // Process each student
  for (const [enrollmentNumber, studentResults] of resultsByStudent) {
    try {
      const student = await prisma.student.findUnique({
        where: { enrollmentNumber },
      });

      if (!student) {
        results.errors.push({ enrollmentNumber, error: "Student not found" });
        continue;
      }

      // Check for existing result
      const existing = await prisma.semesterResult.findFirst({
        where: {
          studentId: student.id,
          semester: input.semester,
          academicYear: input.academicYear,
        },
      });

      if (existing) {
        results.errors.push({ enrollmentNumber, error: "Result already exists" });
        continue;
      }

      // Map course codes to course IDs and build course results
      const courseResults = studentResults.map((sr) => {
        const course = courseMap.get(sr.courseCode);
        if (!course) throw new Error(`Course ${sr.courseCode} not found`);

        // Calculate grade from totalMarks if provided
        let grade = sr.grade;
        let gradePoints = sr.gradePoints;

        if (!grade && sr.totalMarks !== undefined) {
          const calculated = calculateGrade(sr.totalMarks);
          grade = calculated.grade;
          gradePoints = calculated.gradePoints;
        }

        if (!grade) {
          grade = "F";
          gradePoints = 0;
        }

        const earnedCredits = grade !== "F" ? course.credits : 0;

        return {
          courseId: course.id,
          studentId: student.id,
          grade,
          gradePoints: gradePoints ?? 0,
          credits: course.credits,
          earnedCredits,
          internalMarks: sr.internalMarks,
          externalMarks: sr.externalMarks,
          totalMarks: sr.totalMarks,
        };
      });

      const sgpa = calculateSGPA(courseResults);
      const totalCredits = courseResults.reduce((sum, cr) => sum + cr.credits, 0);
      const earnedCredits = courseResults.reduce((sum, cr) => sum + cr.earnedCredits, 0);

      await prisma.$transaction(async (tx) => {
        const result = await tx.semesterResult.create({
          data: {
            studentId: student.id,
            semester: input.semester,
            academicYear: input.academicYear,
            sgpa,
            totalCredits,
            earnedCredits,
            status: "DRAFT",
          },
        });

        await tx.courseResult.createMany({
          data: courseResults.map((cr) => ({
            semesterResultId: result.id,
            studentId: cr.studentId,
            courseId: cr.courseId,
            grade: cr.grade,
            gradePoints: cr.gradePoints,
            credits: cr.credits,
            earnedCredits: cr.earnedCredits,
            internalMarks: cr.internalMarks,
            externalMarks: cr.externalMarks,
            totalMarks: cr.totalMarks,
          })),
        });
      });

      results.success.push(enrollmentNumber);
    } catch (error) {
      results.errors.push({
        enrollmentNumber,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  logger.info({
    uploadedBy,
    semester: input.semester,
    successCount: results.success.length,
    errorCount: results.errors.length
  }, "Bulk result upload completed");

  return results;
}

/**
 * Get semester result by ID
 */
export async function getSemesterResultById(id: string) {
  const result = await prisma.semesterResult.findUnique({
    where: { id },
    include: {
      student: {
        include: {
          user: { select: { name: true, email: true } },
          program: true,
        },
      },
      courseResults: {
        include: {
          course: true,
        },
        orderBy: { course: { code: "asc" } },
      },
    },
  });

  if (!result) {
    throw ApiError.notFound("Semester result not found");
  }

  return result;
}

/**
 * Get student's all results
 */
export async function getStudentResults(studentId: string) {
  const results = await prisma.semesterResult.findMany({
    where: { studentId },
    include: {
      courseResults: {
        include: {
          course: true,
        },
        orderBy: { course: { code: "asc" } },
      },
      credential: {
        select: {
          id: true,
          tokenId: true,
          txHash: true,
          status: true,
          contractAddress: true,
        },
      },
    },
    orderBy: { semester: "asc" },
  });

  // Calculate CGPA
  const allCredits = results.flatMap((r) =>
    r.courseResults.map((cr) => ({
      credits: cr.credits,
      gradePoints: cr.gradePoints,
    }))
  );

  const cgpa = calculateSGPA(allCredits);

  return { results, cgpa };
}

/**
 * Update course result
 */
export async function updateCourseResult(id: string, input: UpdateCourseResultInput): Promise<CourseResult> {
  const existing = await prisma.courseResult.findUnique({
    where: { id },
    include: {
      semesterResult: true,
      course: true,
    },
  });

  if (!existing) {
    throw ApiError.notFound("Course result not found");
  }

  // Only allow updates in DRAFT status
  if (existing.semesterResult.status !== "DRAFT") {
    throw ApiError.forbidden("Cannot update result that is not in draft status");
  }

  // Recalculate grade if totalMarks changed and grade not explicitly provided
  let grade = input.grade;
  let gradePoints = input.gradePoints;

  if (input.totalMarks !== undefined && !input.grade) {
    const calculated = calculateGrade(input.totalMarks);
    grade = calculated.grade;
    gradePoints = calculated.gradePoints;
  }

  // Determine earnedCredits based on grade
  const finalGrade = grade || existing.grade;
  const earnedCredits = finalGrade !== "F" ? existing.credits : 0;

  const result = await prisma.courseResult.update({
    where: { id },
    data: {
      ...(input.internalMarks !== undefined && { internalMarks: input.internalMarks }),
      ...(input.externalMarks !== undefined && { externalMarks: input.externalMarks }),
      ...(input.totalMarks !== undefined && { totalMarks: input.totalMarks }),
      ...(grade && { grade }),
      ...(gradePoints !== undefined && { gradePoints }),
      ...(input.attendance !== undefined && { attendance: input.attendance }),
      earnedCredits,
    },
  });

  // Recalculate SGPA
  const allCourseResults = await prisma.courseResult.findMany({
    where: { semesterResultId: existing.semesterResultId },
    include: { course: true },
  });

  const sgpa = calculateSGPA(allCourseResults.map((cr) => ({
    credits: cr.credits,
    gradePoints: cr.gradePoints,
  })));

  const totalEarnedCredits = allCourseResults.reduce((sum, cr) => sum + cr.earnedCredits, 0);

  await prisma.semesterResult.update({
    where: { id: existing.semesterResultId },
    data: { sgpa, earnedCredits: totalEarnedCredits },
  });

  logger.info({ courseResultId: id, updates: input }, "Course result updated");
  return result;
}

import { queueSyncSemesterResult } from "../../queues/blockchain.queue.js";

// ... (existing imports)

/**
 * Update semester result status
 */
export async function updateSemesterResultStatus(
  id: string,
  input: UpdateSemesterResultStatusInput,
  updatedBy: string
): Promise<SemesterResult> {
  const existing = await prisma.semesterResult.findUnique({
    where: { id },
  });

  if (!existing) {
    throw ApiError.notFound("Semester result not found");
  }

  // Validate status transitions based on ResultStatus enum
  // DRAFT -> REVIEWED -> APPROVED -> ISSUED -> WITHHELD
  const validTransitions: Record<string, string[]> = {
    DRAFT: ["REVIEWED"],
    REVIEWED: ["APPROVED", "DRAFT"],
    APPROVED: ["ISSUED", "REVIEWED"],
    ISSUED: ["WITHHELD"],
    WITHHELD: [],
  };

  if (!validTransitions[existing.status]?.includes(input.status)) {
    throw ApiError.badRequest(`Invalid status transition from ${existing.status} to ${input.status}`);
  }

  // Build update data based on new status
  const updateData: Prisma.SemesterResultUpdateInput = {
    status: input.status,
  };

  if (input.status === "REVIEWED") {
    updateData.reviewedBy = updatedBy;
    updateData.reviewedAt = new Date();
  } else if (input.status === "APPROVED") {
    updateData.approvedBy = updatedBy;
    updateData.approvedAt = new Date();
    if (input.approvalNote) {
      updateData.approvalNote = input.approvalNote;
    }
  }

  const result = await prisma.semesterResult.update({
    where: { id },
    data: updateData,
  });

  logger.info({
    semesterResultId: id,
    previousStatus: existing.status,
    newStatus: input.status,
    updatedBy
  }, "Semester result status updated");

  // BLOCKCHAIN HOOK: Sync to chain on approval
  // This will mint the NFT and eventually update status to ISSUED
  if (input.status === "APPROVED") {
    queueSyncSemesterResult(id).catch((err) =>
      logger.error({ err, semesterResultId: id }, "Failed to queue semester result sync")
    );
  }

  return result;
}

/**
 * List results with filters
 */
export async function listResults(query: ListResultsQuery) {
  const { studentId, programId, semester, academicYear, status, batchYear, page, limit } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.SemesterResultWhereInput = {};

  if (studentId) where.studentId = studentId;
  if (semester) where.semester = semester;
  if (academicYear) where.academicYear = academicYear;
  if (status) where.status = status;

  if (programId || batchYear) {
    where.student = {};
    if (programId) where.student.programId = programId;
    if (batchYear) where.student.admissionYear = batchYear;
  }

  const [results, total] = await Promise.all([
    prisma.semesterResult.findMany({
      where,
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true } },
            program: { select: { name: true, code: true } },
          },
        },
        courseResults: {
          include: {
            course: { select: { code: true, name: true } },
          },
          orderBy: { course: { code: "asc" } },
        },
      },
      orderBy: [{ academicYear: "desc" }, { semester: "asc" }],
      skip,
      take: limit,
    }),
    prisma.semesterResult.count({ where }),
  ]);

  return {
    data: results,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// ============ CORRECTION REQUESTS ============

/**
 * Create correction request
 * CorrectionRequest model has: studentId, requesterId, entityType, entityId, field, oldValue, newValue, reason, supportingDocs
 */
export async function createCorrectionRequest(
  input: CreateCorrectionRequestInput,
  userId: string
): Promise<CorrectionRequest> {
  // Get the student for the current user
  const student = await prisma.student.findUnique({
    where: { userId },
  });

  if (!student) {
    throw ApiError.notFound("Student profile not found");
  }

  // Verify the entity exists and belongs to this student
  if (input.entityType === "SemesterResult") {
    const semesterResult = await prisma.semesterResult.findUnique({
      where: { id: input.entityId },
    });
    if (!semesterResult) {
      throw ApiError.notFound("Semester result not found");
    }
    if (semesterResult.studentId !== student.id) {
      throw ApiError.forbidden("You can only request corrections for your own results");
    }
  } else if (input.entityType === "CourseResult") {
    const courseResult = await prisma.courseResult.findUnique({
      where: { id: input.entityId },
    });
    if (!courseResult) {
      throw ApiError.notFound("Course result not found");
    }
    if (courseResult.studentId !== student.id) {
      throw ApiError.forbidden("You can only request corrections for your own results");
    }
  }

  const correction = await prisma.correctionRequest.create({
    data: {
      studentId: student.id,
      requesterId: userId,
      entityType: input.entityType,
      entityId: input.entityId,
      field: input.field,
      oldValue: input.oldValue,
      newValue: input.newValue,
      reason: input.reason,
      supportingDocs: input.supportingDocs || [],
      status: "PENDING",
    },
  });

  logger.info({ correctionId: correction.id, userId }, "Correction request created");
  return correction;
}

/**
 * Review correction request
 */
export async function reviewCorrectionRequest(
  id: string,
  input: ReviewCorrectionRequestInput,
  reviewedBy: string
): Promise<CorrectionRequest> {
  const existing = await prisma.correctionRequest.findUnique({
    where: { id },
  });

  if (!existing) {
    throw ApiError.notFound("Correction request not found");
  }

  if (existing.status !== "PENDING") {
    throw ApiError.badRequest("Correction request already reviewed");
  }

  const correction = await prisma.$transaction(async (tx) => {
    // Update correction request
    const updated = await tx.correctionRequest.update({
      where: { id },
      data: {
        status: input.status,
        reviewedBy,
        reviewedAt: new Date(),
        reviewNote: input.reviewNote,
      },
    });

    // If approved, update the entity with the new value
    if (input.status === "APPROVED") {
      if (existing.entityType === "CourseResult") {
        const updateData: Prisma.CourseResultUpdateInput = {};

        // Update the specific field that was corrected
        if (existing.field === "grade") {
          updateData.grade = existing.newValue;
          // Also update earnedCredits based on new grade
          const courseResult = await tx.courseResult.findUnique({
            where: { id: existing.entityId },
          });
          if (courseResult) {
            updateData.earnedCredits = existing.newValue !== "F" ? courseResult.credits : 0;
          }
        } else if (existing.field === "gradePoints") {
          updateData.gradePoints = parseFloat(existing.newValue);
        } else if (existing.field === "totalMarks") {
          updateData.totalMarks = parseFloat(existing.newValue);
        } else if (existing.field === "internalMarks") {
          updateData.internalMarks = parseFloat(existing.newValue);
        } else if (existing.field === "externalMarks") {
          updateData.externalMarks = parseFloat(existing.newValue);
        }

        if (Object.keys(updateData).length > 0) {
          await tx.courseResult.update({
            where: { id: existing.entityId },
            data: updateData,
          });
        }
      }
      // SemesterResult corrections would be handled similarly
    }

    return updated;
  });

  logger.info({ correctionId: id, status: input.status, reviewedBy }, "Correction request reviewed");
  return correction;
}

/**
 * Get correction requests
 */
export async function getCorrectionRequests(filters: {
  studentId?: string;
  status?: string;
  page: number;
  limit: number;
}) {
  const { studentId, status, page, limit } = filters;
  const skip = (page - 1) * limit;

  const where: Prisma.CorrectionRequestWhereInput = {};

  if (studentId) {
    // Find student by userId
    const student = await prisma.student.findUnique({
      where: { userId: studentId },
    });
    if (student) {
      where.studentId = student.id;
    }
  }
  if (status) where.status = status as CorrectionRequest["status"];

  const [requests, total] = await Promise.all([
    prisma.correctionRequest.findMany({
      where,
      include: {
        student: {
          include: { user: { select: { name: true, email: true } } },
        },
        requester: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.correctionRequest.count({ where }),
  ]);

  return {
    data: requests,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
