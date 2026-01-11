import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { requireRole, requireStudent } from "../../middleware/role.guard.js";
import * as credentialsController from "./credentials.controller.js";

const router = Router();

// Public routes (for verification)
router.get("/share/:token", credentialsController.getShareLink);

// Student routes
router.get("/student", authenticate, requireStudent, credentialsController.getMyCredentials);
router.get("/student/degree", authenticate, requireStudent, credentialsController.getMyDegree);
router.get("/shares", authenticate, requireStudent, credentialsController.getMyShareLinks);
router.post("/share", authenticate, requireStudent, credentialsController.createShareLink);
router.delete("/shares/:id", authenticate, requireStudent, credentialsController.revokeShareLink);

// Legacy student routes (for backwards compatibility)
router.get("/me", authenticate, requireStudent, credentialsController.getMyCredentials);
router.get("/shares/me", authenticate, requireStudent, credentialsController.getMyShareLinks);
router.delete("/share/:id", authenticate, requireStudent, credentialsController.revokeShareLink);

// Admin/Academic routes
router.get("/", authenticate, requireRole("ADMIN", "ACADEMIC"), credentialsController.listCredentials);
router.post("/", authenticate, requireRole("ADMIN", "ACADEMIC"), credentialsController.createCredential);
router.get("/:id", authenticate, credentialsController.getCredential);
router.get("/:credentialId/shares", authenticate, credentialsController.getCredentialShareLinks);
router.post("/:id/issue", authenticate, requireRole("ADMIN"), credentialsController.issueCredential);
router.post("/:id/revoke", authenticate, requireRole("ADMIN"), credentialsController.revokeCredential);

export default router;
