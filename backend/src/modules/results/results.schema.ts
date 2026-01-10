import { z } from "zod";

// Semester result creation
export const createSemesterResultSchema = z.object({
  body: z.object({
    studentId: z.string().cuid(),
    semester: z.number().min(1).max(20),
    academicYear: z.string(),
    courseResults: z.array(z.object({
      courseId: z.string().cuid(),
      grade: z.string().optional(),
      gradePoints: z.number().optional(),
      internalMarks: z.number().min(0).optional(),
      externalMarks: z.number().min(0).optional(),
      totalMarks: z.number().min(0).optional(),
      attendance: z.number().min(0).max(100).optional(),
    })),
  }),
});

// Bulk result upload via CSV
export const bulkUploadResultsSchema = z.object({
  body: z.object({
    semester: z.number().min(1).max(20),
    academicYear: z.string(),
    programId: z.string().cuid(),
    results: z.array(z.object({
      enrollmentNumber: z.string(),
      courseCode: z.string(),
      grade: z.string().optional(),
      gradePoints: z.number().optional(),
      internalMarks: z.number().min(0).optional(),
      externalMarks: z.number().min(0).optional(),
      totalMarks: z.number().min(0).optional(),
    })),
  }),
});

// Update course result
export const updateCourseResultSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
  body: z.object({
    grade: z.string().optional(),
    gradePoints: z.number().optional(),
    internalMarks: z.number().min(0).optional(),
    externalMarks: z.number().min(0).optional(),
    totalMarks: z.number().min(0).optional(),
    attendance: z.number().min(0).max(100).optional(),
  }),
});

// Update semester result status - using ResultStatus enum values
export const updateSemesterResultStatusSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
  body: z.object({
    status: z.enum(["DRAFT", "REVIEWED", "APPROVED", "ISSUED", "WITHHELD"]),
    approvalNote: z.string().optional(),
  }),
});

// List results
export const listResultsSchema = z.object({
  query: z.object({
    studentId: z.string().cuid().optional(),
    programId: z.string().cuid().optional(),
    semester: z.coerce.number().optional(),
    academicYear: z.string().optional(),
    status: z.enum(["DRAFT", "REVIEWED", "APPROVED", "ISSUED", "WITHHELD"]).optional(),
    batchYear: z.coerce.number().optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
  }),
});

// Correction request - matches CorrectionRequest model
export const createCorrectionRequestSchema = z.object({
  body: z.object({
    entityType: z.enum(["CourseResult", "SemesterResult"]),
    entityId: z.string().cuid(),
    field: z.string(), // Field being corrected, e.g., "grade"
    oldValue: z.string(),
    newValue: z.string(),
    reason: z.string().min(10),
    supportingDocs: z.array(z.string()).optional(),
  }),
});

export const reviewCorrectionRequestSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
  body: z.object({
    status: z.enum(["APPROVED", "REJECTED"]),
    reviewNote: z.string().optional(),
  }),
});

// Types
export type CreateSemesterResultInput = z.infer<typeof createSemesterResultSchema>["body"];
export type BulkUploadResultsInput = z.infer<typeof bulkUploadResultsSchema>["body"];
export type UpdateCourseResultInput = z.infer<typeof updateCourseResultSchema>["body"];
export type UpdateSemesterResultStatusInput = z.infer<typeof updateSemesterResultStatusSchema>["body"];
export type ListResultsQuery = z.infer<typeof listResultsSchema>["query"];
export type CreateCorrectionRequestInput = z.infer<typeof createCorrectionRequestSchema>["body"];
export type ReviewCorrectionRequestInput = z.infer<typeof reviewCorrectionRequestSchema>["body"];
