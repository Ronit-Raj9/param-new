import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/error.handler.js";
import * as degreesService from "./degrees.service.js";
import { createAuditLog } from "../audit/audit.service.js";
import {
  createDegreeProposalSchema,
  academicReviewSchema,
  adminReviewSchema,
  listDegreeProposalsSchema,
} from "./degrees.schema.js";
import { prisma } from "../../config/database.js";

/**
 * POST /api/v1/degrees
 * Create a degree proposal
 */
export const createDegreeProposal = asyncHandler(async (req: Request, res: Response) => {
  const { body } = createDegreeProposalSchema.parse({ body: req.body });
  
  const proposal = await degreesService.createDegreeProposal(body, req.user!.id);
  
  await createAuditLog({
    action: "DEGREE_PROPOSED",
    actorId: req.user!.id,
    actorRole: req.user!.role,
    entityType: "DegreeProposal",
    entityId: proposal.id,
    metadata: { studentId: body.studentId, expectedYear: body.expectedYear },
    ipAddress: req.ip,
  });

  res.status(201).json({ success: true, data: proposal });
});

/**
 * PATCH /api/v1/degrees/:id/academic-review
 * Academic review of a degree proposal
 */
export const academicReviewDegreeProposal = asyncHandler(async (req: Request, res: Response) => {
  const { params, body } = academicReviewSchema.parse({
    params: req.params,
    body: req.body,
  });

  const proposal = await degreesService.academicReviewDegreeProposal(params.id, body, req.user!.id);
  
  await createAuditLog({
    action: body.action === "approve" ? "DEGREE_APPROVED" : "DEGREE_REJECTED",
    actorId: req.user!.id,
    actorRole: req.user!.role,
    entityType: "DegreeProposal",
    entityId: proposal.id,
    metadata: { action: body.action, note: body.note, stage: "academic" },
    ipAddress: req.ip,
  });

  res.json({ success: true, data: proposal });
});

/**
 * PATCH /api/v1/degrees/:id/admin-review
 * Admin review of a degree proposal (final approval)
 */
export const adminReviewDegreeProposal = asyncHandler(async (req: Request, res: Response) => {
  const { params, body } = adminReviewSchema.parse({
    params: req.params,
    body: req.body,
  });

  const proposal = await degreesService.adminReviewDegreeProposal(params.id, body, req.user!.id);
  
  await createAuditLog({
    action: body.action === "approve" ? "DEGREE_APPROVED" : "DEGREE_REJECTED",
    actorId: req.user!.id,
    actorRole: req.user!.role,
    entityType: "DegreeProposal",
    entityId: proposal.id,
    metadata: { action: body.action, note: body.note, stage: "admin" },
    ipAddress: req.ip,
  });

  res.json({ success: true, data: proposal });
});

/**
 * GET /api/v1/degrees/:id
 * Get degree proposal by ID
 */
export const getDegreeProposal = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id;
  if (!id || Array.isArray(id)) {
    res.status(400).json({
      success: false,
      error: { code: "BAD_REQUEST", message: "Proposal ID is required" },
    });
    return;
  }
  const proposal = await degreesService.getDegreeProposalById(id);
  res.json({ success: true, data: proposal });
});

/**
 * GET /api/v1/degrees/me
 * Get my degree proposal (for students)
 */
export const getMyDegreeProposal = asyncHandler(async (req: Request, res: Response) => {
  const student = await prisma.student.findUnique({
    where: { userId: req.user!.id },
  });

  if (!student) {
    res.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: "Student profile not found" },
    });
    return;
  }

  const proposal = await degreesService.getStudentDegreeProposal(student.id);
  res.json({ success: true, data: proposal });
});

/**
 * GET /api/v1/degrees/eligibility/:studentId
 * Check degree eligibility
 */
export const checkEligibility = asyncHandler(async (req: Request, res: Response) => {
  const studentId = req.params.studentId;
  if (!studentId || Array.isArray(studentId)) {
    res.status(400).json({
      success: false,
      error: { code: "BAD_REQUEST", message: "Student ID is required" },
    });
    return;
  }
  const eligibility = await degreesService.checkDegreeEligibility(studentId);
  res.json({ success: true, data: eligibility });
});

/**
 * GET /api/v1/degrees/eligibility/me
 * Check my degree eligibility
 */
export const checkMyEligibility = asyncHandler(async (req: Request, res: Response) => {
  const student = await prisma.student.findUnique({
    where: { userId: req.user!.id },
  });

  if (!student) {
    res.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: "Student profile not found" },
    });
    return;
  }

  const eligibility = await degreesService.checkDegreeEligibility(student.id);
  res.json({ success: true, data: eligibility });
});

/**
 * GET /api/v1/degrees
 * List degree proposals
 */
export const listDegreeProposals = asyncHandler(async (req: Request, res: Response) => {
  const { query } = listDegreeProposalsSchema.parse({ query: req.query });
  const result = await degreesService.listDegreeProposals(query);
  res.json({ success: true, data: result.data, pagination: result.pagination });
});
