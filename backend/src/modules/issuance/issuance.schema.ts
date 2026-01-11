import { z } from "zod";

// Match Prisma enums
const credentialTypeEnum = z.enum(["SEMESTER", "DEGREE", "CERTIFICATE"]);

// ============ SCHEMAS ============

export const getEligibleSchema = z.object({
    query: z.object({
        programId: z.string().cuid(),
        batch: z.string().min(1),
        type: credentialTypeEnum,
    }),
});

export const bulkIssueSchema = z.object({
    body: z.object({
        credentialIds: z.array(z.string().cuid()).min(1).max(100),
    }),
});

export const singleIssueSchema = z.object({
    body: z.object({
        studentId: z.string().cuid(),
        type: credentialTypeEnum,
        semesterResultId: z.string().cuid().optional(),
        degreeProposalId: z.string().cuid().optional(),
    }),
});

export const getJobSchema = z.object({
    params: z.object({
        jobId: z.string().cuid(),
    }),
});

export const listJobsSchema = z.object({
    query: z.object({
        type: z.enum([
            "BLOCKCHAIN_MINT_SEMESTER",
            "BLOCKCHAIN_MINT_DEGREE",
            "BLOCKCHAIN_REVOKE",
        ]).optional(),
        status: z.enum(["QUEUED", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED"]).optional(),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
    }),
});

export const estimateGasSchema = z.object({
    body: z.object({
        credentialIds: z.array(z.string().cuid()).min(1).max(100),
    }),
});

// ============ TYPES ============

export type GetEligibleQuery = z.infer<typeof getEligibleSchema>["query"];
export type BulkIssueInput = z.infer<typeof bulkIssueSchema>["body"];
export type SingleIssueInput = z.infer<typeof singleIssueSchema>["body"];
export type ListJobsQuery = z.infer<typeof listJobsSchema>["query"];
