import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../middleware/error.handler.js";
import * as curriculumService from "./curriculum.service.js";
import { createAuditLog } from "../audit/audit.service.js";
import {
  createProgramSchema,
  updateProgramSchema,
  createCurriculumSchema,
  updateCurriculumSchema,
  createCourseSchema,
  updateCourseSchema,
  listProgramsSchema,
  listCurriculumsSchema,
} from "./curriculum.schema.js";

// Helper schemas for param validation (using cuid since Prisma generates cuid IDs)
const idParamSchema = z.object({ id: z.string().cuid() });
const programIdParamSchema = z.object({ programId: z.string().cuid() });

// ============ PROGRAMS ============

export const createProgram = asyncHandler(async (req: Request, res: Response) => {
  const { body } = createProgramSchema.parse({ body: req.body });

  const program = await curriculumService.createProgram(body);

  // Note: No PROGRAM_CREATED audit action exists, using CURRICULUM_CREATED for curriculum-related operations
  // Programs don't have dedicated audit actions in the schema

  res.status(201).json({ success: true, data: program });
});

export const getProgram = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const program = await curriculumService.getProgramById(id);
  res.json({ success: true, data: program });
});

export const updateProgram = asyncHandler(async (req: Request, res: Response) => {
  const { params, body } = updateProgramSchema.parse({
    params: req.params,
    body: req.body,
  });

  const program = await curriculumService.updateProgram(params.id, body);

  // Note: No PROGRAM_UPDATED audit action exists in the schema

  res.json({ success: true, data: program });
});

export const listPrograms = asyncHandler(async (req: Request, res: Response) => {
  const { query } = listProgramsSchema.parse({ query: req.query });
  const result = await curriculumService.listPrograms(query);
  res.json({ success: true, data: result.data, pagination: result.pagination });
});

// ============ CURRICULUMS ============

export const createCurriculum = asyncHandler(async (req: Request, res: Response) => {
  const { body } = createCurriculumSchema.parse({ body: req.body });

  const curriculum = await curriculumService.createCurriculum(body);

  await createAuditLog({
    action: "CURRICULUM_CREATED",
    actorId: req.user!.id,
    actorRole: req.user!.role,
    entityType: "Curriculum",
    entityId: curriculum.id,
    metadata: { programId: curriculum.programId, version: curriculum.version },
    ipAddress: typeof req.ip === "string" ? req.ip : undefined,
  });

  res.status(201).json({ success: true, data: curriculum });
});

export const getCurriculum = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const curriculum = await curriculumService.getCurriculumById(id);
  res.json({ success: true, data: curriculum });
});

export const updateCurriculum = asyncHandler(async (req: Request, res: Response) => {
  const { params, body } = updateCurriculumSchema.parse({
    params: req.params,
    body: req.body,
  });

  const curriculum = await curriculumService.updateCurriculum(params.id, body);

  await createAuditLog({
    action: "CURRICULUM_UPDATED",
    actorId: req.user!.id,
    actorRole: req.user!.role,
    entityType: "Curriculum",
    entityId: curriculum.id,
    metadata: body,
    ipAddress: typeof req.ip === "string" ? req.ip : undefined,
  });

  res.json({ success: true, data: curriculum });
});

export const listCurriculums = asyncHandler(async (req: Request, res: Response) => {
  const { query } = listCurriculumsSchema.parse({ query: req.query });
  const result = await curriculumService.listCurriculums(query);
  res.json({ success: true, data: result.data, pagination: result.pagination });
});

export const getActiveCurriculum = asyncHandler(async (req: Request, res: Response) => {
  const { programId } = programIdParamSchema.parse(req.params);
  const curriculum = await curriculumService.getActiveCurriculumForProgram(programId);

  if (!curriculum) {
    res.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: "No active curriculum found" },
    });
    return;
  }

  res.json({ success: true, data: curriculum });
});

// ============ COURSES ============

export const createCourse = asyncHandler(async (req: Request, res: Response) => {
  const { body } = createCourseSchema.parse({ body: req.body });

  const course = await curriculumService.createCourse(body);

  // Note: No COURSE_CREATED audit action exists, courses are part of curriculum
  await createAuditLog({
    action: "CURRICULUM_UPDATED",
    actorId: req.user!.id,
    actorRole: req.user!.role,
    entityType: "Course",
    entityId: course.id,
    metadata: { code: course.code, name: course.name },
    ipAddress: typeof req.ip === "string" ? req.ip : undefined,
  });

  res.status(201).json({ success: true, data: course });
});

export const getCourse = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const course = await curriculumService.getCourseById(id);
  res.json({ success: true, data: course });
});

/**
 * GET /api/v1/curriculum/courses
 * List courses with filters
 */
export const listCourses = asyncHandler(async (req: Request, res: Response) => {
  // Parse query params, handling empty strings by converting to undefined
  const rawQuery = req.query;
  
  // Pre-process to convert empty strings to undefined
  const programId = typeof rawQuery.programId === 'string' && rawQuery.programId.trim() !== '' 
    ? rawQuery.programId.trim() 
    : undefined;
  const semesterStr = typeof rawQuery.semester === 'string' && rawQuery.semester.trim() !== '' 
    ? rawQuery.semester.trim() 
    : undefined;
  const searchStr = typeof rawQuery.search === 'string' && rawQuery.search.trim() !== '' 
    ? rawQuery.search.trim() 
    : undefined;

  // Parse semester to number
  let semester: number | undefined = undefined;
  if (semesterStr) {
    const num = parseInt(semesterStr, 10);
    if (!isNaN(num) && num >= 1 && num <= 12) {
      semester = num;
    }
  }

  const query = { programId, semester, search: searchStr };

  const courses = await curriculumService.listCourses(query);
  res.json({ success: true, data: courses });
});

export const updateCourse = asyncHandler(async (req: Request, res: Response) => {
  const { params, body } = updateCourseSchema.parse({
    params: req.params,
    body: req.body,
  });

  const course = await curriculumService.updateCourse(params.id, body);

  await createAuditLog({
    action: "CURRICULUM_UPDATED",
    actorId: req.user!.id,
    actorRole: req.user!.role,
    entityType: "Course",
    entityId: course.id,
    metadata: body,
    ipAddress: typeof req.ip === "string" ? req.ip : undefined,
  });

  res.json({ success: true, data: course });
});

export const deleteCourse = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  await curriculumService.deleteCourse(id);

  await createAuditLog({
    action: "CURRICULUM_UPDATED",
    actorId: req.user!.id,
    actorRole: req.user!.role,
    entityType: "Course",
    entityId: id,
    metadata: { action: "deleted" },
    ipAddress: typeof req.ip === "string" ? req.ip : undefined,
  });

  res.json({ success: true, message: "Course deleted" });
});
