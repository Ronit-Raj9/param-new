import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/error.handler.js";
import * as approvalsService from "./approvals.service.js";
import { createAuditLog } from "../audit/audit.service.js";
import {
  createApprovalSchema,
  reviewApprovalSchema,
  listApprovalsSchema,
} from "./approvals.schema.js";

/**
 * POST /api/v1/approvals
 * Create an approval request
 */
export const createApproval = asyncHandler(async (req: Request, res: Response) => {
  const { body } = createApprovalSchema.parse({ body: req.body });
  
  const approval = await approvalsService.createApproval(body, req.user!.id);
  
  await createAuditLog({
    action: "DEGREE_PROPOSED",
    actorId: req.user!.id,
    entityType: "Approval",
    entityId: approval.id,
    metadata: { type: body.type, entityType: body.entityType, entityId: body.entityId },
    ipAddress: req.ip,
  });

  res.status(201).json({ success: true, data: approval });
});

/**
 * PATCH /api/v1/approvals/:id
 * Review an approval
 */
export const reviewApproval = asyncHandler(async (req: Request, res: Response) => {
  const { params, body } = reviewApprovalSchema.parse({
    params: req.params,
    body: req.body,
  });

  const approval = await approvalsService.reviewApproval(params.id, body, req.user!.id);
  
  await createAuditLog({
    action: body.status === "APPROVED" ? "DEGREE_APPROVED" : "DEGREE_REJECTED",
    actorId: req.user!.id,
    entityType: "Approval",
    entityId: approval.id,
    metadata: { status: body.status, comments: body.comments },
    ipAddress: req.ip,
  });

  res.json({ success: true, data: approval });
});

/**
 * GET /api/v1/approvals/:id
 * Get approval by ID
 */
export const getApproval = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params["id"] as string;
  const approval = await approvalsService.getApprovalById(id);
  res.json({ success: true, data: approval });
});

/**
 * GET /api/v1/approvals/entity/:entityType/:entityId
 * Get approvals for an entity
 */
export const getEntityApprovals = asyncHandler(async (req: Request, res: Response) => {
  const entityType = req.params["entityType"] as string;
  const entityId = req.params["entityId"] as string;
  const approvals = await approvalsService.getEntityApprovals(entityType, entityId);
  res.json({ success: true, data: approvals });
});

/**
 * GET /api/v1/approvals
 * List approvals with filters
 */
export const listApprovals = asyncHandler(async (req: Request, res: Response) => {
  const { query } = listApprovalsSchema.parse({ query: req.query });
  const result = await approvalsService.listApprovals(query);
  res.json({ success: true, data: result.data, pagination: result.pagination });
});

/**
 * GET /api/v1/approvals/pending/count
 * Get pending approvals count
 */
export const getPendingCount = asyncHandler(async (_req: Request, res: Response) => {
  const counts = await approvalsService.getPendingApprovalsCount();
  res.json({ success: true, data: counts });
});
