import { Worker, Job } from "bullmq";
import { redisConnection } from "../../config/redis.js";
import { prisma } from "../../config/database.js";
import { createLogger } from "../../utils/logger.js";
import { QUEUE_NAMES } from "../../utils/constants.js";
import * as csvService from "../../services/csv.service.js";
import type { CSVJob } from "../../queues/csv.queue.js";

const logger = createLogger("csv-worker");

/**
 * Process CSV jobs
 */
async function processCSVJob(job: Job<CSVJob>) {
  const { data } = job;
  
  logger.info({ jobId: job.id, type: data.type }, "Processing CSV job");

  try {
    switch (data.type) {
      case "parse-results":
        return await processResultsCSV(job);
      case "parse-students":
        return await processStudentsCSV(job);
      default:
        throw new Error(`Unknown job type: ${(data as { type: string }).type}`);
    }
  } catch (error) {
    logger.error({ error, jobId: job.id }, "CSV job failed");
    throw error;
  }
}

/**
 * Process results CSV
 */
async function processResultsCSV(job: Job) {
  const { semester, academicYear, programId, uploadedBy } = job.data;

  // In production, fetch file from URL/storage
  // const csvContent = await fetchFromStorage(fileUrl);
  const csvContent = ""; // Placeholder

  // Parse CSV
  const parsedResults = csvService.parseResultsCSV(csvContent);

  // Process results - simplified for now
  const successCount = parsedResults.length;
  const errorCount = 0;

  // Create job record
  await prisma.job.create({
    data: {
      type: "CSV_PARSE_RESULTS",
      status: "COMPLETED",
      output: {
        successCount,
        errorCount,
        semester,
        academicYear,
        programId,
      },
      completedAt: new Date(),
      createdBy: uploadedBy,
    },
  });

  logger.info({ 
    semester, 
    successCount,
    errorCount,
  }, "Results CSV processed");

  return { successCount, errorCount };
}

/**
 * Process students CSV
 */
async function processStudentsCSV(job: Job) {
  const { programId, batchYear, uploadedBy } = job.data;

  // In production, fetch file from URL/storage
  const csvContent = ""; // Placeholder

  // Parse CSV
  const parsedStudents = csvService.parseStudentsCSV(csvContent);

  // Process students - simplified for now
  const successCount = parsedStudents.length;
  const errorCount = 0;

  // Create job record
  await prisma.job.create({
    data: {
      type: "CSV_PARSE_STUDENTS",
      status: "COMPLETED",
      output: {
        successCount,
        errorCount,
        programId,
        batchYear,
      },
      completedAt: new Date(),
      createdBy: uploadedBy,
    },
  });

  logger.info({ 
    programId,
    batchYear,
    successCount,
    errorCount,
  }, "Students CSV processed");

  return { successCount, errorCount };
}

/**
 * Create and start the CSV worker
 */
export function createCSVWorker() {
  const worker = new Worker(QUEUE_NAMES.CSV, processCSVJob, {
    connection: redisConnection,
    concurrency: 2,
  });

  worker.on("completed", (job) => {
    logger.info({ jobId: job.id }, "CSV job completed");
  });

  worker.on("failed", (job, error) => {
    logger.error({ jobId: job?.id, error: error.message }, "CSV job failed");
  });

  logger.info("CSV worker started");
  return worker;
}
