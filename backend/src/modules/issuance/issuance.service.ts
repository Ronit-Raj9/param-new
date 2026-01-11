import { prisma } from "../../config/database.js";
import { ApiError } from "../../middleware/error.handler.js";
import { createLogger } from "../../utils/logger.js";
import { sha256 } from "../../utils/hash.js";
import { queueMintCredential, queueRevokeCredential } from "../../queues/blockchain.queue.js";
import * as blockchainService from "../../services/blockchain.service.js";
import type { Prisma, Job, JobStatus, JobType } from "@prisma/client";
import type { GetEligibleQuery, BulkIssueInput, SingleIssueInput, ListJobsQuery } from "./issuance.schema.js";

const logger = createLogger("issuance-service");

// ============ ELIGIBLE STUDENTS ============

/**
 * Get students eligible for credential issuance
 */
export async function getEligibleStudents(query: GetEligibleQuery) {
    const { programId, batch, type } = query;

    if (type === "SEMESTER") {
        // Get students with approved semester results that don't have credentials yet
        const results = await prisma.semesterResult.findMany({
            where: {
                status: "APPROVED",
                student: { programId, batch },
                credential: null, // No credential issued yet
            },
            include: {
                student: {
                    include: {
                        user: { select: { name: true, email: true } },
                        program: true,
                    },
                },
            },
            orderBy: [
                { student: { enrollmentNumber: "asc" } },
                { semester: "asc" },
            ],
        });

        return results.map((r) => ({
            studentId: r.studentId,
            studentName: r.student.user.name,
            enrollmentNumber: r.student.enrollmentNumber,
            programName: r.student.program.name,
            semester: r.semester,
            sgpa: r.sgpa,
            semesterResultId: r.id,
            academicYear: r.academicYear,
        }));
    }

    if (type === "DEGREE") {
        // Get students with approved degree proposals that don't have credentials yet
        const proposals = await prisma.degreeProposal.findMany({
            where: {
                status: "APPROVED",
                student: { programId, batch },
                credential: null,
            },
            include: {
                student: {
                    include: {
                        user: { select: { name: true, email: true } },
                        program: true,
                    },
                },
            },
            orderBy: { student: { enrollmentNumber: "asc" } },
        });

        return proposals.map((p) => ({
            studentId: p.studentId,
            studentName: p.student.user.name,
            enrollmentNumber: p.student.enrollmentNumber,
            programName: p.student.program.name,
            cgpa: p.cgpa,
            totalCredits: p.totalCredits,
            degreeProposalId: p.id,
            expectedYear: p.expectedYear,
        }));
    }

    throw ApiError.badRequest("Invalid credential type");
}

// ============ CREATE CREDENTIAL ============

/**
 * Create a credential and queue for blockchain issuance
 */
export async function createAndIssueCredential(
    input: SingleIssueInput,
    issuedBy: string
): Promise<{ credentialId: string; jobId: string }> {
    // Verify student exists
    const student = await prisma.student.findUnique({
        where: { id: input.studentId },
        include: {
            user: true,
            program: true,
        },
    });

    if (!student) {
        throw ApiError.notFound("Student not found");
    }

    // Verify student has a wallet address
    if (!student.walletAddress) {
        throw ApiError.badRequest("Student does not have a wallet address. Wallet must be created before issuance.");
    }

    // Build metadata
    let metadata: Record<string, unknown> = {
        studentName: student.user.name,
        enrollmentNumber: student.enrollmentNumber,
        program: student.program.name,
        programCode: student.program.code,
        admissionYear: student.admissionYear,
        issuedAt: new Date().toISOString(),
    };

    let documentData: string;
    let semesterResultId: string | undefined;
    let degreeProposalId: string | undefined;

    // Handle different credential types
    if (input.type === "SEMESTER") {
        if (!input.semesterResultId) {
            throw ApiError.badRequest("semesterResultId is required for SEMESTER credentials");
        }

        const semesterResult = await prisma.semesterResult.findUnique({
            where: { id: input.semesterResultId },
            include: {
                courseResults: { include: { course: true } },
            },
        });

        if (!semesterResult) {
            throw ApiError.notFound("Semester result not found");
        }

        if (semesterResult.studentId !== input.studentId) {
            throw ApiError.badRequest("Semester result does not belong to this student");
        }

        if (semesterResult.status !== "APPROVED") {
            throw ApiError.badRequest("Semester result must be approved before issuance");
        }

        // Check if credential already exists
        const existingCredential = await prisma.credential.findUnique({
            where: { semesterResultId: input.semesterResultId },
        });

        if (existingCredential) {
            throw ApiError.conflict("Credential already exists for this semester result");
        }

        metadata = {
            ...metadata,
            semester: semesterResult.semester,
            academicYear: semesterResult.academicYear,
            sgpa: semesterResult.sgpa,
            totalCredits: semesterResult.totalCredits,
            courses: semesterResult.courseResults.map((cr) => ({
                code: cr.course.code,
                name: cr.course.name,
                credits: cr.course.credits,
                grade: cr.grade,
                gradePoints: cr.gradePoints,
            })),
        };

        semesterResultId = input.semesterResultId;
        documentData = JSON.stringify({ type: "SEMESTER", metadata });

    } else if (input.type === "DEGREE") {
        if (!input.degreeProposalId) {
            throw ApiError.badRequest("degreeProposalId is required for DEGREE credentials");
        }

        const degreeProposal = await prisma.degreeProposal.findUnique({
            where: { id: input.degreeProposalId },
            include: { student: { include: { program: true } } },
        });

        if (!degreeProposal) {
            throw ApiError.notFound("Degree proposal not found");
        }

        if (degreeProposal.studentId !== input.studentId) {
            throw ApiError.badRequest("Degree proposal does not belong to this student");
        }

        if (degreeProposal.status !== "APPROVED") {
            throw ApiError.badRequest("Degree proposal must be approved before issuance");
        }

        // Check if credential already exists
        const existingCredential = await prisma.credential.findUnique({
            where: { degreeProposalId: input.degreeProposalId },
        });

        if (existingCredential) {
            throw ApiError.conflict("Credential already exists for this degree proposal");
        }

        metadata = {
            ...metadata,
            degreeType: degreeProposal.student.program.degreeType,
            programName: degreeProposal.student.program.name,
            cgpa: degreeProposal.cgpa,
            totalCredits: degreeProposal.totalCredits,
            expectedYear: degreeProposal.expectedYear,
        };

        degreeProposalId = input.degreeProposalId;
        documentData = JSON.stringify({ type: "DEGREE", metadata });

    } else {
        throw ApiError.badRequest("Invalid credential type for issuance");
    }

    // Generate document hash
    const documentHash = sha256(documentData);

    // Create credential in DB
    const credential = await prisma.credential.create({
        data: {
            studentId: input.studentId,
            type: input.type,
            status: "PENDING",
            documentHash,
            metadata: metadata as Prisma.JsonObject,
            semesterResultId,
            degreeProposalId,
        },
    });

    // Create job record
    const jobType: JobType = input.type === "DEGREE"
        ? "BLOCKCHAIN_MINT_DEGREE"
        : "BLOCKCHAIN_MINT_SEMESTER";

    const jobRecord = await prisma.job.create({
        data: {
            type: jobType,
            status: "QUEUED",
            input: {
                credentialId: credential.id,
                studentId: input.studentId,
                documentHash,
            },
            createdBy: issuedBy,
        },
    });

    // Queue blockchain job - mint to student's wallet address (Privy-managed)
    await queueMintCredential({
        credentialId: credential.id,
        studentWallet: student.walletAddress, // Student's Privy-managed wallet
        documentHash: credential.documentHash,
        metadata,
    });

    logger.info({ credentialId: credential.id, jobId: jobRecord.id }, "Credential created and queued for issuance");

    return { credentialId: credential.id, jobId: jobRecord.id };
}

// ============ BULK ISSUANCE ============

/**
 * Issue multiple credentials at once
 */
export async function bulkIssueCredentials(
    input: BulkIssueInput,
    issuedBy: string
): Promise<{ jobId: string; totalQueued: number; errors: Array<{ credentialId: string; error: string }> }> {
    const { credentialIds } = input;
    const errors: Array<{ credentialId: string; error: string }> = [];
    let totalQueued = 0;

    // Create bulk job record
    const bulkJob = await prisma.job.create({
        data: {
            type: "BLOCKCHAIN_MINT_SEMESTER",
            status: "PROCESSING",
            totalItems: credentialIds.length,
            input: { credentialIds },
            createdBy: issuedBy,
            startedAt: new Date(),
        },
    });

    for (const credentialId of credentialIds) {
        try {
            const credential = await prisma.credential.findUnique({
                where: { id: credentialId },
                include: { student: true },
            });

            if (!credential) {
                errors.push({ credentialId, error: "Credential not found" });
                continue;
            }

            if (credential.status !== "PENDING") {
                errors.push({ credentialId, error: `Invalid status: ${credential.status}` });
                continue;
            }

            // Check student has wallet
            if (!credential.student.walletAddress) {
                errors.push({ credentialId, error: "Student has no wallet address" });
                continue;
            }

            // Queue for blockchain - mint to student's wallet
            await queueMintCredential({
                credentialId: credential.id,
                studentWallet: credential.student.walletAddress,
                documentHash: credential.documentHash,
                metadata: credential.metadata as Record<string, unknown>,
            });

            totalQueued++;

        } catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            errors.push({ credentialId, error: message });
            logger.error({ credentialId, error }, "Failed to queue credential");
        }
    }

    // Update job status
    const finalStatus: JobStatus = errors.length === credentialIds.length ? "FAILED" : "COMPLETED";

    await prisma.job.update({
        where: { id: bulkJob.id },
        data: {
            status: finalStatus,
            processedItems: totalQueued,
            failedItems: errors.length,
            output: { totalQueued, errors },
            completedAt: new Date(),
        },
    });

    logger.info({
        jobId: bulkJob.id,
        totalQueued,
        errorCount: errors.length
    }, "Bulk issuance completed");

    return { jobId: bulkJob.id, totalQueued, errors };
}

// ============ GAS ESTIMATION ============

/**
 * Estimate gas for minting credentials
 */
export async function estimateGas(credentialIds: string[]): Promise<{
    totalGasEstimate: string;
    gasPrice: string;
    estimatedCostWei: string;
    estimatedCostEth: string;
    perCredential: Array<{
        credentialId: string;
        gasEstimate: string;
        error?: string;
    }>;
}> {
    if (!blockchainService.isBlockchainEnabled()) {
        throw ApiError.badRequest("Blockchain is not configured");
    }

    const gasPrice = await blockchainService.getCurrentGasPrice();
    const perCredential: Array<{ credentialId: string; gasEstimate: string; error?: string }> = [];
    let totalGas = BigInt(0);

    for (const credentialId of credentialIds) {
        try {
            const credential = await prisma.credential.findUnique({
                where: { id: credentialId },
                include: { student: true },
            });

            if (!credential) {
                perCredential.push({ credentialId, gasEstimate: "0", error: "Not found" });
                continue;
            }

            if (!credential.student.walletAddress) {
                perCredential.push({ credentialId, gasEstimate: "0", error: "Student has no wallet" });
                continue;
            }

            const gas = await blockchainService.estimateMintGas(
                credential.student.walletAddress,
                credential.documentHash,
                credential.documentHash
            );

            totalGas += gas;
            perCredential.push({ credentialId, gasEstimate: gas.toString() });

        } catch (error) {
            const message = error instanceof Error ? error.message : "Estimation failed";
            perCredential.push({ credentialId, gasEstimate: "0", error: message });
        }
    }

    const estimatedCostWei = (totalGas * gasPrice).toString();
    const estimatedCostEth = (Number(estimatedCostWei) / 1e18).toFixed(6);

    return {
        totalGasEstimate: totalGas.toString(),
        gasPrice: gasPrice.toString(),
        estimatedCostWei,
        estimatedCostEth,
        perCredential,
    };
}

// ============ JOB MANAGEMENT ============

/**
 * Get job by ID
 */
export async function getJobById(jobId: string): Promise<Job> {
    const job = await prisma.job.findUnique({
        where: { id: jobId },
    });

    if (!job) {
        throw ApiError.notFound("Job not found");
    }

    return job;
}

/**
 * List jobs with filters
 */
export async function listJobs(query: ListJobsQuery) {
    const { type, status, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.JobWhereInput = {};
    if (type) where.type = type;
    if (status) where.status = status;

    const [jobs, total] = await Promise.all([
        prisma.job.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        }),
        prisma.job.count({ where }),
    ]);

    return {
        data: jobs,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}

/**
 * Get queue statistics
 */
export async function getQueueStats() {
    const [queued, processing, completed, failed] = await Promise.all([
        prisma.job.count({ where: { status: "QUEUED" } }),
        prisma.job.count({ where: { status: "PROCESSING" } }),
        prisma.job.count({ where: { status: "COMPLETED" } }),
        prisma.job.count({ where: { status: "FAILED" } }),
    ]);

    return { queued, processing, completed, failed };
}
