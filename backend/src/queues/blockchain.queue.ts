import { Queue, Worker, Job } from "bullmq";
import { redisConnection } from "../config/redis.js";
import { createLogger } from "../utils/logger.js";
import { QUEUE_NAMES } from "../utils/constants.js";

const logger = createLogger("blockchain-queue");

// Queue for blockchain operations
export const blockchainQueue = new Queue(QUEUE_NAMES.BLOCKCHAIN, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

// Job types
export interface MintCredentialJob {
  type: "mint";
  credentialId: string;
  studentWallet: string;
  documentHash: string;
  metadata: Record<string, unknown>;
}

export interface RevokeCredentialJob {
  type: "revoke";
  credentialId: string;
  tokenId: string;
  reason: string;
}

export type BlockchainJob = MintCredentialJob | RevokeCredentialJob;

/**
 * Add a mint job to the queue
 */
export async function queueMintCredential(data: Omit<MintCredentialJob, "type">) {
  const job = await blockchainQueue.add("mint", { type: "mint", ...data });
  logger.info({ jobId: job.id, credentialId: data.credentialId }, "Mint job queued");
  return job;
}

/**
 * Add a revoke job to the queue
 */
export async function queueRevokeCredential(data: Omit<RevokeCredentialJob, "type">) {
  const job = await blockchainQueue.add("revoke", { type: "revoke", ...data });
  logger.info({ jobId: job.id, credentialId: data.credentialId }, "Revoke job queued");
  return job;
}

/**
 * Get queue statistics
 */
export async function getQueueStats() {
  const [waiting, active, completed, failed] = await Promise.all([
    blockchainQueue.getWaitingCount(),
    blockchainQueue.getActiveCount(),
    blockchainQueue.getCompletedCount(),
    blockchainQueue.getFailedCount(),
  ]);

  return { waiting, active, completed, failed };
}
