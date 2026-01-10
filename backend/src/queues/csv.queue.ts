import { Queue, Job } from "bullmq";
import { redisConnection } from "../config/redis.js";
import { createLogger } from "../utils/logger.js";
import { QUEUE_NAMES } from "../utils/constants.js";

const logger = createLogger("csv-queue");

// Queue for CSV processing
export const csvQueue = new Queue(QUEUE_NAMES.CSV, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: "fixed",
      delay: 3000,
    },
    removeOnComplete: 50,
    removeOnFail: 20,
  },
});

// Job types
export interface ParseResultsCSVJob {
  type: "parse-results";
  fileUrl: string;
  semester: number;
  academicYear: string;
  programId: string;
  uploadedBy: string;
}

export interface ParseStudentsCSVJob {
  type: "parse-students";
  fileUrl: string;
  programId: string;
  batchYear: number;
  uploadedBy: string;
}

export type CSVJob = ParseResultsCSVJob | ParseStudentsCSVJob;

/**
 * Add a results CSV parsing job
 */
export async function queueParseResultsCSV(data: Omit<ParseResultsCSVJob, "type">) {
  const job = await csvQueue.add("parse-results", { type: "parse-results", ...data });
  logger.info({ jobId: job.id, fileUrl: data.fileUrl }, "Results CSV parse job queued");
  return job;
}

/**
 * Add a students CSV parsing job
 */
export async function queueParseStudentsCSV(data: Omit<ParseStudentsCSVJob, "type">) {
  const job = await csvQueue.add("parse-students", { type: "parse-students", ...data });
  logger.info({ jobId: job.id, fileUrl: data.fileUrl }, "Students CSV parse job queued");
  return job;
}

/**
 * Get queue statistics
 */
export async function getQueueStats() {
  const [waiting, active, completed, failed] = await Promise.all([
    csvQueue.getWaitingCount(),
    csvQueue.getActiveCount(),
    csvQueue.getCompletedCount(),
    csvQueue.getFailedCount(),
  ]);

  return { waiting, active, completed, failed };
}
