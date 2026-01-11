import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../middleware/error.handler.js";
import * as issuanceService from "./issuance.service.js";
import { createAuditLog } from "../audit/audit.service.js";
import {
    getEligibleSchema,
    bulkIssueSchema,
    singleIssueSchema,
    getJobSchema,
    listJobsSchema,
    estimateGasSchema,
} from "./issuance.schema.js";

// ============ ELIGIBLE STUDENTS ============

/**
 * GET /api/v1/issuance/eligible
 * Get students eligible for credential issuance
 */
export const getEligible = asyncHandler(async (req: Request, res: Response) => {
    const { query } = getEligibleSchema.parse({ query: req.query });

    const eligible = await issuanceService.getEligibleStudents(query);

    res.json({
        success: true,
        data: eligible,
        count: eligible.length,
    });
});

// ============ SINGLE ISSUANCE ============

/**
 * POST /api/v1/issuance/single
 * Create and issue a single credential
 */
export const issueSingle = asyncHandler(async (req: Request, res: Response) => {
    const { body } = singleIssueSchema.parse({ body: req.body });

    const result = await issuanceService.createAndIssueCredential(body, req.user!.id);

    await createAuditLog({
        action: "CREDENTIAL_MINTED",
        actorId: req.user!.id,
        actorRole: req.user!.role,
        entityType: "Credential",
        entityId: result.credentialId,
        metadata: {
            studentId: body.studentId,
            type: body.type,
            jobId: result.jobId,
        },
        ipAddress: typeof req.ip === "string" ? req.ip : undefined,
    });

    res.status(201).json({
        success: true,
        data: result,
        message: "Credential queued for blockchain issuance",
    });
});

// ============ BULK ISSUANCE ============

/**
 * POST /api/v1/issuance/bulk
 * Issue multiple credentials at once
 */
export const issueBulk = asyncHandler(async (req: Request, res: Response) => {
    const { body } = bulkIssueSchema.parse({ body: req.body });

    const result = await issuanceService.bulkIssueCredentials(body, req.user!.id);

    await createAuditLog({
        action: "CREDENTIAL_MINTED",
        actorId: req.user!.id,
        actorRole: req.user!.role,
        entityType: "Job",
        entityId: result.jobId,
        metadata: {
            totalQueued: result.totalQueued,
            errorCount: result.errors.length,
            credentialCount: body.credentialIds.length,
        },
        ipAddress: typeof req.ip === "string" ? req.ip : undefined,
    });

    res.status(201).json({
        success: true,
        data: result,
        message: `${result.totalQueued} credentials queued for blockchain issuance`,
    });
});

// ============ GAS ESTIMATION ============

/**
 * POST /api/v1/issuance/estimate-gas
 * Estimate gas for minting credentials
 */
export const estimateGas = asyncHandler(async (req: Request, res: Response) => {
    const { body } = estimateGasSchema.parse({ body: req.body });

    const estimate = await issuanceService.estimateGas(body.credentialIds);

    res.json({
        success: true,
        data: estimate,
    });
});

// ============ JOB MANAGEMENT ============

/**
 * GET /api/v1/issuance/jobs
 * List all issuance jobs
 */
export const listJobs = asyncHandler(async (req: Request, res: Response) => {
    const { query } = listJobsSchema.parse({ query: req.query });

    const result = await issuanceService.listJobs(query);

    res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
    });
});

/**
 * GET /api/v1/issuance/jobs/:jobId
 * Get a specific job
 */
export const getJob = asyncHandler(async (req: Request, res: Response) => {
    const { params } = getJobSchema.parse({ params: req.params });

    const job = await issuanceService.getJobById(params.jobId);

    res.json({
        success: true,
        data: job,
    });
});

/**
 * GET /api/v1/issuance/queue-stats
 * Get queue statistics
 */
export const getQueueStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await issuanceService.getQueueStats();

    res.json({
        success: true,
        data: stats,
    });
});

/**
 * GET /api/v1/issuance/wallet-health
 * Check wallet configuration and balance
 */
export const checkWalletHealth = asyncHandler(async (req: Request, res: Response) => {
    // Import here to avoid circular dependency
    const privyWalletService = await import("../../services/privy-wallet.service.js");

    const health = await privyWalletService.checkWalletHealth();

    res.json({
        success: true,
        data: health,
    });
});
