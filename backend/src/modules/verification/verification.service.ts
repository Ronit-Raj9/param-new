import { prisma } from "../../config/database.js";
import { ApiError } from "../../middleware/error.handler.js";
import { createLogger } from "../../utils/logger.js";
import { hashData } from "../../utils/hash.js";

const logger = createLogger("verification-service");

/**
 * Verify a credential by share token
 */
export async function verifyByShareToken(token: string) {
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
    throw ApiError.notFound("Invalid verification link");
  }

  if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
    throw ApiError.badRequest("Verification link has expired");
  }

  const credential = shareLink.credential;

  if (credential.status === "REVOKED") {
    return {
      valid: false,
      reason: "Credential has been revoked",
      revokedAt: credential.revokedAt,
      revokeReason: credential.revokeReason,
    };
  }

  // Increment view count
  await prisma.shareLink.update({
    where: { id: shareLink.id },
    data: { viewCount: { increment: 1 } },
  });

  return {
    valid: true,
    credential: {
      id: credential.id,
      type: credential.type,
      status: credential.status,
      issuedAt: credential.issuedAt,
      tokenId: credential.tokenId,
      txHash: credential.txHash,
      pdfUrl: credential.pdfUrl,
      student: {
        name: credential.student.user.name,
        enrollmentNumber: credential.student.enrollmentNumber,
        program: credential.student.program.name,
        batch: credential.student.batch,
      },
      metadata: credential.metadata,
    },
  };
}

/**
 * Verify a credential by hash
 */
export async function verifyByHash(hash: string) {
  const credential = await prisma.credential.findFirst({
    where: { documentHash: hash },
    include: {
      student: {
        include: {
          user: { select: { name: true } },
          program: true,
        },
      },
    },
  });

  if (!credential) {
    return { valid: false, reason: "No credential found with this hash" };
  }

  if (credential.status === "REVOKED") {
    return {
      valid: false,
      reason: "Credential has been revoked",
      revokedAt: credential.revokedAt,
      revokeReason: credential.revokeReason,
    };
  }

  return {
    valid: true,
    credential: {
      id: credential.id,
      type: credential.type,
      status: credential.status,
      issuedAt: credential.issuedAt,
      student: {
        name: credential.student.user.name,
        enrollmentNumber: credential.student.enrollmentNumber,
        program: credential.student.program.name,
      },
    },
  };
}

/**
 * Verify a credential by token ID (blockchain)
 */
export async function verifyByTokenId(tokenId: string) {
  const credential = await prisma.credential.findFirst({
    where: { tokenId },
    include: {
      student: {
        include: {
          user: { select: { name: true } },
          program: true,
        },
      },
    },
  });

  if (!credential) {
    return { valid: false, reason: "No credential found with this token ID" };
  }

  if (credential.status === "REVOKED") {
    return {
      valid: false,
      reason: "Credential has been revoked",
      revokedAt: credential.revokedAt,
      revokeReason: credential.revokeReason,
    };
  }

  return {
    valid: true,
    credential: {
      id: credential.id,
      type: credential.type,
      status: credential.status,
      tokenId: credential.tokenId,
      txHash: credential.txHash,
      issuedAt: credential.issuedAt,
      student: {
        name: credential.student.user.name,
        enrollmentNumber: credential.student.enrollmentNumber,
        program: credential.student.program.name,
      },
    },
  };
}

/**
 * Verify credential data integrity
 */
export async function verifyDataIntegrity(credentialId: string, providedHash: string) {
  const credential = await prisma.credential.findUnique({
    where: { id: credentialId },
  });

  if (!credential) {
    return { valid: false, reason: "Credential not found" };
  }

  const isValid = credential.documentHash === providedHash;

  return {
    valid: isValid,
    reason: isValid ? "Data integrity verified" : "Data has been tampered with",
  };
}

/**
 * Get public verification statistics
 */
export async function getVerificationStats() {
  const [totalCredentials, issuedCredentials, verificationCount] = await Promise.all([
    prisma.credential.count({ where: { status: { not: "PENDING" } } }),
    prisma.credential.count({ where: { status: "ISSUED" } }),
    prisma.shareLink.aggregate({ _sum: { viewCount: true } }),
  ]);

  return {
    totalCredentials,
    issuedCredentials,
    totalVerifications: verificationCount._sum.viewCount || 0,
  };
}
