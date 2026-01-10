import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/error.handler.js";
import { prisma } from "../../config/database.js";
import * as resultsService from "./results.service.js";
import { createAuditLog } from "../audit/audit.service.js";
import {
  createSemesterResultSchema,
  bulkUploadResultsSchema,
  updateCourseResultSchema,
  updateSemesterResultStatusSchema,
  listResultsSchema,
  createCorrectionRequestSchema,
  reviewCorrectionRequestSchema,
} from "./results.schema.js";
import { z } from "zod";

/**
 * POST /api/v1/results
 * Create semester result
 */
export const createSemesterResult = asyncHandler(async (req: Request, res: Response) => {
  const { body } = createSemesterResultSchema.parse({ body: req.body });
  
  const result = await resultsService.createSemesterResult(body);
  
  await createAuditLog({
    action: "RESULTS_UPLOADED",
    actorId: req.user!.id,
    actorRole: req.user!.role,
    entityType: "SemesterResult",
    entityId: result.id,
    metadata: { studentId: body.studentId, semester: body.semester },
    ipAddress: req.ip || undefined,
  });

  res.status(201).json({ success: true, data: result });
});

/**
 * POST /api/v1/results/bulk
 * Bulk upload results from CSV
 */
export const bulkUploadResults = asyncHandler(async (req: Request, res: Response) => {
  const { body } = bulkUploadResultsSchema.parse({ body: req.body });
  
  const result = await resultsService.bulkUploadResults(body, req.user!.id);
  
  await createAuditLog({
    action: "RESULTS_UPLOADED",
    actorId: req.user!.id,
    actorRole: req.user!.role,
    entityType: "SemesterResult",
    entityId: "bulk",
    metadata: { 
      semester: body.semester,
      academicYear: body.academicYear,
      successCount: result.success.length,
      errorCount: result.errors.length,
    },
    ipAddress: req.ip || undefined,
  });

  res.json({ success: true, data: result });
});

/**
 * GET /api/v1/results/:id
 * Get semester result by ID
 */
export const getSemesterResult = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id;
  if (!id || Array.isArray(id)) {
    res.status(400).json({
      success: false,
      error: { code: "BAD_REQUEST", message: "Result ID is required" },
    });
    return;
  }
  const result = await resultsService.getSemesterResultById(id);
  res.json({ success: true, data: result });
});

/**
 * GET /api/v1/results/student/:studentId
 * Get student's all results
 */
export const getStudentResults = asyncHandler(async (req: Request, res: Response) => {
  const studentId = req.params.studentId;
  if (!studentId || Array.isArray(studentId)) {
    res.status(400).json({
      success: false,
      error: { code: "BAD_REQUEST", message: "Student ID is required" },
    });
    return;
  }
  const { results, cgpa } = await resultsService.getStudentResults(studentId);
  res.json({ success: true, data: { results, cgpa } });
});

/**
 * GET /api/v1/results/me
 * Get current student's results
 */
export const getMyResults = asyncHandler(async (req: Request, res: Response) => {
  // Get student ID from user
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

  const { results, cgpa } = await resultsService.getStudentResults(student.id);
  res.json({ success: true, data: { results, cgpa } });
});

/**
 * PATCH /api/v1/results/course/:id
 * Update course result
 */
export const updateCourseResult = asyncHandler(async (req: Request, res: Response) => {
  const { params, body } = updateCourseResultSchema.parse({
    params: req.params,
    body: req.body,
  });

  const result = await resultsService.updateCourseResult(params.id, body);
  
  await createAuditLog({
    action: "RESULT_UPDATED",
    actorId: req.user!.id,
    actorRole: req.user!.role,
    entityType: "CourseResult",
    entityId: result.id,
    metadata: body,
    ipAddress: req.ip || undefined,
  });

  res.json({ success: true, data: result });
});

/**
 * PATCH /api/v1/results/:id/status
 * Update semester result status
 */
export const updateSemesterResultStatus = asyncHandler(async (req: Request, res: Response) => {
  const { params, body } = updateSemesterResultStatusSchema.parse({
    params: req.params,
    body: req.body,
  });

  const result = await resultsService.updateSemesterResultStatus(params.id, body, req.user!.id);
  
  // Determine appropriate audit action based on status change
  let auditAction: "RESULT_SUBMITTED_FOR_REVIEW" | "RESULT_APPROVED" | "RESULT_REJECTED" | "RESULT_UPDATED" = "RESULT_UPDATED";
  if (body.status === "REVIEWED") {
    auditAction = "RESULT_SUBMITTED_FOR_REVIEW";
  } else if (body.status === "APPROVED") {
    auditAction = "RESULT_APPROVED";
  }
  
  await createAuditLog({
    action: auditAction,
    actorId: req.user!.id,
    actorRole: req.user!.role,
    entityType: "SemesterResult",
    entityId: result.id,
    metadata: { status: body.status },
    ipAddress: req.ip || undefined,
  });

  res.json({ success: true, data: result });
});

/**
 * GET /api/v1/results
 * List results with filters
 */
export const listResults = asyncHandler(async (req: Request, res: Response) => {
  const { query } = listResultsSchema.parse({ query: req.query });
  const result = await resultsService.listResults(query);
  res.json({ success: true, data: result.data, pagination: result.pagination });
});

// ============ CORRECTION REQUESTS ============

/**
 * POST /api/v1/results/corrections
 * Create correction request
 */
export const createCorrectionRequest = asyncHandler(async (req: Request, res: Response) => {
  const { body } = createCorrectionRequestSchema.parse({ body: req.body });
  
  const correction = await resultsService.createCorrectionRequest(body, req.user!.id);
  
  await createAuditLog({
    action: "CORRECTION_REQUESTED",
    actorId: req.user!.id,
    actorRole: req.user!.role,
    entityType: "CorrectionRequest",
    entityId: correction.id,
    metadata: { entityType: body.entityType, entityId: body.entityId, field: body.field },
    ipAddress: req.ip || undefined,
  });

  res.status(201).json({ success: true, data: correction });
});

/**
 * PATCH /api/v1/results/corrections/:id
 * Review correction request
 */
export const reviewCorrectionRequest = asyncHandler(async (req: Request, res: Response) => {
  const { params, body } = reviewCorrectionRequestSchema.parse({
    params: req.params,
    body: req.body,
  });

  const correction = await resultsService.reviewCorrectionRequest(params.id, body, req.user!.id);
  
  await createAuditLog({
    action: body.status === "APPROVED" ? "CORRECTION_APPROVED" : "CORRECTION_REJECTED",
    actorId: req.user!.id,
    actorRole: req.user!.role,
    entityType: "CorrectionRequest",
    entityId: correction.id,
    metadata: body,
    ipAddress: req.ip || undefined,
  });

  res.json({ success: true, data: correction });
});

/**
 * GET /api/v1/results/corrections
 * Get correction requests
 */
export const getCorrectionRequests = asyncHandler(async (req: Request, res: Response) => {
  const query = z.object({
    status: z.string().optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
  }).parse(req.query);

  // If student, only show their own
  let studentId: string | undefined;
  if (req.user!.role === "STUDENT") {
    studentId = req.user!.id;
  }

  const result = await resultsService.getCorrectionRequests({
    studentId,
    status: query.status,
    page: query.page,
    limit: query.limit,
  });

  res.json({ success: true, data: result.data, pagination: result.pagination });
});
