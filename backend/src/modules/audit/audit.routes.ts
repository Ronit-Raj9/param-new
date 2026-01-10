import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { requireAdmin } from "../../middleware/role.guard.js";
import * as auditController from "./audit.controller.js";

const router = Router();

// Admin only routes
router.get("/", authenticate, requireAdmin, auditController.getAuditLogs);
router.get("/:entityType/:entityId", authenticate, requireAdmin, auditController.getEntityAuditLogs);

export default router;
