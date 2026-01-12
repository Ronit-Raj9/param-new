import { prisma } from "../../config/database.js";
import { ApiError } from "../../middleware/error.handler.js";
import { createLogger } from "../../utils/logger.js";
import { sha256, generateToken } from "../../utils/hash.js";
import { addDays } from "../../utils/date.js";
import type { Credential, ShareLink, CredentialType, Prisma } from "@prisma/client";
import type {
  CreateCredentialInput,
  RevokeCredentialInput,
  CreateShareLinkInput,
  ListCredentialsQuery
} from "./credentials.schema.js";

const logger = createLogger("credentials-service");

/**
 * Create a credential for a student
 */
export async function createCredential(
  input: CreateCredentialInput,
  issuedBy: string
): Promise<Credential> {
  // Verify student exists
  const student = await prisma.student.findUnique({
    where: { id: input.studentId },
    include: {
      user: true,
      program: true,
    },
  });

  if (!student) {
    throw ApiError.notFound("Student not found");
  }

  let metadata: Record<string, unknown> = {
    studentName: student.user.name,
    enrollmentNumber: student.enrollmentNumber,
    program: student.program.name,
    programCode: student.program.code,
    admissionYear: student.admissionYear,
    issuedAt: new Date().toISOString(),
  };

  let documentData: string;
  let semesterResultId: string | undefined;
  let degreeProposalId: string | undefined;

  // Handle different credential types
  if (input.type === "SEMESTER") {
    if (!input.semesterResultId) {
      throw ApiError.badRequest("semesterResultId is required for SEMESTER credentials");
    }

    const semesterResult = await prisma.semesterResult.findUnique({
      where: { id: input.semesterResultId },
      include: {
        courseResults: {
          include: { course: true },
        },
      },
    });

    if (!semesterResult) {
      throw ApiError.notFound("Semester result not found");
    }

    if (semesterResult.studentId !== input.studentId) {
      throw ApiError.badRequest("Semester result does not belong to this student");
    }

    // Check if credential already exists for this semester result
    const existingCredential = await prisma.credential.findUnique({
      where: { semesterResultId: input.semesterResultId },
    });

    if (existingCredential) {
      throw ApiError.conflict("Credential already exists for this semester result");
    }

    metadata = {
      ...metadata,
      semester: semesterResult.semester,
      academicYear: semesterResult.academicYear,
      sgpa: semesterResult.sgpa,
      totalCredits: semesterResult.totalCredits,
      courses: semesterResult.courseResults.map((cr) => ({
        code: cr.course.code,
        name: cr.course.name,
        credits: cr.course.credits,
        grade: cr.grade,
        gradePoints: cr.gradePoints,
      })),
    };

    semesterResultId = input.semesterResultId;
    documentData = JSON.stringify({ type: "SEMESTER", metadata });

  } else if (input.type === "DEGREE") {
    if (!input.degreeProposalId) {
      throw ApiError.badRequest("degreeProposalId is required for DEGREE credentials");
    }

    const degreeProposal = await prisma.degreeProposal.findUnique({
      where: { id: input.degreeProposalId },
      include: {
        student: {
          include: { program: true },
        },
      },
    });

    if (!degreeProposal) {
      throw ApiError.notFound("Degree proposal not found");
    }

    if (degreeProposal.studentId !== input.studentId) {
      throw ApiError.badRequest("Degree proposal does not belong to this student");
    }

    if (degreeProposal.status !== "APPROVED") {
      throw ApiError.badRequest("Degree proposal must be approved before creating credential");
    }

    // Check if credential already exists for this degree proposal
    const existingCredential = await prisma.credential.findUnique({
      where: { degreeProposalId: input.degreeProposalId },
    });

    if (existingCredential) {
      throw ApiError.conflict("Credential already exists for this degree proposal");
    }

    metadata = {
      ...metadata,
      degreeType: degreeProposal.student.program.degreeType,
      programName: degreeProposal.student.program.name,
      cgpa: degreeProposal.cgpa,
      totalCredits: degreeProposal.totalCredits,
      expectedYear: degreeProposal.expectedYear,
    };

    degreeProposalId = input.degreeProposalId;
    documentData = JSON.stringify({ type: "DEGREE", metadata });

  } else {
    // CERTIFICATE type - general purpose
    documentData = JSON.stringify({ type: "CERTIFICATE", metadata });
  }

  // Generate document hash
  const documentHash = sha256(documentData);

  const credential = await prisma.credential.create({
    data: {
      studentId: input.studentId,
      type: input.type,
      status: "PENDING",
      documentHash,
      metadata: metadata as Prisma.JsonObject,
      semesterResultId,
      degreeProposalId,
    },
  });

  logger.info({ credentialId: credential.id, type: input.type }, "Credential created");
  return credential;
}

/**
 * Get credential by ID
 */
export async function getCredentialById(id: string) {
  const credential = await prisma.credential.findUnique({
    where: { id },
    include: {
      student: {
        include: {
          user: { select: { name: true, email: true } },
          program: true,
        },
      },
      semesterResult: {
        include: {
          courseResults: {
            include: { course: true },
          },
        },
      },
      degreeProposal: true,
      shareLinks: {
        where: { isActive: true },
      },
    },
  });

  if (!credential) {
    throw ApiError.notFound("Credential not found");
  }

  return credential;
}

/**
 * Get student's credentials
 */
export async function getStudentCredentials(studentId: string) {
  return prisma.credential.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
  });
}

import { queueFinalizeDegree } from "../../queues/blockchain.queue.js";

// ... (existing imports)

/**
 * Issue a credential (marks as ISSUED and queues for blockchain minting)
 */
export async function issueCredential(
  id: string,
  issuedBy: string
): Promise<Credential> {
  const credential = await prisma.credential.findUnique({
    where: { id },
    include: { student: { include: { user: true } } },
  });

  if (!credential) {
    throw ApiError.notFound("Credential not found");
  }

  if (credential.status !== "PENDING") {
    throw ApiError.badRequest("Only pending credentials can be issued");
  }

  const updated = await prisma.credential.update({
    where: { id },
    data: {
      status: "ISSUED",
      issuedAt: new Date(),
    },
  });

  logger.info({ credentialId: id }, "Credential issued");

  // BLOCKCHAIN HOOK: Finalize degree on chain (Mint NFT)
  if (credential.type === "DEGREE" && credential.degreeProposalId) {
    queueFinalizeDegree(credential.degreeProposalId).catch((err) =>
      logger.error({ err, credentialId: id }, "Failed to queue degree finalization")
    );
  }

  return updated;
}

/**
 * Update credential with blockchain data after minting
 */
export async function updateCredentialBlockchainData(
  id: string,
  data: {
    tokenId: string;
    contractAddress: string;
    txHash: string;
    blockNumber: number;
    chainId: number;
    pdfUrl?: string;
  }
): Promise<Credential> {
  const credential = await prisma.credential.findUnique({ where: { id } });

  if (!credential) {
    throw ApiError.notFound("Credential not found");
  }

  const updated = await prisma.credential.update({
    where: { id },
    data: {
      tokenId: data.tokenId,
      contractAddress: data.contractAddress,
      txHash: data.txHash,
      blockNumber: data.blockNumber,
      chainId: data.chainId,
      pdfUrl: data.pdfUrl,
    },
  });

  logger.info({ credentialId: id, tokenId: data.tokenId, txHash: data.txHash }, "Credential blockchain data updated");
  return updated;
}

/**
 * Revoke a credential
 */
export async function revokeCredential(
  id: string,
  input: RevokeCredentialInput,
  revokedBy: string
): Promise<Credential> {
  const credential = await prisma.credential.findUnique({ where: { id } });

  if (!credential) {
    throw ApiError.notFound("Credential not found");
  }

  if (credential.status === "REVOKED") {
    throw ApiError.badRequest("Credential already revoked");
  }

  const updated = await prisma.credential.update({
    where: { id },
    data: {
      status: "REVOKED",
      revokedBy,
      revokedAt: new Date(),
      revokeReason: input.reason,
    },
  });

  // Also deactivate all share links
  await prisma.shareLink.updateMany({
    where: { credentialId: id },
    data: {
      isActive: false,
      revokedAt: new Date(),
    },
  });

  logger.info({ credentialId: id, reason: input.reason }, "Credential revoked");
  return updated;
}

/**
 * List credentials with filters
 */
export async function listCredentials(query: ListCredentialsQuery) {
  const { studentId, type, status, page, limit } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.CredentialWhereInput = {};

  if (studentId) where.studentId = studentId;
  if (type) where.type = type;
  if (status) where.status = status;

  const [credentials, total] = await Promise.all([
    prisma.credential.findMany({
      where,
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true } },
            program: { select: { name: true, code: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.credential.count({ where }),
  ]);

  return {
    data: credentials,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// ============ SHARE LINKS ============

/**
 * Create a shareable link for a credential
 */
export async function createShareLink(
  input: CreateShareLinkInput,
  studentId: string
): Promise<ShareLink> {
  const credential = await prisma.credential.findUnique({
    where: { id: input.credentialId },
  });

  if (!credential) {
    throw ApiError.notFound("Credential not found");
  }

  if (credential.status !== "ISSUED") {
    throw ApiError.badRequest("Only issued credentials can be shared");
  }

  // Verify student owns this credential
  if (credential.studentId !== studentId) {
    throw ApiError.forbidden("You can only create share links for your own credentials");
  }

  const token = generateToken(32);
  const expiresAt = input.expiresInDays ? addDays(new Date(), input.expiresInDays) : null;

  const shareLink = await prisma.shareLink.create({
    data: {
      studentId,
      credentialId: input.credentialId,
      token,
      expiresAt,
      isActive: true,
    },
  });

  logger.info({ shareLinkId: shareLink.id, credentialId: input.credentialId }, "Share link created");
  return shareLink;
}

/**
 * Get share link by token (for public verification)
 */
export async function getShareLinkByToken(token: string) {
  const shareLink = await prisma.shareLink.findUnique({
    where: { token },
    include: {
      credential: {
        include: {
          student: {
            include: {
              user: { select: { name: true } },
              program: true,
            },
          },
        },
      },
    },
  });

  if (!shareLink) {
    throw ApiError.notFound("Share link not found");
  }

  if (!shareLink.isActive) {
    throw ApiError.badRequest("Share link has been revoked");
  }

  if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
    throw ApiError.badRequest("Share link has expired");
  }

  // Increment view count
  await prisma.shareLink.update({
    where: { id: shareLink.id },
    data: {
      viewCount: { increment: 1 },
      lastViewedAt: new Date(),
    },
  });

  return shareLink;
}

/**
 * Get share links for a credential
 */
export async function getCredentialShareLinks(credentialId: string) {
  return prisma.shareLink.findMany({
    where: { credentialId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Revoke a share link
 */
export async function revokeShareLink(id: string, studentId: string): Promise<void> {
  const shareLink = await prisma.shareLink.findUnique({ where: { id } });

  if (!shareLink) {
    throw ApiError.notFound("Share link not found");
  }

  if (shareLink.studentId !== studentId) {
    throw ApiError.forbidden("You can only revoke your own share links");
  }

  await prisma.shareLink.update({
    where: { id },
    data: {
      isActive: false,
      revokedAt: new Date(),
    },
  });

  logger.info({ shareLinkId: id }, "Share link revoked");
}

/**
 * Get student's share links
 */
export async function getStudentShareLinks(studentId: string) {
  return prisma.shareLink.findMany({
    where: { studentId },
    include: {
      credential: {
        select: {
          id: true,
          type: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
