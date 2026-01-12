import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { requireAdmin, requireStudent, requireRole } from "../../middleware/role.guard.js";
import * as dashboardController from "./dashboard.controller.js";

const router = Router();

// Admin dashboard - requires admin role
router.get(
  "/admin/stats",
  authenticate,
  requireRole("ADMIN", "ACADEMIC"),
  dashboardController.getAdminDashboard
);

// Admin sidebar counts
router.get(
  "/admin/counts",
  authenticate,
  requireRole("ADMIN", "ACADEMIC"),
  dashboardController.getSidebarCounts
);

// Student dashboard - requires student role
router.get(
  "/student",
  authenticate,
  requireStudent,
  dashboardController.getStudentDashboard
);

// Quick stats - for any authenticated user
router.get(
  "/quick-stats",
  authenticate,
  requireRole("ADMIN", "ACADEMIC"),
  dashboardController.getQuickStats
);

export default router;
