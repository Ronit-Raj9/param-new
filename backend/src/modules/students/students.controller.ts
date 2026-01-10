import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/error.handler.js";
import * as studentsService from "./students.service.js";
import { createAuditLog } from "../audit/audit.service.js";
import {
  createStudentSchema,
  updateStudentSchema,
  getStudentSchema,
  getStudentByEnrollmentSchema,
  listStudentsSchema,
  bulkImportSchema,
  updateStudentStatusSchema,
} from "./students.schema.js";

/**
 * POST /api/v1/students
 * Create a new student
 */
export const createStudent = asyncHandler(async (req: Request, res: Response) => {
  const { body } = createStudentSchema.parse({ body: req.body });
  
  const student = await studentsService.createStudent(body);
  
  await createAuditLog({
    action: "STUDENT_CREATED",
    actorId: req.user!.id,
    actorRole: req.user!.role,
    entityType: "Student",
    entityId: student.id,
    metadata: { enrollmentNumber: student.enrollmentNumber, programId: student.programId },
    ipAddress: req.ip || undefined,
  });

  res.status(201).json({
    success: true,
    data: student,
  });
});

/**
 * GET /api/v1/students/:id
 * Get student by ID
 */
export const getStudent = asyncHandler(async (req: Request, res: Response) => {
  const { params } = getStudentSchema.parse({ params: req.params });
  
  const student = await studentsService.getStudentById(params.id);

  res.json({
    success: true,
    data: student,
  });
});

/**
 * GET /api/v1/students/enrollment/:enrollmentNumber
 * Get student by enrollment number
 */
export const getStudentByEnrollment = asyncHandler(async (req: Request, res: Response) => {
  const { params } = getStudentByEnrollmentSchema.parse({ params: req.params });
  const student = await studentsService.getStudentByEnrollment(params.enrollmentNumber);

  res.json({
    success: true,
    data: student,
  });
});

/**
 * GET /api/v1/students/me
 * Get current student profile
 */
export const getMyProfile = asyncHandler(async (req: Request, res: Response) => {
  const student = await studentsService.getStudentByUserId(req.user!.id);

  if (!student) {
    res.status(404).json({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "Student profile not found",
      },
    });
    return;
  }

  res.json({
    success: true,
    data: student,
  });
});

/**
 * PATCH /api/v1/students/:id
 * Update student
 */
export const updateStudent = asyncHandler(async (req: Request, res: Response) => {
  const { params, body } = updateStudentSchema.parse({
    params: req.params,
    body: req.body,
  });

  const existingStudent = await studentsService.getStudentById(params.id);
  const student = await studentsService.updateStudent(params.id, body);
  
  await createAuditLog({
    action: "STUDENT_UPDATED",
    actorId: req.user!.id,
    actorRole: req.user!.role,
    entityType: "Student",
    entityId: student.id,
    metadata: { 
      previousStatus: existingStudent.status, 
      newStatus: student.status,
      updates: Object.keys(body),
    },
    ipAddress: req.ip || undefined,
  });

  res.json({
    success: true,
    data: student,
  });
});

/**
 * PATCH /api/v1/students/:id/status
 * Update student status
 */
export const updateStudentStatus = asyncHandler(async (req: Request, res: Response) => {
  const { params, body } = updateStudentStatusSchema.parse({
    params: req.params,
    body: req.body,
  });

  const existingStudent = await studentsService.getStudentById(params.id);
  const student = await studentsService.updateStudentStatus(params.id, body);
  
  await createAuditLog({
    action: "STUDENT_STATUS_CHANGED",
    actorId: req.user!.id,
    actorRole: req.user!.role,
    entityType: "Student",
    entityId: student.id,
    metadata: { 
      previousStatus: existingStudent.status, 
      newStatus: student.status,
      reason: body.reason,
    },
    ipAddress: req.ip || undefined,
  });

  res.json({
    success: true,
    data: student,
  });
});

/**
 * GET /api/v1/students
 * List students with filters
 */
export const listStudents = asyncHandler(async (req: Request, res: Response) => {
  const { query } = listStudentsSchema.parse({ query: req.query });
  
  const result = await studentsService.listStudents(query);

  res.json({
    success: true,
    data: result.data,
    pagination: result.pagination,
  });
});

/**
 * POST /api/v1/students/bulk
 * Bulk import students
 */
export const bulkImport = asyncHandler(async (req: Request, res: Response) => {
  const { body } = bulkImportSchema.parse({ body: req.body });
  
  const result = await studentsService.bulkImportStudents(body, req.user!.id);
  
  await createAuditLog({
    action: "STUDENTS_BULK_UPLOADED",
    actorId: req.user!.id,
    actorRole: req.user!.role,
    entityType: "Student",
    entityId: "bulk",
    metadata: { 
      successCount: result.success.length, 
      errorCount: result.errors.length 
    },
    ipAddress: req.ip || undefined,
  });

  res.json({
    success: true,
    data: result,
  });
});

/**
 * GET /api/v1/students/stats
 * Get student statistics
 */
export const getStudentStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await studentsService.getStudentStats();

  res.json({
    success: true,
    data: stats,
  });
});

/**
 * GET /api/v1/students/:id/progress
 * Get student academic progress
 */
export const getStudentProgress = asyncHandler(async (req: Request, res: Response) => {
  const { params } = getStudentSchema.parse({ params: req.params });
  
  const progress = await studentsService.getStudentAcademicProgress(params.id);

  res.json({
    success: true,
    data: progress,
  });
});
