import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/error.handler.js";
import * as verificationService from "./verification.service.js";
import { z } from "zod";

/**
 * GET /api/v1/verify/:token
 * Verify credential by share token (public)
 */
export const verifyByToken = asyncHandler(async (req: Request, res: Response) => {
  const token = req.params.token as string;
  const result = await verificationService.verifyByShareToken(token);
  res.json({ success: true, data: result });
});

/**
 * POST /api/v1/verify/hash
 * Verify credential by hash (public)
 */
export const verifyByHash = asyncHandler(async (req: Request, res: Response) => {
  const schema = z.object({
    hash: z.string().min(64),
  });
  
  const { hash } = schema.parse(req.body);
  const result = await verificationService.verifyByHash(hash);
  res.json({ success: true, data: result });
});

/**
 * POST /api/v1/verify/token-id
 * Verify credential by blockchain token ID (public)
 */
export const verifyByTokenId = asyncHandler(async (req: Request, res: Response) => {
  const schema = z.object({
    tokenId: z.string().min(1),
  });
  
  const { tokenId } = schema.parse(req.body);
  const result = await verificationService.verifyByTokenId(tokenId);
  res.json({ success: true, data: result });
});

/**
 * POST /api/v1/verify/integrity
 * Verify data integrity (public)
 */
export const verifyIntegrity = asyncHandler(async (req: Request, res: Response) => {
  const schema = z.object({
    credentialId: z.string().uuid(),
    hash: z.string().min(64),
  });
  
  const { credentialId, hash } = schema.parse(req.body);
  const result = await verificationService.verifyDataIntegrity(credentialId, hash);
  res.json({ success: true, data: result });
});

/**
 * GET /api/v1/verify/stats
 * Get public verification statistics
 */
export const getStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await verificationService.getVerificationStats();
  res.json({ success: true, data: stats });
});
