import type { Request, Response } from "express";
import { asyncHandler, ApiError } from "../../middleware/error.handler.js";
import * as dashboardService from "./dashboard.service.js";

/**
 * GET /api/v1/dashboard/admin/stats
 * Get admin dashboard statistics
 */
export const getAdminDashboard = asyncHandler(async (_req: Request, res: Response) => {
  const data = await dashboardService.getAdminDashboardStats();

  res.json({
    success: true,
    data,
  });
});

/**
 * GET /api/v1/dashboard/student
 * Get student dashboard data
 */
export const getStudentDashboard = asyncHandler(async (req: Request, res: Response) => {
  const data = await dashboardService.getStudentDashboard(req.user!.id);

  if (!data) {
    throw ApiError.notFound("Student profile not found");
  }

  res.json({
    success: true,
    data,
  });
});

/**
 * GET /api/v1/dashboard/quick-stats
 * Get quick statistics for overview
 */
export const getQuickStats = asyncHandler(async (_req: Request, res: Response) => {
  const data = await dashboardService.getQuickStats();

  res.json({
    success: true,
    data,
  });
});

/**
 * GET /api/v1/dashboard/admin/counts
 * Get admin sidebar badge counts
 */
export const getSidebarCounts = asyncHandler(async (_req: Request, res: Response) => {
  const data = await dashboardService.getSidebarCounts();

  res.json({
    success: true,
    data,
  });
});
