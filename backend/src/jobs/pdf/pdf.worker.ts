import { Worker, Job } from "bullmq";
import { redisConnection } from "../../config/redis.js";
import { prisma } from "../../config/database.js";
import { createLogger } from "../../utils/logger.js";
import { QUEUE_NAMES } from "../../utils/constants.js";
import * as pdfService from "../../services/pdf.service.js";
import type { PDFJob } from "../../queues/pdf.queue.js";

const logger = createLogger("pdf-worker");

/**
 * Process PDF jobs
 */
async function processPDFJob(job: Job<PDFJob>) {
  const { data } = job;
  
  logger.info({ jobId: job.id, type: data.type }, "Processing PDF job");

  try {
    switch (data.type) {
      case "transcript":
        return await processTranscriptJob(job);
      case "certificate":
        return await processCertificateJob(job);
      default:
        throw new Error(`Unknown job type: ${(data as { type: string }).type}`);
    }
  } catch (error) {
    logger.error({ error, jobId: job.id }, "PDF job failed");
    throw error;
  }
}

/**
 * Process transcript generation job
 */
async function processTranscriptJob(job: Job) {
  const { credentialId, studentId, semesterResultIds } = job.data;

  // Get student and results data
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: true,
      program: true,
    },
  });

  if (!student) {
    throw new Error(`Student ${studentId} not found`);
  }

  const semesterResults = await prisma.semesterResult.findMany({
    where: { id: { in: semesterResultIds } },
    include: {
      courseResults: {
        include: { course: true },
        orderBy: { course: { code: "asc" } },
      },
    },
    orderBy: { semester: "asc" },
  });

  // Calculate CGPA
  const allCourseResults = semesterResults.flatMap((sr) => sr.courseResults);
  const totalPoints = allCourseResults.reduce(
    (sum, cr) => sum + (cr.credits * cr.gradePoints), 0
  );
  const totalCredits = allCourseResults.reduce(
    (sum, cr) => sum + cr.credits, 0
  );
  const cgpa = totalCredits > 0 ? totalPoints / totalCredits : 0;

  // Get credential for hash
  const credential = await prisma.credential.findUnique({
    where: { id: credentialId },
  });

  if (!credential) {
    throw new Error(`Credential ${credentialId} not found`);
  }

  // Generate PDF
  const transcriptData: pdfService.TranscriptData = {
    student: {
      name: student.user.name,
      enrollmentNo: student.enrollmentNumber,
      dateOfBirth: student.dateOfBirth || undefined,
      program: student.program.name,
      programCode: student.program.code,
      batchYear: student.admissionYear,
    },
    semesters: semesterResults.map((sr) => ({
      semester: sr.semester,
      academicYear: sr.academicYear,
      sgpa: sr.sgpa || 0,
      courses: sr.courseResults.map((cr) => ({
        code: cr.course.code,
        name: cr.course.name,
        credits: cr.course.credits,
        grade: cr.grade,
        gradePoints: cr.gradePoints,
      })),
    })),
    cgpa,
    totalCredits,
    issuedAt: new Date(),
    credentialHash: credential.documentHash,
  };

  const pdfBuffer = await pdfService.generateTranscriptPDF(transcriptData);

  logger.info({ credentialId, studentId }, "Transcript PDF generated");

  return { success: true, size: pdfBuffer.length };
}

/**
 * Process certificate generation job
 */
async function processCertificateJob(job: Job) {
  const { credentialId, studentId, degreeProposalId } = job.data;

  // Get student and degree data
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: true,
      program: true,
    },
  });

  if (!student) {
    throw new Error(`Student ${studentId} not found`);
  }

  const degreeProposal = await prisma.degreeProposal.findUnique({
    where: { id: degreeProposalId },
  });

  if (!degreeProposal) {
    throw new Error(`Degree proposal ${degreeProposalId} not found`);
  }

  // Get credential for hash
  const credential = await prisma.credential.findUnique({
    where: { id: credentialId },
  });

  if (!credential) {
    throw new Error(`Credential ${credentialId} not found`);
  }

  // Generate PDF
  const certificateData: pdfService.CertificateData = {
    student: {
      name: student.user.name,
      enrollmentNo: student.enrollmentNumber,
      program: student.program.name,
      degreeType: student.program.degreeType,
      specialization: undefined,
    },
    cgpa: degreeProposal.cgpa,
    graduationDate: new Date(degreeProposal.expectedYear, 5, 1), // June of expected year
    issuedAt: new Date(),
    credentialHash: credential.documentHash,
  };

  const pdfBuffer = await pdfService.generateCertificatePDF(certificateData);

  logger.info({ credentialId, studentId }, "Certificate PDF generated");

  return { success: true, size: pdfBuffer.length };
}

/**
 * Create and start the PDF worker
 */
export function createPDFWorker() {
  const worker = new Worker(QUEUE_NAMES.PDF, processPDFJob, {
    connection: redisConnection,
    concurrency: 3,
  });

  worker.on("completed", (job) => {
    logger.info({ jobId: job.id }, "PDF job completed");
  });

  worker.on("failed", (job, error) => {
    logger.error({ jobId: job?.id, error: error.message }, "PDF job failed");
  });

  logger.info("PDF worker started");
  return worker;
}
