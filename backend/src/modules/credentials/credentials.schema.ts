import { z } from "zod";

// Match Prisma enums
const credentialTypeEnum = z.enum(["SEMESTER", "DEGREE", "CERTIFICATE"]);
const credentialStatusEnum = z.enum(["PENDING", "ISSUED", "REVOKED", "REPLACED"]);

export const createCredentialSchema = z.object({
  body: z.object({
    studentId: z.string().cuid(),
    type: credentialTypeEnum,
    semesterResultId: z.string().cuid().optional(), // For SEMESTER credentials
    degreeProposalId: z.string().cuid().optional(), // For DEGREE credentials
  }),
});

export const getCredentialSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});

export const revokeCredentialSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
  body: z.object({
    reason: z.string().min(10, "Reason must be at least 10 characters"),
  }),
});

export const issueCredentialSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});

export const createShareLinkSchema = z.object({
  body: z.object({
    credentialId: z.string().cuid(),
    expiresInDays: z.number().int().min(1).max(365).optional(), // Days until expiry
  }),
});

export const getShareLinkSchema = z.object({
  params: z.object({
    token: z.string().min(1),
  }),
});

export const revokeShareLinkSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});

export const listCredentialsSchema = z.object({
  query: z.object({
    studentId: z.string().cuid().optional(),
    type: credentialTypeEnum.optional(),
    status: credentialStatusEnum.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

export const listShareLinksSchema = z.object({
  params: z.object({
    credentialId: z.string().cuid(),
  }),
});

// Types
export type CreateCredentialInput = z.infer<typeof createCredentialSchema>["body"];
export type RevokeCredentialInput = z.infer<typeof revokeCredentialSchema>["body"];
export type CreateShareLinkInput = z.infer<typeof createShareLinkSchema>["body"];
export type ListCredentialsQuery = z.infer<typeof listCredentialsSchema>["query"];
