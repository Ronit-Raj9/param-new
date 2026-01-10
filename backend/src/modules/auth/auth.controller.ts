import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/error.handler.js";
import * as authService from "./auth.service.js";
import { loginSchema, registerSchema, linkWalletSchema } from "./auth.schema.js";
import { createAuditLog } from "../audit/audit.service.js";

/**
 * POST /api/v1/auth/login
 * Authenticate with Privy token
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { body } = loginSchema.parse({ body: req.body });
  
  const { user, isNewUser } = await authService.authenticateWithPrivy(body);
  
  // Log login action
  await createAuditLog({
    action: "USER_LOGIN",
    actorId: user.id,
    entityType: "User",
    entityId: user.id,
    metadata: { email: user.email, isNewUser },
    ipAddress: req.ip || "unknown",
  });

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
      },
      isNewUser,
    },
  });
});

/**
 * POST /api/v1/auth/register
 * Pre-register a user (admin only)
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { body } = registerSchema.parse({ body: req.body });
  
  const user = await authService.preRegisterUser(body, req.user!.id);
  
  await createAuditLog({
    action: "USER_CREATED",
    actorId: req.user!.id,
    entityType: "User",
    entityId: user.id,
    metadata: { email: user.email, role: user.role },
    ipAddress: req.ip || "unknown",
  });

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
      },
    },
  });
});

/**
 * GET /api/v1/auth/me
 * Get current user profile
 */
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getUserProfile(req.user!.id);

  res.json({
    success: true,
    data: { user },
  });
});

/**
 * POST /api/v1/auth/wallet
 * Link wallet address to user (currently not stored in DB, managed by Privy)
 */
export const linkWallet = asyncHandler(async (req: Request, res: Response) => {
  const { body } = linkWalletSchema.parse({ body: req.body });
  
  // Wallet linking is handled by Privy client-side
  // This endpoint just logs the action
  await createAuditLog({
    action: "USER_UPDATED",
    actorId: req.user!.id,
    entityType: "User",
    entityId: req.user!.id,
    description: "Wallet linked via Privy",
    metadata: { walletAddress: body.address },
    ipAddress: req.ip || "unknown",
  });

  res.json({
    success: true,
    message: "Wallet linked successfully",
  });
});

/**
 * POST /api/v1/auth/logout
 * Logout (client-side token removal, server-side logging)
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  await createAuditLog({
    action: "USER_LOGOUT",
    actorId: req.user!.id,
    entityType: "User",
    entityId: req.user!.id,
    ipAddress: req.ip || "unknown",
  });

  res.json({
    success: true,
    message: "Logged out successfully",
  });
});
