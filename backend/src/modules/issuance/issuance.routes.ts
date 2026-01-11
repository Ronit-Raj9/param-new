import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { requireRole, requireAdmin } from "../../middleware/role.guard.js";
import * as issuanceController from "./issuance.controller.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get eligible students for issuance
router.get(
    "/eligible",
    requireRole("ADMIN", "ACADEMIC"),
    issuanceController.getEligible
);

// Issue single credential
router.post(
    "/single",
    requireAdmin,
    issuanceController.issueSingle
);

// Bulk issue credentials
router.post(
    "/bulk",
    requireAdmin,
    issuanceController.issueBulk
);

// Estimate gas for minting
router.post(
    "/estimate-gas",
    requireRole("ADMIN", "ACADEMIC"),
    issuanceController.estimateGas
);

// Job management
router.get(
    "/jobs",
    requireRole("ADMIN", "ACADEMIC"),
    issuanceController.listJobs
);

router.get(
    "/jobs/:jobId",
    requireRole("ADMIN", "ACADEMIC"),
    issuanceController.getJob
);

// Queue statistics
router.get(
    "/queue-stats",
    requireRole("ADMIN", "ACADEMIC"),
    issuanceController.getQueueStats
);

// Wallet health check
router.get(
    "/wallet-health",
    requireAdmin,
    issuanceController.checkWalletHealth
);

export default router;
