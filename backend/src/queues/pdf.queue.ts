import { Queue, Job } from "bullmq";
import { redisConnection } from "../config/redis.js";
import { createLogger } from "../utils/logger.js";
import { QUEUE_NAMES } from "../utils/constants.js";

const logger = createLogger("pdf-queue");

// Queue for PDF generation
export const pdfQueue = new Queue(QUEUE_NAMES.PDF, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

// Job types
export interface GenerateTranscriptJob {
  type: "transcript";
  credentialId: string;
  studentId: string;
  semesterResultIds: string[];
}

export interface GenerateCertificateJob {
  type: "certificate";
  credentialId: string;
  studentId: string;
  degreeProposalId: string;
}

export type PDFJob = GenerateTranscriptJob | GenerateCertificateJob;

/**
 * Add a transcript generation job
 */
export async function queueGenerateTranscript(data: Omit<GenerateTranscriptJob, "type">) {
  const job = await pdfQueue.add("transcript", { type: "transcript", ...data });
  logger.info({ jobId: job.id, credentialId: data.credentialId }, "Transcript generation queued");
  return job;
}

/**
 * Add a certificate generation job
 */
export async function queueGenerateCertificate(data: Omit<GenerateCertificateJob, "type">) {
  const job = await pdfQueue.add("certificate", { type: "certificate", ...data });
  logger.info({ jobId: job.id, credentialId: data.credentialId }, "Certificate generation queued");
  return job;
}

/**
 * Get queue statistics
 */
export async function getQueueStats() {
  const [waiting, active, completed, failed] = await Promise.all([
    pdfQueue.getWaitingCount(),
    pdfQueue.getActiveCount(),
    pdfQueue.getCompletedCount(),
    pdfQueue.getFailedCount(),
  ]);

  return { waiting, active, completed, failed };
}
