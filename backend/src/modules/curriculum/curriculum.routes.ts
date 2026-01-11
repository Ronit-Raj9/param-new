import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { requireRole, requireAcademic } from "../../middleware/role.guard.js";
import * as curriculumController from "./curriculum.controller.js";

const router = Router();

// Programs - Allow ADMIN and ACADEMIC to manage
router.get("/programs", authenticate, curriculumController.listPrograms);
router.get("/programs/:id", authenticate, curriculumController.getProgram);
router.post("/programs", authenticate, requireAcademic, curriculumController.createProgram);
router.patch("/programs/:id", authenticate, requireAcademic, curriculumController.updateProgram);

// Curriculums - Allow ADMIN and ACADEMIC to manage
router.get("/", authenticate, curriculumController.listCurriculums);
router.get("/active/:programId", authenticate, curriculumController.getActiveCurriculum);
router.get("/:id", authenticate, curriculumController.getCurriculum);
router.post("/", authenticate, requireAcademic, curriculumController.createCurriculum);
router.patch("/:id", authenticate, requireAcademic, curriculumController.updateCurriculum);

// Courses - Allow ADMIN and ACADEMIC to manage
router.post("/courses", authenticate, requireAcademic, curriculumController.createCourse);
router.get("/courses/:id", authenticate, curriculumController.getCourse);
router.patch("/courses/:id", authenticate, requireAcademic, curriculumController.updateCourse);
router.delete("/courses/:id", authenticate, requireAcademic, curriculumController.deleteCourse);

export default router;
