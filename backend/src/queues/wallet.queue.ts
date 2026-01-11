import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.js";
import { createLogger } from "../utils/logger.js";
import { QUEUE_NAMES } from "../utils/constants.js";

const logger = createLogger("wallet-queue");

// Queue for wallet operations
export const walletQueue = new Queue(QUEUE_NAMES.WALLET || "wallet-operations", {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 3000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
    },
});

// Job types
export interface CreateStudentWalletJob {
    type: "createStudentWallet";
    studentId: string;
    userId: string;
    privyUserId: string;
}

export type WalletJob = CreateStudentWalletJob;

/**
 * Queue a wallet creation job for a student
 */
export async function queueCreateStudentWallet(data: Omit<CreateStudentWalletJob, "type">) {
    const job = await walletQueue.add("createStudentWallet", {
        type: "createStudentWallet",
        ...data
    });
    logger.info({ jobId: job.id, studentId: data.studentId }, "Wallet creation job queued");
    return job;
}

/**
 * Get wallet queue statistics
 */
export async function getWalletQueueStats() {
    const [waiting, active, completed, failed] = await Promise.all([
        walletQueue.getWaitingCount(),
        walletQueue.getActiveCount(),
        walletQueue.getCompletedCount(),
        walletQueue.getFailedCount(),
    ]);

    return { waiting, active, completed, failed };
}
