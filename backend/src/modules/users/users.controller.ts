import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/error.handler.js";
import * as usersService from "./users.service.js";
import { createAuditLog } from "../audit/audit.service.js";
import {
  createUserSchema,
  updateUserSchema,
  getUserSchema,
  listUsersSchema,
} from "./users.schema.js";

/**
 * POST /api/v1/users
 * Create a new user
 */
export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const { body } = createUserSchema.parse({ body: req.body });
  
  const user = await usersService.createUser(body);
  
  await createAuditLog({
    action: "USER_CREATED",
    actorId: req.user!.id,
    actorRole: req.user!.role,
    entityType: "User",
    entityId: user.id,
    metadata: { email: user.email, role: user.role },
    ipAddress: req.ip,
  });

  res.status(201).json({
    success: true,
    data: user,
  });
});

/**
 * GET /api/v1/users/:id
 * Get user by ID
 */
export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const { params } = getUserSchema.parse({ params: req.params });
  
  const user = await usersService.getUserById(params.id);

  res.json({
    success: true,
    data: user,
  });
});

/**
 * PATCH /api/v1/users/:id
 * Update user
 */
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { params, body } = updateUserSchema.parse({
    params: req.params,
    body: req.body,
  });

  const existingUser = await usersService.getUserById(params.id);
  const user = await usersService.updateUser(params.id, body);
  
  await createAuditLog({
    action: "USER_UPDATED",
    actorId: req.user!.id,
    actorRole: req.user!.role,
    entityType: "User",
    entityId: user.id,
    metadata: {
      previousState: { name: existingUser.name, role: existingUser.role, status: existingUser.status },
      newState: { name: user.name, role: user.role, status: user.status },
    },
    ipAddress: req.ip,
  });

  res.json({
    success: true,
    data: user,
  });
});

/**
 * GET /api/v1/users
 * List users with filters
 */
export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const { query } = listUsersSchema.parse({ query: req.query });
  
  const result = await usersService.listUsers(query);

  res.json({
    success: true,
    data: result.data,
    pagination: result.pagination,
  });
});

/**
 * DELETE /api/v1/users/:id
 * Delete (deactivate) user
 */
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { params } = getUserSchema.parse({ params: req.params });
  
  await usersService.deleteUser(params.id);
  
  await createAuditLog({
    action: "USER_DEACTIVATED",
    actorId: req.user!.id,
    actorRole: req.user!.role,
    entityType: "User",
    entityId: params.id,
    ipAddress: req.ip,
  });

  res.json({
    success: true,
    message: "User deactivated successfully",
  });
});

/**
 * GET /api/v1/users/stats
 * Get user statistics
 */
export const getUserStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await usersService.getUserStats();

  res.json({
    success: true,
    data: stats,
  });
});
