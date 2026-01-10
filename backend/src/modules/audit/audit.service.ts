import { prisma } from "../../config/database.js";
import { createLogger } from "../../utils/logger.js";
import type { AuditAction, Prisma, Role } from "@prisma/client";

const logger = createLogger("audit-service");

export interface CreateAuditLogInput {
  action: AuditAction;
  actorId?: string;
  actorRole?: Role;
  entityType?: string;
  entityId?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(input: CreateAuditLogInput) {
  try {
    const log = await prisma.auditLog.create({
      data: {
        action: input.action,
        actorId: input.actorId,
        actorRole: input.actorRole,
        entityType: input.entityType,
        entityId: input.entityId,
        description: input.description,
        metadata: input.metadata as Prisma.JsonObject || {},
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });
    return log;
  } catch (error) {
    // Don't fail the main operation if audit logging fails
    logger.error({ error, input }, "Failed to create audit log");
    return null;
  }
}

export interface GetAuditLogsInput {
  actorId?: string;
  entityType?: string;
  entityId?: string;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

/**
 * Get audit logs with filters
 */
export async function getAuditLogs(input: GetAuditLogsInput) {
  const page = input.page || 1;
  const limit = input.limit || 50;
  const skip = (page - 1) * limit;

  const where: Prisma.AuditLogWhereInput = {};

  if (input.actorId) where.actorId = input.actorId;
  if (input.entityType) where.entityType = input.entityType;
  if (input.entityId) where.entityId = input.entityId;
  if (input.action) where.action = input.action;
  
  if (input.startDate || input.endDate) {
    where.createdAt = {};
    if (input.startDate) where.createdAt.gte = input.startDate;
    if (input.endDate) where.createdAt.lte = input.endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    data: logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get audit logs for a specific entity
 */
export async function getEntityAuditLogs(entityType: string, entityId: string) {
  return prisma.auditLog.findMany({
    where: { entityType, entityId },
    include: {
      actor: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get audit logs by actor
 */
export async function getActorAuditLogs(actorId: string, limit = 100) {
  return prisma.auditLog.findMany({
    where: { actorId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
