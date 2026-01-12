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

export interface SyncStudentJob {
  type: "sync-student";
  studentId: string;
}

export interface SyncSemesterResultJob {
  type: "sync-semester-result";
  semesterResultId: string;
}

export interface ProposeDegreeJob {
  type: "propose-degree";
  degreeProposalId: string;
}

export interface ApproveDegreeJob {
  type: "approve-degree";
  degreeProposalId: string;
}

export interface FinalizeDegreeJob {
  type: "finalize-degree";
  degreeProposalId: string;
}

export interface IssueCertificateJob {
  type: "issue-certificate";
  studentId: string;
  yearsCompleted: number;
  exitReason: string;
}

export type BlockchainJob =
  | MintCredentialJob
  | RevokeCredentialJob
  | SyncStudentJob
  | SyncSemesterResultJob
  | ProposeDegreeJob
  | ApproveDegreeJob
  | FinalizeDegreeJob
  | IssueCertificateJob;

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
 * Queue student sync to blockchain (after activation)
 */
export async function queueSyncStudent(studentId: string) {
  const job = await blockchainQueue.add("sync-student", {
    type: "sync-student",
    studentId,
  });
  logger.info({ jobId: job.id, studentId }, "Student sync job queued");
  return job;
}

/**
 * Queue semester result sync to blockchain
 */
export async function queueSyncSemesterResult(semesterResultId: string) {
  const job = await blockchainQueue.add("sync-semester-result", {
    type: "sync-semester-result",
    semesterResultId,
  });
  logger.info({ jobId: job.id, semesterResultId }, "Semester result sync job queued");
  return job;
}

/**
 * Queue degree proposal on blockchain
 */
export async function queueProposeDegree(degreeProposalId: string) {
  const job = await blockchainQueue.add("propose-degree", {
    type: "propose-degree",
    degreeProposalId,
  });
  logger.info({ jobId: job.id, degreeProposalId }, "Degree proposal job queued");
  return job;
}

/**
 * Queue degree approval on blockchain
 */
export async function queueApproveDegree(degreeProposalId: string) {
  const job = await blockchainQueue.add("approve-degree", {
    type: "approve-degree",
    degreeProposalId,
  });
  logger.info({ jobId: job.id, degreeProposalId }, "Degree approval job queued");
  return job;
}

/**
 * Queue degree finalization and NFT minting
 */
export async function queueFinalizeDegree(degreeProposalId: string) {
  const job = await blockchainQueue.add("finalize-degree", {
    type: "finalize-degree",
    degreeProposalId,
  });
  logger.info({ jobId: job.id, degreeProposalId }, "Degree finalization job queued");
  return job;
}

/**
 * Queue certificate issuance for dropout/early exit
 */
export async function queueIssueCertificate(studentId: string, yearsCompleted: number, exitReason: string) {
  const job = await blockchainQueue.add("issue-certificate", {
    type: "issue-certificate",
    studentId,
    yearsCompleted,
    exitReason,
  });
  logger.info({ jobId: job.id, studentId }, "Certificate issuance job queued");
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
