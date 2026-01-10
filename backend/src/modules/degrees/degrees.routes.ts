import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { requireRole, requireStudent } from "../../middleware/role.guard.js";
import * as degreesController from "./degrees.controller.js";

const router = Router();

// Student routes
router.get("/me", authenticate, requireStudent, degreesController.getMyDegreeProposal);
router.get("/eligibility/me", authenticate, requireStudent, degreesController.checkMyEligibility);

// Admin/Academic routes
router.get("/", authenticate, requireRole("ADMIN", "ACADEMIC"), degreesController.listDegreeProposals);
router.post("/", authenticate, requireRole("ADMIN", "ACADEMIC"), degreesController.createDegreeProposal);
router.get("/eligibility/:studentId", authenticate, requireRole("ADMIN", "ACADEMIC"), degreesController.checkEligibility);
router.get("/:id", authenticate, requireRole("ADMIN", "ACADEMIC"), degreesController.getDegreeProposal);

// Academic review (first stage approval)
router.patch("/:id/academic-review", authenticate, requireRole("ACADEMIC"), degreesController.academicReviewDegreeProposal);

// Admin review (final approval)
router.patch("/:id/admin-review", authenticate, requireRole("ADMIN"), degreesController.adminReviewDegreeProposal);

export default router;
