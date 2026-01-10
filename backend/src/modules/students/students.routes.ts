import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { requireRole, requireStudent } from "../../middleware/role.guard.js";
import * as studentsController from "./students.controller.js";

const router = Router();

// Student routes
router.get("/me", authenticate, requireStudent, studentsController.getMyProfile);

// Admin/Academic routes
router.get("/stats", authenticate, requireRole("ADMIN", "ACADEMIC"), studentsController.getStudentStats);
router.get("/", authenticate, requireRole("ADMIN", "ACADEMIC"), studentsController.listStudents);
router.post("/", authenticate, requireRole("ADMIN", "ACADEMIC"), studentsController.createStudent);
router.post("/bulk", authenticate, requireRole("ADMIN", "ACADEMIC"), studentsController.bulkImport);
router.get("/enrollment/:enrollmentNo", authenticate, requireRole("ADMIN", "ACADEMIC"), studentsController.getStudentByEnrollment);
router.get("/:id", authenticate, requireRole("ADMIN", "ACADEMIC"), studentsController.getStudent);
router.patch("/:id", authenticate, requireRole("ADMIN", "ACADEMIC"), studentsController.updateStudent);

export default router;
