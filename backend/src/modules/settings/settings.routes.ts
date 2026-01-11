import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { requireAdmin } from "../../middleware/role.guard.js";
import * as settingsController from "./settings.controller.js";

const router = Router();

// All routes require admin authentication
router.use(authenticate, requireAdmin);

router.get("/", settingsController.getSettings);
router.get("/college", settingsController.getCollegeSettings);
router.patch("/college", settingsController.updateCollegeSettings);
router.get("/approvals/:type", settingsController.getApprovalSettings);
router.patch("/approvals/:type", settingsController.updateApprovalSettings);

export default router;
