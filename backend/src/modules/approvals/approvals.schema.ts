import { z } from "zod";

export const createApprovalSchema = z.object({
  body: z.object({
    type: z.enum(["CURRICULUM", "SEMESTER_RESULT", "DEGREE_PROPOSAL", "CORRECTION"]),
    entityType: z.string(),
    entityId: z.string(),
    step: z.number().min(1).max(5).default(1),
    description: z.string().optional(),
  }),
});

export const reviewApprovalSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    status: z.enum(["APPROVED", "REJECTED"]),
    comments: z.string().optional(),
  }),
});

export const listApprovalsSchema = z.object({
  query: z.object({
    type: z.enum(["CURRICULUM", "SEMESTER_RESULT", "DEGREE_PROPOSAL", "CORRECTION"]).optional(),
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
    entityType: z.string().optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
  }),
});

// Types
export type CreateApprovalInput = z.infer<typeof createApprovalSchema>["body"];
export type ReviewApprovalInput = z.infer<typeof reviewApprovalSchema>["body"];
export type ListApprovalsQuery = z.infer<typeof listApprovalsSchema>["query"];
