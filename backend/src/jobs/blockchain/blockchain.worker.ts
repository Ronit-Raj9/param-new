import { Worker, Job } from "bullmq";
import { redisConnection } from "../../config/redis.js";
import { prisma } from "../../config/database.js";
import { createLogger } from "../../utils/logger.js";
import { QUEUE_NAMES } from "../../utils/constants.js";
import * as blockchainService from "../../services/blockchain.service.js";
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
      default:
        throw new Error(`Unknown job type: ${(data as { type: string }).type}`);
    }
  } catch (error) {
    logger.error({ error, jobId: job.id }, "Blockchain job failed");
    throw error;
  }
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
      output: { tokenId, transactionHash, credentialId },
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
