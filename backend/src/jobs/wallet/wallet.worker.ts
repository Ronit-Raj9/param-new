import { Worker, Job } from "bullmq";
import { redisConnection } from "../../config/redis.js";
import { prisma } from "../../config/database.js";
import { createLogger } from "../../utils/logger.js";
import { QUEUE_NAMES } from "../../utils/constants.js";
import { getPrivyNodeClient } from "../../config/privy.js";
import type { WalletJob } from "../../queues/wallet.queue.js";

const logger = createLogger("wallet-worker");

/**
 * Process wallet jobs
 */
async function processWalletJob(job: Job<WalletJob>) {
    const { data } = job;

    logger.info({ jobId: job.id, type: data.type }, "Processing wallet job");

    try {
        switch (data.type) {
            case "createStudentWallet":
                return await processCreateWalletJob(job);
            default:
                throw new Error(`Unknown job type: ${(data as { type: string }).type}`);
        }
    } catch (error) {
        logger.error({ error, jobId: job.id }, "Wallet job failed");
        throw error;
    }
}

/**
 * Create a wallet for a student via Privy Wallet API
 * 
 * Uses Privy's server-side wallet creation to create an Ethereum wallet.
 * The student never manages keys - this is purely for credential issuance.
 * 
 * @see https://docs.privy.io/wallets/wallets/create/create-a-wallet
 */
async function processCreateWalletJob(job: Job) {
    const { studentId, userId, privyUserId } = job.data;

    // Check if student already has a wallet
    const student = await prisma.student.findUnique({
        where: { id: studentId },
    });

    if (!student) {
        throw new Error(`Student ${studentId} not found`);
    }

    if (student.walletAddress) {
        logger.info({ studentId, walletAddress: student.walletAddress }, "Student already has wallet");
        return { walletAddress: student.walletAddress, alreadyExists: true };
    }

    const privyClient = getPrivyNodeClient();

    let walletAddress: string;
    let walletId: string;

    try {
        // Create wallet using Privy Wallet API
        // @see https://docs.privy.io/api-reference/wallets/create
        const wallet = await privyClient.wallets().create({
            chain_type: "ethereum",
        });

        walletId = wallet.id;
        walletAddress = wallet.address;

        logger.info(
            { studentId, walletId, walletAddress, privyUserId },
            "Privy wallet created successfully"
        );

    } catch (error) {
        // Handle specific Privy errors
        if (error instanceof Error) {
            logger.error({ error: error.message, studentId, privyUserId }, "Failed to create Privy wallet");
        }
        throw error;
    }

    // Update student record with wallet info
    await prisma.student.update({
        where: { id: studentId },
        data: {
            walletAddress,
            walletId,
            walletCreatedAt: new Date(),
        },
    });

    // Create job record for audit trail
    await prisma.job.create({
        data: {
            type: "WALLET_CREATE",
            status: "COMPLETED",
            output: {
                walletAddress,
                walletId,
                studentId,
                privyUserId,
                provider: "privy",
            },
            completedAt: new Date(),
        },
    });

    logger.info({ studentId, walletAddress, walletId }, "Student wallet created and saved");

    return { walletAddress, walletId };
}

/**
 * Create and start the wallet worker
 */
export function createWalletWorker() {
    const worker = new Worker(QUEUE_NAMES.WALLET, processWalletJob, {
        connection: redisConnection,
        concurrency: 5, // Can process multiple wallet creations in parallel
    });

    worker.on("completed", (job) => {
        logger.info({ jobId: job.id }, "Wallet job completed");
    });

    worker.on("failed", (job, error) => {
        logger.error({ jobId: job?.id, error: error.message }, "Wallet job failed");
    });

    logger.info("Wallet worker started");
    return worker;
}
