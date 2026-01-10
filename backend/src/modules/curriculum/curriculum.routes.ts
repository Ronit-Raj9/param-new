import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { requireRole, requireAdmin } from "../../middleware/role.guard.js";
import * as curriculumController from "./curriculum.controller.js";

const router = Router();

// Programs
router.get("/programs", authenticate, curriculumController.listPrograms);
router.get("/programs/:id", authenticate, curriculumController.getProgram);
router.post("/programs", authenticate, requireAdmin, curriculumController.createProgram);
router.patch("/programs/:id", authenticate, requireAdmin, curriculumController.updateProgram);

// Curriculums
router.get("/", authenticate, curriculumController.listCurriculums);
router.get("/active/:programId", authenticate, curriculumController.getActiveCurriculum);
router.get("/:id", authenticate, curriculumController.getCurriculum);
router.post("/", authenticate, requireAdmin, curriculumController.createCurriculum);
router.patch("/:id", authenticate, requireAdmin, curriculumController.updateCurriculum);

// Courses
router.post("/courses", authenticate, requireAdmin, curriculumController.createCourse);
router.get("/courses/:id", authenticate, curriculumController.getCourse);
router.patch("/courses/:id", authenticate, requireAdmin, curriculumController.updateCourse);
router.delete("/courses/:id", authenticate, requireAdmin, curriculumController.deleteCourse);

export default router;
