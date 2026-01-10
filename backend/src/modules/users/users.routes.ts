import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { requireAdmin } from "../../middleware/role.guard.js";
import * as usersController from "./users.controller.js";

const router = Router();

// All routes require admin
router.use(authenticate, requireAdmin);

router.get("/stats", usersController.getUserStats);
router.get("/", usersController.listUsers);
router.post("/", usersController.createUser);
router.get("/:id", usersController.getUser);
router.patch("/:id", usersController.updateUser);
router.delete("/:id", usersController.deleteUser);

export default router;
