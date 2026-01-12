import { Worker, Job } from "bullmq";
import { redisConnection } from "../../config/redis.js";
import { prisma } from "../../config/database.js";
import { createLogger } from "../../utils/logger.js";
import { QUEUE_NAMES } from "../../utils/constants.js";
import * as blockchainService from "../../services/blockchain.service.js";
import * as chainSyncService from "../../services/chain-sync.service.js";
import type { BlockchainJob } from "../../queues/blockchain.queue.js";

const logger = createLogger("blockchain-worker");

/**
 * Process blockchain jobs
 */
async function processBlockchainJob(job: Job<BlockchainJob>) {
  const { data } = job;

  logger.info({ jobId: job.id, type: data.type }, "Processing blockchain job");

  try {
    switch (data.type) {
      case "mint":
        return await processMintJob(job);
      case "revoke":
        return await processRevokeJob(job);
      case "sync-student":
        return await processSyncStudentJob(job);
      case "sync-semester-result":
        return await processSyncSemesterResultJob(job);
      case "propose-degree":
        return await processProposeDegreeJob(job);
      case "approve-degree":
        return await processApproveDegreeJob(job);
      case "finalize-degree":
        return await processFinalizeDegreeJob(job);
      case "issue-certificate":
        return await processIssueCertificateJob(job);
      default:
        throw new Error(`Unknown job type: ${(data as { type: string }).type}`);
    }
  } catch (error) {
    logger.error({ error, jobId: job.id }, "Blockchain job failed");
    throw error;
  }
}

/**
 * Helper to serialize BigInts for JSON storage
 */
function serializeForJson(obj: any): any {
  return JSON.parse(JSON.stringify(obj, (_, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
}

/**
 * Process mint credential job
 */
async function processMintJob(job: Job) {
  const { credentialId, studentWallet, documentHash } = job.data;

  // Get credential
  const credential = await prisma.credential.findUnique({
    where: { id: credentialId },
  });

  if (!credential) {
    throw new Error(`Credential ${credentialId} not found`);
  }

  if (credential.status !== "PENDING") {
    throw new Error(`Credential ${credentialId} is not pending`);
  }

  // Mint NFT (using document hash as token URI)
  const { tokenId, transactionHash } = await blockchainService.mintCredentialNFT(
    studentWallet,
    documentHash, // Use document hash as identifier
    credential.documentHash
  );

  // Update credential
  await prisma.credential.update({
    where: { id: credentialId },
    data: {
      status: "ISSUED",
      tokenId,
      txHash: transactionHash,
      issuedAt: new Date(),
    },
  });

  // Create job record
  await prisma.job.create({
    data: {
      type: "BLOCKCHAIN_MINT_SEMESTER",
      status: "COMPLETED",
      output: serializeForJson({ tokenId, transactionHash, credentialId }),
      completedAt: new Date(),
    },
  });

  logger.info({ credentialId, tokenId, transactionHash }, "Credential minted successfully");

  return { tokenId, transactionHash };
}

/**
 * Process revoke credential job
 */
async function processRevokeJob(job: Job) {
  const { credentialId, tokenId, reason } = job.data;

  // Revoke on blockchain
  const transactionHash = await blockchainService.revokeCredentialNFT(tokenId, reason || "Revoked by administrator");

  // Create job record
  await prisma.job.create({
    data: {
      type: "BLOCKCHAIN_REVOKE",
      status: "COMPLETED",
      output: { transactionHash, reason, credentialId },
      completedAt: new Date(),
    },
  });

  logger.info({ credentialId, tokenId, transactionHash }, "Credential revoked on blockchain");

  return { transactionHash };
}

/**
 * Process sync student to blockchain job
 */
async function processSyncStudentJob(job: Job) {
  const { studentId } = job.data;

  logger.info({ studentId, jobId: job.id }, "Syncing student to blockchain");

  const result = await chainSyncService.syncStudentToChain(studentId);

  // Create job record
  await prisma.job.create({
    data: {
      type: "BLOCKCHAIN_SYNC_STUDENT",
      status: "COMPLETED",
      output: serializeForJson(result),
      completedAt: new Date(),
    },
  });

  logger.info({ studentId, ...result }, "Student synced to blockchain");

  return result;
}

/**
 * Process sync semester result to blockchain job
 */
async function processSyncSemesterResultJob(job: Job) {
  const { semesterResultId } = job.data;

  logger.info({ semesterResultId, jobId: job.id }, "Syncing semester result to blockchain");

  const result = await chainSyncService.syncSemesterResultToChain(semesterResultId);

  // Create job record
  await prisma.job.create({
    data: {
      type: "BLOCKCHAIN_MINT_SEMESTER",
      status: "COMPLETED",
      output: serializeForJson(result),
      completedAt: new Date(),
    },
  });

  logger.info({ semesterResultId, ...result }, "Semester result synced to blockchain");

  return result;
}

/**
 * Process propose degree on blockchain job
 */
async function processProposeDegreeJob(job: Job) {
  const { degreeProposalId } = job.data;

  logger.info({ degreeProposalId, jobId: job.id }, "Proposing degree on blockchain");

  const result = await chainSyncService.proposeDegreeOnChain(degreeProposalId);

  // Create job record
  await prisma.job.create({
    data: {
      type: "BLOCKCHAIN_DEGREE_PROPOSAL",
      status: "COMPLETED",
      output: serializeForJson(result),
      completedAt: new Date(),
    },
  });

  logger.info({ degreeProposalId, ...result }, "Degree proposed on blockchain");

  return result;
}

/**
 * Process approve degree on blockchain job
 */
async function processApproveDegreeJob(job: Job) {
  const { degreeProposalId } = job.data;

  logger.info({ degreeProposalId, jobId: job.id }, "Approving degree on blockchain");

  const result = await chainSyncService.approveDegreeOnChain(degreeProposalId);

  // Create job record
  await prisma.job.create({
    data: {
      type: "BLOCKCHAIN_DEGREE_APPROVAL",
      status: "COMPLETED",
      output: serializeForJson(result),
      completedAt: new Date(),
    },
  });

  logger.info({ degreeProposalId, ...result }, "Degree approved on blockchain");

  return result;
}

/**
 * Process finalize degree and mint NFT job
 */
async function processFinalizeDegreeJob(job: Job) {
  const { degreeProposalId } = job.data;

  logger.info({ degreeProposalId, jobId: job.id }, "Finalizing degree on blockchain");

  const result = await chainSyncService.finalizeDegreeOnChain(degreeProposalId);

  // Create job record
  await prisma.job.create({
    data: {
      type: "BLOCKCHAIN_MINT_DEGREE",
      status: "COMPLETED",
      output: serializeForJson(result),
      completedAt: new Date(),
    },
  });

  logger.info({ degreeProposalId, ...result }, "Degree finalized and NFT minted");

  return result;
}

/**
 * Process issue certificate for dropout/early exit
 */
async function processIssueCertificateJob(job: Job) {
  const { studentId, yearsCompleted, exitReason } = job.data;

  logger.info({ studentId, yearsCompleted, exitReason, jobId: job.id }, "Issuing certificate on blockchain");

  const result = await chainSyncService.issueCertificateOnChain(studentId, yearsCompleted, exitReason);

  // Create job record
  await prisma.job.create({
    data: {
      type: "BLOCKCHAIN_MINT_CERTIFICATE",
      status: "COMPLETED",
      output: serializeForJson(result),
      completedAt: new Date(),
    },
  });

  logger.info({ studentId, ...result }, "Certificate issued on blockchain");

  return result;
}

/**
 * Create and start the blockchain worker
 */
export function createBlockchainWorker() {
  const worker = new Worker(QUEUE_NAMES.BLOCKCHAIN, processBlockchainJob, {
    connection: redisConnection,
    concurrency: 1, // Process one at a time for blockchain operations
  });

  worker.on("completed", (job) => {
    logger.info({ jobId: job.id }, "Blockchain job completed");
  });

  worker.on("failed", (job, error) => {
    logger.error({ jobId: job?.id, error: error.message }, "Blockchain job failed");
  });

  logger.info("Blockchain worker started");
  return worker;
}
