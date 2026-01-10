import { z } from "zod";

// Match Prisma StudentStatus enum
const studentStatusEnum = z.enum([
  "PENDING_ACTIVATION",
  "ACTIVE",
  "LEAVE_OF_ABSENCE",
  "REPEAT_YEAR",
  "DROPPED_OUT",
  "EARLY_EXIT",
  "GRADUATED",
]);

export const createStudentSchema = z.object({
  body: z.object({
    enrollmentNumber: z.string().min(1, "Enrollment number is required"),
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Valid email is required"),
    programId: z.string().cuid("Invalid program ID"),
    batch: z.string().min(1, "Batch is required"), // e.g., "2020-2024"
    admissionYear: z.number().int().min(2000).max(2100),
    expectedGradYear: z.number().int().min(2000).max(2100),
    curriculumId: z.string().cuid().optional(),
    dateOfBirth: z.string().datetime().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    guardianName: z.string().optional(),
    guardianPhone: z.string().optional(),
  }),
});

export const updateStudentSchema = z.object({
  params: z.object({
    id: z.string().cuid("Invalid student ID"),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    programId: z.string().cuid().optional(),
    curriculumId: z.string().cuid().optional(),
    batch: z.string().optional(),
    currentSemester: z.number().int().min(1).optional(),
    status: studentStatusEnum.optional(),
    statusReason: z.string().optional(),
    dateOfBirth: z.string().datetime().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    guardianName: z.string().optional(),
    guardianPhone: z.string().optional(),
  }),
});

export const getStudentSchema = z.object({
  params: z.object({
    id: z.string().cuid("Invalid student ID"),
  }),
});

export const getStudentByEnrollmentSchema = z.object({
  params: z.object({
    enrollmentNumber: z.string().min(1),
  }),
});

export const listStudentsSchema = z.object({
  query: z.object({
    programId: z.string().cuid().optional(),
    batch: z.string().optional(),
    admissionYear: z.coerce.number().int().optional(),
    status: studentStatusEnum.optional(),
    search: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

// Bulk import schema (for CSV)
export const bulkImportSchema = z.object({
  body: z.object({
    students: z.array(z.object({
      enrollmentNumber: z.string(),
      name: z.string(),
      email: z.string().email(),
      programId: z.string().cuid(),
      batch: z.string(),
      admissionYear: z.number().int(),
      expectedGradYear: z.number().int(),
      curriculumId: z.string().cuid().optional(),
      dateOfBirth: z.string().datetime().optional(),
      phone: z.string().optional(),
      guardianName: z.string().optional(),
      guardianPhone: z.string().optional(),
    })).min(1),
  }),
});

export const updateStudentStatusSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
  body: z.object({
    status: studentStatusEnum,
    reason: z.string().optional(),
  }),
});

// Types
export type CreateStudentInput = z.infer<typeof createStudentSchema>["body"];
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>["body"];
export type ListStudentsQuery = z.infer<typeof listStudentsSchema>["query"];
export type BulkImportInput = z.infer<typeof bulkImportSchema>["body"];
export type UpdateStudentStatusInput = z.infer<typeof updateStudentStatusSchema>["body"];
