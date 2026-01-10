import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/error.handler.js";
import * as auditService from "./audit.service.js";
import { z } from "zod";
import type { AuditAction } from "@prisma/client";

const querySchema = z.object({
  actorId: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  action: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
});

/**
 * GET /api/v1/audit
 * Get audit logs with filters
 */
export const getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const query = querySchema.parse(req.query);
  
  const result = await auditService.getAuditLogs({
    ...query,
    action: query.action as AuditAction | undefined,
    startDate: query.startDate ? new Date(query.startDate) : undefined,
    endDate: query.endDate ? new Date(query.endDate) : undefined,
  });

  res.json({
    success: true,
    data: result.data,
    pagination: result.pagination,
  });
});

/**
 * GET /api/v1/audit/:entityType/:entityId
 * Get audit logs for a specific entity
 */
export const getEntityAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const entityType = req.params["entityType"] as string;
  const entityId = req.params["entityId"] as string;
  
  const logs = await auditService.getEntityAuditLogs(entityType, entityId);

  res.json({
    success: true,
    data: logs,
  });
});
