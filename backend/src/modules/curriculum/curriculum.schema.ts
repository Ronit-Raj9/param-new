import { z } from "zod";

// Valid CourseType enum values from Prisma
const CourseTypeEnum = z.enum(["MANDATORY", "ELECTIVE", "MOOC", "COLLOQUIUM", "PROJECT", "INTERNSHIP"]);

// Program schemas
export const createProgramSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    code: z.string().min(2, "Code must be at least 2 characters"),
    shortName: z.string().min(2, "Short name must be at least 2 characters"),
    degreeType: z.string().min(2),
    durationYears: z.number().min(1).max(10),
    totalSemesters: z.number().min(1).max(20),
    totalCredits: z.number().min(1),
  }),
});

export const updateProgramSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    shortName: z.string().min(2).optional(),
    degreeType: z.string().min(2).optional(),
    durationYears: z.number().min(1).max(10).optional(),
    totalSemesters: z.number().min(1).max(20).optional(),
    totalCredits: z.number().min(1).optional(),
    isActive: z.boolean().optional(),
  }),
});

// Curriculum schemas
export const createCurriculumSchema = z.object({
  body: z.object({
    programId: z.string().uuid(),
    version: z.string().min(1),
    batch: z.string().min(1),
    name: z.string().min(2),
    description: z.string().optional(),
    totalCredits: z.number().min(0).optional(),
    semesters: z.array(z.object({
      semesterNumber: z.number().min(1),
      courses: z.array(z.object({
        code: z.string().min(2),
        name: z.string().min(2),
        shortName: z.string().optional(),
        credits: z.number().min(0),
        lectureHours: z.number().min(0).default(3),
        tutorialHours: z.number().min(0).default(1),
        practicalHours: z.number().min(0).default(0),
        type: CourseTypeEnum,
      })),
    })),
  }),
});

export const updateCurriculumSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    version: z.string().optional(),
    name: z.string().optional(),
    description: z.string().optional(),
    totalCredits: z.number().optional(),
    status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
  }),
});

// Course schemas
export const createCourseSchema = z.object({
  body: z.object({
    curriculumSemesterId: z.string().uuid(),
    code: z.string().min(2),
    name: z.string().min(2),
    shortName: z.string().optional(),
    credits: z.number().min(0),
    lectureHours: z.number().min(0).default(3),
    tutorialHours: z.number().min(0).default(1),
    practicalHours: z.number().min(0).default(0),
    type: CourseTypeEnum,
  }),
});

export const updateCourseSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    shortName: z.string().optional(),
    credits: z.number().min(0).optional(),
    lectureHours: z.number().min(0).optional(),
    tutorialHours: z.number().min(0).optional(),
    practicalHours: z.number().min(0).optional(),
    type: CourseTypeEnum.optional(),
    isActive: z.boolean().optional(),
  }),
});

// List schemas
export const listProgramsSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    isActive: z.coerce.boolean().optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
  }),
});

export const listCurriculumsSchema = z.object({
  query: z.object({
    programId: z.string().uuid().optional(),
    status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
  }),
});

// Types
export type CreateProgramInput = z.infer<typeof createProgramSchema>["body"];
export type UpdateProgramInput = z.infer<typeof updateProgramSchema>["body"];
export type CreateCurriculumInput = z.infer<typeof createCurriculumSchema>["body"];
export type UpdateCurriculumInput = z.infer<typeof updateCurriculumSchema>["body"];
export type CreateCourseInput = z.infer<typeof createCourseSchema>["body"];
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>["body"];
export type ListProgramsQuery = z.infer<typeof listProgramsSchema>["query"];
export type ListCurriculumsQuery = z.infer<typeof listCurriculumsSchema>["query"];
