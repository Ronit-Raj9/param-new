import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/error.handler.js";
import * as credentialsService from "./credentials.service.js";
import { createAuditLog } from "../audit/audit.service.js";
import {
  createCredentialSchema,
  getCredentialSchema,
  revokeCredentialSchema,
  issueCredentialSchema,
  createShareLinkSchema,
  getShareLinkSchema,
  revokeShareLinkSchema,
  listCredentialsSchema,
  listShareLinksSchema,
} from "./credentials.schema.js";
import { prisma } from "../../config/database.js";

/**
 * POST /api/v1/credentials
 * Create a credential
 */
export const createCredential = asyncHandler(async (req: Request, res: Response) => {
  const { body } = createCredentialSchema.parse({ body: req.body });
  
  const credential = await credentialsService.createCredential(body, req.user!.id);
  
  res.status(201).json({ success: true, data: credential });
});

/**
 * GET /api/v1/credentials/:id
 * Get credential by ID
 */
export const getCredential = asyncHandler(async (req: Request, res: Response) => {
  const { params } = getCredentialSchema.parse({ params: req.params });
  const credential = await credentialsService.getCredentialById(params.id);
  
  // Check authorization - students can only view their own credentials
  if (req.user!.role === "STUDENT") {
    const student = await prisma.student.findUnique({
      where: { userId: req.user!.id },
    });
    
    if (!student || credential.studentId !== student.id) {
      res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "You can only view your own credentials" },
      });
      return;
    }
  }
  
  res.json({ success: true, data: credential });
});

/**
 * GET /api/v1/credentials/me
 * Get my credentials (for students)
 */
export const getMyCredentials = asyncHandler(async (req: Request, res: Response) => {
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

  const credentials = await credentialsService.getStudentCredentials(student.id);
  res.json({ success: true, data: credentials });
});

/**
 * POST /api/v1/credentials/:id/issue
 * Issue a credential (mark as ISSUED)
 */
export const issueCredential = asyncHandler(async (req: Request, res: Response) => {
  const { params } = issueCredentialSchema.parse({ params: req.params });
  
  const credential = await credentialsService.issueCredential(params.id, req.user!.id);
  
  await createAuditLog({
    action: "CREDENTIAL_MINTED",
    actorId: req.user!.id,
    actorRole: req.user!.role,
    entityType: "Credential",
    entityId: credential.id,
    metadata: { studentId: credential.studentId, type: credential.type },
    ipAddress: req.ip || undefined,
  });

  res.json({ success: true, data: credential });
});

/**
 * POST /api/v1/credentials/:id/revoke
 * Revoke a credential
 */
export const revokeCredential = asyncHandler(async (req: Request, res: Response) => {
  const { params, body } = revokeCredentialSchema.parse({
    params: req.params,
    body: req.body,
  });

  const credential = await credentialsService.revokeCredential(params.id, body, req.user!.id);
  
  await createAuditLog({
    action: "CREDENTIAL_REVOKED",
    actorId: req.user!.id,
    actorRole: req.user!.role,
    entityType: "Credential",
    entityId: credential.id,
    metadata: { reason: body.reason, studentId: credential.studentId },
    ipAddress: req.ip || undefined,
  });

  res.json({ success: true, data: credential });
});

/**
 * GET /api/v1/credentials
 * List credentials with filters
 */
export const listCredentials = asyncHandler(async (req: Request, res: Response) => {
  const { query } = listCredentialsSchema.parse({ query: req.query });
  
  // Students can only list their own credentials
  if (req.user!.role === "STUDENT") {
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
    
    query.studentId = student.id;
  }
  
  const result = await credentialsService.listCredentials(query);
  res.json({ success: true, data: result.data, pagination: result.pagination });
});

// ============ SHARE LINKS ============

/**
 * POST /api/v1/credentials/share
 * Create a share link
 */
export const createShareLink = asyncHandler(async (req: Request, res: Response) => {
  const { body } = createShareLinkSchema.parse({ body: req.body });
  
  // Only students can create share links for their own credentials
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

  const shareLink = await credentialsService.createShareLink(body, student.id);

  res.status(201).json({ 
    success: true, 
    data: {
      ...shareLink,
      url: `${process.env.FRONTEND_URL}/verify/${shareLink.token}`,
    },
  });
});

/**
 * GET /api/v1/credentials/share/:token
 * Get share link by token (public endpoint for verification)
 */
export const getShareLink = asyncHandler(async (req: Request, res: Response) => {
  const { params } = getShareLinkSchema.parse({ params: req.params });
  const shareLink = await credentialsService.getShareLinkByToken(params.token);
  res.json({ success: true, data: shareLink });
});

/**
 * GET /api/v1/credentials/:credentialId/shares
 * Get share links for a credential
 */
export const getCredentialShareLinks = asyncHandler(async (req: Request, res: Response) => {
  const { params } = listShareLinksSchema.parse({ params: req.params });
  
  // Verify ownership
  const credential = await credentialsService.getCredentialById(params.credentialId);
  
  if (req.user!.role === "STUDENT") {
    const student = await prisma.student.findUnique({
      where: { userId: req.user!.id },
    });
    
    if (!student || credential.studentId !== student.id) {
      res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "You can only view share links for your own credentials" },
      });
      return;
    }
  }
  
  const shareLinks = await credentialsService.getCredentialShareLinks(params.credentialId);
  res.json({ success: true, data: shareLinks });
});

/**
 * GET /api/v1/credentials/shares/me
 * Get my share links (for students)
 */
export const getMyShareLinks = asyncHandler(async (req: Request, res: Response) => {
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

  const shareLinks = await credentialsService.getStudentShareLinks(student.id);
  res.json({ success: true, data: shareLinks });
});

/**
 * DELETE /api/v1/credentials/share/:id
 * Revoke a share link
 */
export const revokeShareLink = asyncHandler(async (req: Request, res: Response) => {
  const { params } = revokeShareLinkSchema.parse({ params: req.params });
  
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
  
  await credentialsService.revokeShareLink(params.id, student.id);
  res.json({ success: true, message: "Share link revoked" });
});
