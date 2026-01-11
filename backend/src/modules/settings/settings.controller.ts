import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/error.handler.js";
import * as settingsService from "./settings.service.js";
import { createAuditLog } from "../audit/audit.service.js";
import { z } from "zod";

const updateCollegeSettingsSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    shortName: z.string().optional(),
    fullName: z.string().optional(),
    logoUrl: z.string().url().optional().nullable(),
    websiteUrl: z.string().url().optional().nullable(),
    address: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    country: z.string().optional(),
    pincode: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    email: z.string().email().optional().nullable(),
    chainId: z.number().optional(),
    rpcUrl: z.string().url().optional().nullable(),
    contractSemester: z.string().optional().nullable(),
    contractDegree: z.string().optional().nullable(),
    degreeSoulbound: z.boolean().optional(),
    allowCorrections: z.boolean().optional(),
    requireCreditValidation: z.boolean().optional(),
    gradingSystem: z.record(z.number()).optional().nullable(),
  }),
});

const updateApprovalSettingsSchema = z.object({
  params: z.object({
    type: z.enum(["CURRICULUM", "SEMESTER_RESULT", "DEGREE_PROPOSAL", "CORRECTION"]),
  }),
  body: z.object({
    requiredLevels: z.number().min(1).max(5).optional(),
    levelNames: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
  }),
});

/**
 * GET /api/v1/settings
 * Get all system settings
 */
export const getSettings = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await settingsService.getSettings();

  res.json({
    success: true,
    data: settings,
  });
});

/**
 * GET /api/v1/settings/college
 * Get college settings
 */
export const getCollegeSettings = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await settingsService.getCollegeSettings();

  res.json({
    success: true,
    data: settings,
  });
});

/**
 * PATCH /api/v1/settings/college
 * Update college settings
 */
export const updateCollegeSettings = asyncHandler(async (req: Request, res: Response) => {
  const { body } = updateCollegeSettingsSchema.parse({ body: req.body });
  
  const previousSettings = await settingsService.getCollegeSettings();
  const settings = await settingsService.updateCollegeSettings(body);

  await createAuditLog({
    action: "SETTINGS_UPDATED",
    actorId: req.user!.id,
    actorRole: req.user!.role,
    entityType: "CollegeSettings",
    entityId: "default",
    metadata: {
      changedFields: Object.keys(body),
    },
    ipAddress: req.ip,
  });

  res.json({
    success: true,
    data: settings,
  });
});

/**
 * GET /api/v1/settings/approvals/:type
 * Get approval settings by type
 */
export const getApprovalSettings = asyncHandler(async (req: Request, res: Response) => {
  const { params } = updateApprovalSettingsSchema.pick({ params: true }).parse({ params: req.params });
  
  const settings = await settingsService.getApprovalSettings(params.type);

  res.json({
    success: true,
    data: settings,
  });
});

/**
 * PATCH /api/v1/settings/approvals/:type
 * Update approval settings
 */
export const updateApprovalSettings = asyncHandler(async (req: Request, res: Response) => {
  const { params, body } = updateApprovalSettingsSchema.parse({
    params: req.params,
    body: req.body,
  });
  
  const settings = await settingsService.updateApprovalSettings(params.type, body);

  await createAuditLog({
    action: "SETTINGS_UPDATED",
    actorId: req.user!.id,
    actorRole: req.user!.role,
    entityType: "ApprovalSettings",
    entityId: params.type,
    metadata: {
      changedFields: Object.keys(body),
    },
    ipAddress: req.ip,
  });

  res.json({
    success: true,
    data: settings,
  });
});
