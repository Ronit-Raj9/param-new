import { z } from "zod";

// DegreeProposalStatus: DRAFT, PENDING_ACADEMIC, PENDING_ADMIN, APPROVED, REJECTED, ISSUED
export const createDegreeProposalSchema = z.object({
  body: z.object({
    studentId: z.string().cuid(),
    expectedYear: z.coerce.number().int().min(2000).max(2100),
    notes: z.string().optional(),
  }),
});

export const academicReviewSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
  body: z.object({
    action: z.enum(["approve", "reject"]),
    note: z.string().optional(),
  }),
});

export const adminReviewSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
  body: z.object({
    action: z.enum(["approve", "reject"]),
    note: z.string().optional(),
  }),
});

export const listDegreeProposalsSchema = z.object({
  query: z.object({
    studentId: z.string().cuid().optional(),
    status: z.enum(["DRAFT", "PENDING_ACADEMIC", "PENDING_ADMIN", "APPROVED", "REJECTED", "ISSUED"]).optional(),
    programId: z.string().cuid().optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
  }),
});

// Types
export type CreateDegreeProposalInput = z.infer<typeof createDegreeProposalSchema>["body"];
export type AcademicReviewInput = z.infer<typeof academicReviewSchema>["body"];
export type AdminReviewInput = z.infer<typeof adminReviewSchema>["body"];
export type ListDegreeProposalsQuery = z.infer<typeof listDegreeProposalsSchema>["query"];
