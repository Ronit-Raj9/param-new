import { prisma } from "../../config/database.js";
import { ApiError } from "../../middleware/error.handler.js";
import { createLogger } from "../../utils/logger.js";
import type { DegreeProposal, Prisma } from "@prisma/client";
import type {
  CreateDegreeProposalInput,
  AcademicReviewInput,
  AdminReviewInput,
  ListDegreeProposalsQuery
} from "./degrees.schema.js";

const logger = createLogger("degrees-service");

import {
  queueProposeDegree,
  queueApproveDegree
} from "../../queues/blockchain.queue.js";

// ... (existing imports)

/**
 * Create a degree proposal
 */
export async function createDegreeProposal(
  input: CreateDegreeProposalInput,
  createdBy: string
): Promise<DegreeProposal> {
  // ... (existing validation logic)
  const student = await prisma.student.findUnique({
    where: { id: input.studentId },
    include: {
      program: true,
      semesterResults: {
        where: { status: "ISSUED" },
      },
    },
  });

  if (!student) {
    throw ApiError.notFound("Student not found");
  }

  if (student.status !== "ACTIVE") {
    throw ApiError.badRequest("Student must be active to propose a degree");
  }

  // Check for existing pending/approved proposal
  const existingProposal = await prisma.degreeProposal.findFirst({
    where: {
      studentId: input.studentId,
      status: { in: ["PENDING_ACADEMIC", "PENDING_ADMIN", "APPROVED"] },
    },
  });

  if (existingProposal) {
    throw ApiError.conflict("Student already has a pending or approved degree proposal");
  }

  // ... (existing logic for credits calculation)
  const issuedResults = student.semesterResults;
  const totalCredits = issuedResults.reduce((sum, r) => sum + r.totalCredits, 0);

  // Calculate CGPA from all course results
  const allCourseResults = await prisma.courseResult.findMany({
    where: {
      semesterResult: {
        studentId: input.studentId,
        status: "ISSUED",
      },
    },
    include: { course: true },
  });

  let cgpa = 0;
  if (allCourseResults.length > 0) {
    const totalWeightedPoints = allCourseResults.reduce(
      (sum, cr) => sum + (cr.course.credits * cr.gradePoints),
      0
    );
    const totalCreditHours = allCourseResults.reduce(
      (sum, cr) => sum + cr.course.credits,
      0
    );
    cgpa = totalCreditHours > 0 ? Number((totalWeightedPoints / totalCreditHours).toFixed(2)) : 0;
  }

  // Check for backlogs (failed courses)
  const hasBacklogs = allCourseResults.some(cr => cr.grade === "F" || cr.gradePoints === 0);

  // Validate eligibility
  const requiredCredits = student.program.totalCredits;
  const validationErrors: string[] = [];

  if (totalCredits < requiredCredits) {
    validationErrors.push(`Insufficient credits: ${totalCredits}/${requiredCredits}`);
  }
  if (hasBacklogs) {
    validationErrors.push("Student has backlogs (failed courses)");
  }

  const validationPassed = validationErrors.length === 0;

  const proposal = await prisma.degreeProposal.create({
    data: {
      studentId: input.studentId,
      expectedYear: input.expectedYear,
      notes: input.notes,
      totalCredits,
      cgpa,
      hasBacklogs,
      validationPassed,
      validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
      status: "PENDING_ACADEMIC",
    },
  });

  logger.info({ proposalId: proposal.id, studentId: input.studentId }, "Degree proposal created");

  // BLOCKCHAIN HOOK: Propose on chain if it's pending academic (or admin?)
  // Actually, we usually wait for Academic approval before proposing to chain?
  // The plan said "Proposal (Frontend: 'Propose Degree') -> queueProposeDegree".
  // Let's assume we propose on chain when it reaches PENDING_ADMIN (after academic review)? 
  // OR if we skip academic review. 
  // The contracts have proposeDegree -> approveDegree -> finalizeDegree.
  // proposeDegree is typically done by ACADEMIC_ROLE.
  // Let's hook it here if the status is appropriate, or maybe after academic review?
  // Re-reading plan: "Backend: blockchainService.proposeDegree(...)".
  // Let's put it on PENDING_ADMIN transition, which happens in academicReview or creation if no academic review needed.
  // But here status is PENDING_ACADEMIC.

  // Wait, if we propose on chain now, the blockchain state is "Proposed".
  // Then when Admin approves, it becomes "Approved".
  // If we propose here, it might be too early if Academic rejects it.

  // Let's look at academicReview. If approved there -> PENDING_ADMIN.
  // THAT is logically when "The University" (Academic side) proposes it to the Admin.

  // HOWEVER, the `chainSyncService.proposeDegreeOnChain` checks:
  // `if (proposal.status !== "PENDING_ADMIN") throw ...`
  // So we MUST call it when status is PENDING_ADMIN.

  // So:
  // 1. In `academicReviewDegreeProposal`: If action='approve' -> queueProposeDegree.
  // 2. In `createDegreeProposal`: If we skip academic review (unlikely based on code), check status.
  // The code sets it to PENDING_ACADEMIC. So we DON'T queue here.

  return proposal;
}

// ... (academicReviewDegreeProposal)

/**
 * Academic review of a degree proposal
 */
export async function academicReviewDegreeProposal(
  id: string,
  input: AcademicReviewInput,
  reviewerId: string
): Promise<DegreeProposal> {
  const existing = await prisma.degreeProposal.findUnique({
    where: { id },
    include: { student: true },
  });

  if (!existing) {
    throw ApiError.notFound("Degree proposal not found");
  }

  if (existing.status !== "PENDING_ACADEMIC") {
    throw ApiError.badRequest("Proposal is not pending academic review");
  }

  const newStatus = input.action === "approve" ? "PENDING_ADMIN" : "REJECTED";

  const proposal = await prisma.degreeProposal.update({
    where: { id },
    data: {
      status: newStatus,
      academicApproverId: input.action === "approve" ? reviewerId : undefined,
      academicApprovedAt: input.action === "approve" ? new Date() : undefined,
      academicNote: input.note,
      rejectedBy: input.action === "reject" ? reviewerId : undefined,
      rejectedAt: input.action === "reject" ? new Date() : undefined,
      rejectionReason: input.action === "reject" ? input.note : undefined,
    },
  });

  logger.info({ proposalId: id, status: newStatus }, "Degree proposal academic review completed");

  // BLOCKCHAIN HOOK: Propose on chain if approved by academic
  if (input.action === "approve") {
    queueProposeDegree(id).catch((err) =>
      logger.error({ err, degreeProposalId: id }, "Failed to queue degree proposal")
    );
  }

  return proposal;
}

/**
 * Admin review of a degree proposal (final approval)
 */
export async function adminReviewDegreeProposal(
  id: string,
  input: AdminReviewInput,
  reviewerId: string
): Promise<DegreeProposal> {
  const existing = await prisma.degreeProposal.findUnique({
    where: { id },
    include: { student: true },
  });

  if (!existing) {
    throw ApiError.notFound("Degree proposal not found");
  }

  if (existing.status !== "PENDING_ADMIN") {
    throw ApiError.badRequest("Proposal is not pending admin review");
  }

  const newStatus = input.action === "approve" ? "APPROVED" : "REJECTED";

  const proposal = await prisma.$transaction(async (tx) => {
    const updated = await tx.degreeProposal.update({
      where: { id },
      data: {
        status: newStatus,
        adminApproverId: input.action === "approve" ? reviewerId : undefined,
        adminApprovedAt: input.action === "approve" ? new Date() : undefined,
        adminNote: input.note,
        rejectedBy: input.action === "reject" ? reviewerId : undefined,
        rejectedAt: input.action === "reject" ? new Date() : undefined,
        rejectionReason: input.action === "reject" ? input.note : undefined,
      },
    });

    // If approved, update student status
    if (input.action === "approve") {
      await tx.student.update({
        where: { id: existing.studentId },
        data: { status: "GRADUATED" },
      });
    }

    return updated;
  });

  logger.info({ proposalId: id, status: newStatus }, "Degree proposal admin review completed");

  // BLOCKCHAIN HOOK: Approve on chain if approved by admin
  if (input.action === "approve") {
    queueApproveDegree(id).catch((err) =>
      logger.error({ err, degreeProposalId: id }, "Failed to queue degree approval")
    );
  }

  return proposal;
}

/**
 * Get degree proposal by ID
 */
export async function getDegreeProposalById(id: string) {
  const proposal = await prisma.degreeProposal.findUnique({
    where: { id },
    include: {
      student: {
        include: {
          user: { select: { id: true, name: true, email: true } },
          program: true,
        },
      },
    },
  });

  if (!proposal) {
    throw ApiError.notFound("Degree proposal not found");
  }

  return proposal;
}

/**
 * Get degree proposal for a student
 */
export async function getStudentDegreeProposal(studentId: string) {
  return prisma.degreeProposal.findFirst({
    where: { studentId },
    include: {
      student: {
        include: {
          program: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * List degree proposals
 */
export async function listDegreeProposals(query: ListDegreeProposalsQuery) {
  const { studentId, status, programId, page, limit } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.DegreeProposalWhereInput = {};

  if (studentId) where.studentId = studentId;
  if (status) where.status = status;
  // Filter by programId via student relation
  if (programId) where.student = { programId };

  const [proposals, total] = await Promise.all([
    prisma.degreeProposal.findMany({
      where,
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true } },
            program: { select: { name: true, code: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.degreeProposal.count({ where }),
  ]);

  return {
    data: proposals,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

/**
 * Check if student is eligible for degree
 */
export async function checkDegreeEligibility(studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      program: true,
      semesterResults: {
        where: { status: "ISSUED" },
      },
    },
  });

  if (!student) {
    throw ApiError.notFound("Student not found");
  }

  const totalCredits = student.semesterResults.reduce((sum, r) => sum + r.totalCredits, 0);
  const requiredCredits = student.program.totalCredits;
  const completedSemesters = student.semesterResults.length;
  const requiredSemesters = student.program.totalSemesters;

  // Check for backlogs
  const courseResults = await prisma.courseResult.findMany({
    where: {
      semesterResult: {
        studentId,
        status: "ISSUED",
      },
    },
  });
  const hasBacklogs = courseResults.some(cr => cr.grade === "F" || cr.gradePoints === 0);

  return {
    eligible: totalCredits >= requiredCredits && completedSemesters >= requiredSemesters && !hasBacklogs,
    totalCredits,
    requiredCredits,
    completedSemesters,
    requiredSemesters,
    shortfall: Math.max(0, requiredCredits - totalCredits),
    hasBacklogs,
  };
}
