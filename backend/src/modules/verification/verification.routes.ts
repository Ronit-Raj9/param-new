import { Router } from "express";
import * as verificationController from "./verification.controller.js";

const router = Router();

// All routes are public
router.get("/stats", verificationController.getStats);
router.get("/:token", verificationController.verifyByToken);
router.post("/hash", verificationController.verifyByHash);
router.post("/token-id", verificationController.verifyByTokenId);
router.post("/integrity", verificationController.verifyIntegrity);

export default router;
