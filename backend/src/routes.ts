import { Router } from "express";
import authRouter from "./modules/auth/auth.routes.js";
import usersRouter from "./modules/users/users.routes.js";
import studentsRouter from "./modules/students/students.routes.js";
import curriculumRouter from "./modules/curriculum/curriculum.routes.js";
import resultsRouter from "./modules/results/results.routes.js";
import approvalsRouter from "./modules/approvals/approvals.routes.js";
import credentialsRouter from "./modules/credentials/credentials.routes.js";
import degreesRouter from "./modules/degrees/degrees.routes.js";
import verificationRouter from "./modules/verification/verification.routes.js";
import auditRouter from "./modules/audit/audit.routes.js";
import settingsRouter from "./modules/settings/settings.routes.js";
import dashboardRouter from "./modules/dashboard/dashboard.routes.js";
import issuanceRouter from "./modules/issuance/issuance.routes.js";

export const router = Router();

// Auth routes (public)
router.use("/auth", authRouter);

// User management
router.use("/users", usersRouter);

// Student management
router.use("/students", studentsRouter);

// Curriculum management
router.use("/curriculum", curriculumRouter);

// Results management
router.use("/results", resultsRouter);

// Approval workflows
router.use("/approvals", approvalsRouter);

// Credentials/Transcripts
router.use("/credentials", credentialsRouter);

// Degree proposals
router.use("/degrees", degreesRouter);

// Public verification
router.use("/verify", verificationRouter);

// Audit logs
router.use("/audit", auditRouter);

// System settings
router.use("/settings", settingsRouter);

// Dashboard
router.use("/dashboard", dashboardRouter);

// Credential Issuance & Jobs
router.use("/issuance", issuanceRouter);

export default router;
