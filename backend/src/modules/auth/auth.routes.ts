import { Router } from "express";
import { authenticate } from "./auth.middleware.js";
import { requireAdmin } from "../../middleware/role.guard.js";
import * as authController from "./auth.controller.js";

const router = Router();

// Public routes
router.post("/login", authController.login);

// Protected routes
router.get("/me", authenticate, authController.getMe);
router.post("/logout", authenticate, authController.logout);
router.post("/wallet", authenticate, authController.linkWallet);

// Admin only
router.post("/register", authenticate, requireAdmin, authController.register);

export default router;
