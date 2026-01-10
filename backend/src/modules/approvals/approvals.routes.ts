import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { requireRole } from "../../middleware/role.guard.js";
import * as approvalsController from "./approvals.controller.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Admin/Academic routes
router.get("/pending/count", requireRole("ADMIN", "ACADEMIC"), approvalsController.getPendingCount);
router.get("/", requireRole("ADMIN", "ACADEMIC"), approvalsController.listApprovals);
router.post("/", requireRole("ADMIN", "ACADEMIC"), approvalsController.createApproval);
router.get("/entity/:entityType/:entityId", requireRole("ADMIN", "ACADEMIC"), approvalsController.getEntityApprovals);
router.get("/:id", requireRole("ADMIN", "ACADEMIC"), approvalsController.getApproval);
router.patch("/:id", requireRole("ADMIN", "ACADEMIC"), approvalsController.reviewApproval);

export default router;
