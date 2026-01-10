import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { requireRole, requireStudent } from "../../middleware/role.guard.js";
import * as resultsController from "./results.controller.js";

const router = Router();

// Student routes
router.get("/me", authenticate, requireStudent, resultsController.getMyResults);
router.post("/corrections", authenticate, requireStudent, resultsController.createCorrectionRequest);

// Correction requests (shared)
router.get("/corrections", authenticate, resultsController.getCorrectionRequests);
router.patch("/corrections/:id", authenticate, requireRole("ADMIN", "ACADEMIC"), resultsController.reviewCorrectionRequest);

// Admin/Academic routes
router.get("/", authenticate, requireRole("ADMIN", "ACADEMIC"), resultsController.listResults);
router.post("/", authenticate, requireRole("ADMIN", "ACADEMIC"), resultsController.createSemesterResult);
router.post("/bulk", authenticate, requireRole("ADMIN", "ACADEMIC"), resultsController.bulkUploadResults);
router.get("/student/:studentId", authenticate, requireRole("ADMIN", "ACADEMIC"), resultsController.getStudentResults);
router.get("/:id", authenticate, requireRole("ADMIN", "ACADEMIC"), resultsController.getSemesterResult);
router.patch("/course/:id", authenticate, requireRole("ADMIN", "ACADEMIC"), resultsController.updateCourseResult);
router.patch("/:id/status", authenticate, requireRole("ADMIN", "ACADEMIC"), resultsController.updateSemesterResultStatus);

export default router;
