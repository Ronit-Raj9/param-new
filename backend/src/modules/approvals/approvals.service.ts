import { prisma } from "../../config/database.js";
import { ApiError } from "../../middleware/error.handler.js";
import { createLogger } from "../../utils/logger.js";
import type { Approval, ApprovalType, Prisma } from "@prisma/client";
import type { CreateApprovalInput, ReviewApprovalInput, ListApprovalsQuery } from "./approvals.schema.js";

const logger = createLogger("approvals-service");

/**
 * Create an approval request
 */
export async function createApproval(input: CreateApprovalInput, _createdBy: string): Promise<Approval> {
  const approval = await prisma.approval.create({
    data: {
      type: input.type,
      entityType: input.entityType,
      entityId: input.entityId,
      step: input.step || 1,
      status: "PENDING",
      note: input.description,
    },
  });

  logger.info({ approvalId: approval.id, type: input.type }, "Approval created");
  return approval;
}

/**
 * Review an approval
 */
export async function reviewApproval(
  id: string,
  input: ReviewApprovalInput,
  reviewedBy: string
): Promise<Approval> {
  const existing = await prisma.approval.findUnique({
    where: { id },
  });

  if (!existing) {
    throw ApiError.notFound("Approval not found");
  }

  if (existing.status !== "PENDING") {
    throw ApiError.badRequest("Approval already reviewed");
  }

  // If rejected, mark as rejected
  if (input.status === "REJECTED") {
    const approval = await prisma.approval.update({
      where: { id },
      data: {
        status: "REJECTED",
        approverId: reviewedBy,
        decidedAt: new Date(),
        note: input.comments,
      },
    });

    logger.info({ approvalId: id, status: "REJECTED" }, "Approval rejected");
    return approval;
  }

  // If approved
  const approval = await prisma.approval.update({
    where: { id },
    data: {
      status: "APPROVED",
      approverId: reviewedBy,
      decidedAt: new Date(),
      note: input.comments,
    },
  });

  logger.info({ approvalId: id, status: "APPROVED" }, "Approval approved");
  return approval;
}

/**
 * Get approval by ID
 */
export async function getApprovalById(id: string): Promise<Approval> {
  const approval = await prisma.approval.findUnique({
    where: { id },
    include: {
      approver: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!approval) {
    throw ApiError.notFound("Approval not found");
  }

  return approval;
}

/**
 * Get approvals for an entity
 */
export async function getEntityApprovals(entityType: string, entityId: string) {
  return prisma.approval.findMany({
    where: { entityType, entityId },
    include: {
      approver: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * List approvals with filters
 */
export async function listApprovals(query: ListApprovalsQuery) {
  const { type, status, entityType, page, limit } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.ApprovalWhereInput = {};

  if (type) where.type = type;
  if (status) where.status = status;
  if (entityType) where.entityType = entityType;

  const [approvals, total] = await Promise.all([
    prisma.approval.findMany({
      where,
      include: {
        approver: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.approval.count({ where }),
  ]);

  return {
    data: approvals,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

/**
 * Get pending approvals count for dashboard
 */
export async function getPendingApprovalsCount(): Promise<Record<string, number>> {
  const counts = await prisma.approval.groupBy({
    by: ["type"],
    where: { status: "PENDING" },
    _count: true,
  });

  return counts.reduce(
    (acc, item) => ({
      ...acc,
      [item.type]: item._count,
    }),
    {} as Record<string, number>
  );
}

/**
 * Get approval history for entity
 */
export async function getApprovalHistory(entityType: string, entityId: string) {
  return prisma.approval.findMany({
    where: { entityType, entityId },
    include: {
      approver: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}
