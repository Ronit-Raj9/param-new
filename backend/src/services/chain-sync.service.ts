/**
 * Chain Sync Service
 * 
 * Orchestrates synchronization between backend database and blockchain contracts.
 * Provides high-level operations that combine backend CRUD with on-chain transactions.
 */

import { prisma } from "../config/database.js";
import { createLogger } from "../utils/logger.js";
import * as studentRecordsContract from "./contracts/student-records.service.js";
import * as semesterNftContract from "./contracts/semester-nft.service.js";
import * as degreeNftContract from "./contracts/degree-nft.service.js";
import * as certificateNftContract from "./contracts/certificate-nft.service.js";
import {
  ContractStudentStatus,
  ContractSemesterType,
  backendToContractStatus,
  backendToContractSemesterType,
} from "./contracts/types.js";
import {
  gpaToContract,
  gradePointsToContract,
  studentIdToContract,
} from "./contracts/utils.js";

const logger = createLogger("chain-sync-service");

// ===========================================
// STUDENT SYNC
// ===========================================

/**
 * Register a student on-chain and update backend with on-chain ID
 */
export async function syncStudentToChain(studentId: string): Promise<{
  onChainId: number;
  transactionHash: string;
}> {
  // Get student from database
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: true,
      program: true,
      department: true,
    },
  });

  if (!student) {
    throw new Error(`Student ${studentId} not found`);
  }

  if (student.onChainId) {
    throw new Error(`Student ${studentId} already registered on-chain with ID ${student.onChainId}`);
  }

  if (!student.walletAddress) {
    throw new Error(`Student ${studentId} has no wallet address`);
  }

  if (!student.program.onChainId) {
    throw new Error(`Student's program ${student.program.id} not synced to chain`);
  }

  if (!student.department?.onChainId) {
    throw new Error(`Student's department not synced to chain`);
  }

  logger.info({
    studentId,
    enrollmentNumber: student.enrollmentNumber,
    walletAddress: student.walletAddress,
  }, "Syncing student to chain");

  // Register on-chain
  const result = await studentRecordsContract.registerStudent({
    walletAddress: student.walletAddress,
    name: student.name,
    rollNumber: student.enrollmentNumber,
    departmentId: student.department.onChainId,
    programId: student.program.onChainId,
    admissionYear: student.admissionYear,
  });

  // Update backend with on-chain ID
  const onChainIdNumber = Number(result.onChainStudentId);
  await prisma.student.update({
    where: { id: studentId },
    data: {
      onChainId: onChainIdNumber,
      // If student was pending activation, activate them
      status: student.status === "PENDING_ACTIVATION" ? "ACTIVE" : student.status,
    },
  });

  logger.info({
    studentId,
    onChainId: onChainIdNumber,
    transactionHash: result.transactionHash,
  }, "Student synced to chain");

  return {
    onChainId: onChainIdNumber,
    transactionHash: result.transactionHash,
  };
}

/**
 * Update student status on-chain
 */
export async function syncStudentStatusToChain(studentId: string): Promise<{
  transactionHash: string;
}> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
  });

  if (!student) {
    throw new Error(`Student ${studentId} not found`);
  }

  if (!student.onChainId) {
    throw new Error(`Student ${studentId} not registered on-chain`);
  }

  // Don't sync PENDING_ACTIVATION status (it's backend-only)
  if (student.status === "PENDING_ACTIVATION") {
    throw new Error("Cannot sync PENDING_ACTIVATION status to chain");
  }

  logger.info({
    studentId,
    status: student.status,
    onChainId: student.onChainId,
  }, "Syncing student status to chain");

  const result = await studentRecordsContract.updateStudentStatus(
    BigInt(student.onChainId),
    student.status
  );

  logger.info({
    studentId,
    transactionHash: result.transactionHash,
  }, "Student status synced to chain");

  return result;
}

// ===========================================
// SEMESTER RESULT SYNC
// ===========================================

/**
 * Create semester report on-chain and mint NFT
 */
export async function syncSemesterResultToChain(semesterResultId: string): Promise<{
  reportTxHash: string;
  finalizeTxHash: string;
  mintTxHash: string;
  tokenId: bigint;
}> {
  // Get semester result with all related data
  const semesterResult = await prisma.semesterResult.findUnique({
    where: { id: semesterResultId },
    include: {
      student: {
        include: { program: true },
      },
      courseResults: {
        include: { course: true },
      },
    },
  });

  if (!semesterResult) {
    throw new Error(`Semester result ${semesterResultId} not found`);
  }

  if (semesterResult.status !== "APPROVED" && semesterResult.status !== "ISSUED") {
    throw new Error(`Semester result must be APPROVED or ISSUED to sync to chain`);
  }

  if (!semesterResult.student.onChainId) {
    throw new Error(`Student ${semesterResult.student.id} not registered on-chain`);
  }

  if (!semesterResult.student.walletAddress) {
    throw new Error(`Student has no wallet address`);
  }

  const studentOnChainId = BigInt(semesterResult.student.onChainId);

  // Check if already on-chain
  const existingReport = await studentRecordsContract.getSemesterReport(
    studentOnChainId,
    semesterResult.semester
  );

  if (existingReport && existingReport.isFinalized) {
    throw new Error(`Semester ${semesterResult.semester} already finalized on-chain`);
  }

  logger.info({
    semesterResultId,
    studentId: semesterResult.student.id,
    semester: semesterResult.semester,
  }, "Syncing semester result to chain");

  // Step 1: Create semester report on-chain (if not exists)
  let reportTxHash = "";
  if (!existingReport) {
    const reportResult = await studentRecordsContract.createSemesterReport({
      studentId: studentOnChainId,
      semester: semesterResult.semester,
      semesterType: backendToContractSemesterType[semesterResult.semesterType] || ContractSemesterType.Even,
      courseIds: semesterResult.courseResults.map((cr) => cr.course.code),
      courseNames: semesterResult.courseResults.map((cr) => cr.course.name),
      credits: semesterResult.courseResults.map((cr) => cr.course.credits),
      gradePoints: semesterResult.courseResults.map((cr) => Math.round(cr.gradePoints)),
      cgpa: semesterResult.cgpa || 0,
    });
    reportTxHash = reportResult.transactionHash;
  }

  // Step 2: Finalize the report
  const finalizeResult = await studentRecordsContract.finalizeSemesterReport(
    studentOnChainId,
    semesterResult.semester
  );

  // Step 3: Mint the NFT
  const mintResult = await semesterNftContract.mintReport({
    studentId: studentOnChainId,
    semester: semesterResult.semester,
    rollNumber: semesterResult.student.enrollmentNumber,
    sgpa: semesterResult.sgpa || 0,
    cgpa: semesterResult.cgpa || 0,
    recipient: semesterResult.student.walletAddress,
  });

  // Step 4: Create/update credential in database
  await prisma.credential.upsert({
    where: { semesterResultId: semesterResultId },
    create: {
      studentId: semesterResult.studentId,
      type: "SEMESTER",
      status: "ISSUED",
      semesterResultId: semesterResultId,
      documentHash: semesterResult.documentHash || "",
      tokenId: mintResult.tokenId.toString(),
      contractAddress: semesterNftContract.getContractAddress(),
      txHash: mintResult.transactionHash,
      blockNumber: mintResult.blockNumber,
      chainId: 84532, // Base Sepolia
      issuedAt: new Date(),
    },
    update: {
      status: "ISSUED",
      tokenId: mintResult.tokenId.toString(),
      contractAddress: semesterNftContract.getContractAddress(),
      txHash: mintResult.transactionHash,
      blockNumber: mintResult.blockNumber,
      issuedAt: new Date(),
    },
  });

  // Update semester result status
  await prisma.semesterResult.update({
    where: { id: semesterResultId },
    data: { status: "ISSUED" },
  });

  logger.info({
    semesterResultId,
    tokenId: mintResult.tokenId.toString(),
    transactionHash: mintResult.transactionHash,
  }, "Semester result synced to chain and NFT minted");

  return {
    reportTxHash,
    finalizeTxHash: finalizeResult.transactionHash,
    mintTxHash: mintResult.transactionHash,
    tokenId: mintResult.tokenId,
  };
}

// ===========================================
// DEGREE SYNC
// ===========================================

/**
 * Sync degree proposal to chain (propose step)
 */
export async function proposeDegreeOnChain(degreeProposalId: string): Promise<{
  transactionHash: string;
}> {
  const proposal = await prisma.degreeProposal.findUnique({
    where: { id: degreeProposalId },
    include: {
      student: {
        include: { program: true },
      },
    },
  });

  if (!proposal) {
    throw new Error(`Degree proposal ${degreeProposalId} not found`);
  }

  if (proposal.status !== "PENDING_ADMIN") {
    throw new Error(`Degree proposal must be PENDING_ADMIN to propose on-chain`);
  }

  if (!proposal.student.onChainId) {
    throw new Error(`Student not registered on-chain`);
  }

  const studentOnChainId = BigInt(proposal.student.onChainId);

  // Check if already proposed
  const existingProposal = await degreeNftContract.getDegreeProposal(studentOnChainId);
  if (existingProposal) {
    throw new Error(`Degree already proposed on-chain`);
  }

  logger.info({
    degreeProposalId,
    studentId: proposal.student.id,
  }, "Proposing degree on chain");

  const result = await degreeNftContract.proposeDegree({
    studentId: studentOnChainId,
    programTitle: proposal.student.program.name,
    rollNumber: proposal.student.enrollmentNumber,
    cgpa: proposal.cgpa,
    graduationYear: proposal.expectedYear,
  });

  logger.info({
    degreeProposalId,
    transactionHash: result.transactionHash,
  }, "Degree proposed on chain");

  return result;
}

/**
 * Approve degree on chain (admin approval step)
 */
export async function approveDegreeOnChain(degreeProposalId: string): Promise<{
  transactionHash: string;
}> {
  const proposal = await prisma.degreeProposal.findUnique({
    where: { id: degreeProposalId },
    include: { student: true },
  });

  if (!proposal) {
    throw new Error(`Degree proposal ${degreeProposalId} not found`);
  }

  if (proposal.status !== "APPROVED") {
    throw new Error(`Degree proposal must be APPROVED to approve on-chain`);
  }

  if (!proposal.student.onChainId) {
    throw new Error(`Student not registered on-chain`);
  }

  const studentOnChainId = BigInt(proposal.student.onChainId);

  logger.info({
    degreeProposalId,
    studentId: proposal.student.id,
  }, "Approving degree on chain");

  const result = await degreeNftContract.approveDegree(studentOnChainId);

  logger.info({
    degreeProposalId,
    transactionHash: result.transactionHash,
  }, "Degree approved on chain");

  return result;
}

/**
 * Finalize degree and mint NFT
 */
export async function finalizeDegreeOnChain(degreeProposalId: string): Promise<{
  transactionHash: string;
  tokenId: bigint;
}> {
  const proposal = await prisma.degreeProposal.findUnique({
    where: { id: degreeProposalId },
    include: { student: true },
  });

  if (!proposal) {
    throw new Error(`Degree proposal ${degreeProposalId} not found`);
  }

  if (!proposal.student.onChainId) {
    throw new Error(`Student not registered on-chain`);
  }

  if (!proposal.student.walletAddress) {
    throw new Error(`Student has no wallet address`);
  }

  const studentOnChainId = BigInt(proposal.student.onChainId);

  logger.info({
    degreeProposalId,
    studentId: proposal.student.id,
  }, "Finalizing degree and minting NFT");

  const result = await degreeNftContract.finalizeDegree(studentOnChainId, proposal.student.walletAddress);

  // Create credential in database
  await prisma.credential.create({
    data: {
      studentId: proposal.studentId,
      type: "DEGREE",
      status: "ISSUED",
      degreeProposalId: degreeProposalId,
      documentHash: "",
      tokenId: result.tokenId.toString(),
      contractAddress: degreeNftContract.getContractAddress(),
      txHash: result.transactionHash,
      blockNumber: result.blockNumber,
      chainId: 84532,
      issuedAt: new Date(),
    },
  });

  // Update proposal status
  await prisma.degreeProposal.update({
    where: { id: degreeProposalId },
    data: { status: "ISSUED" },
  });

  // Update student status
  await prisma.student.update({
    where: { id: proposal.studentId },
    data: { status: "GRADUATED" },
  });

  logger.info({
    degreeProposalId,
    tokenId: result.tokenId.toString(),
    transactionHash: result.transactionHash,
  }, "Degree NFT minted");

  return {
    transactionHash: result.transactionHash,
    tokenId: result.tokenId,
  };
}

// ===========================================
// CERTIFICATE SYNC (Dropout/Early Exit)
// ===========================================

/**
 * Issue certificate for dropout or early exit student
 */
export async function issueCertificateOnChain(
  studentId: string,
  yearsCompleted: number,
  exitReason: string
): Promise<{
  transactionHash: string;
  tokenId: bigint;
  certificateName: string;
}> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { program: true },
  });

  if (!student) {
    throw new Error(`Student ${studentId} not found`);
  }

  if (!student.onChainId) {
    throw new Error(`Student not registered on-chain`);
  }

  if (!student.walletAddress) {
    throw new Error(`Student has no wallet address`);
  }

  if (student.status !== "DROPPED_OUT" && student.status !== "EARLY_EXIT") {
    throw new Error(`Student must be DROPPED_OUT or EARLY_EXIT to issue certificate`);
  }

  const studentOnChainId = BigInt(student.onChainId);

  // Check if already has certificate
  const hasCert = await certificateNftContract.hasCertificate(studentOnChainId);
  if (hasCert) {
    throw new Error(`Student already has a certificate`);
  }

  // Calculate CGPA from all issued semester results
  const results = await prisma.semesterResult.findMany({
    where: {
      studentId: studentId,
      status: "ISSUED",
    },
  });

  const cgpa = results.length > 0
    ? results.reduce((sum, r) => sum + (r.cgpa || 0), 0) / results.length
    : 0;

  logger.info({
    studentId,
    yearsCompleted,
    exitReason,
    cgpa,
  }, "Issuing certificate on chain");

  const { type, name } = certificateNftContract.determineCertificateType(yearsCompleted);

  const result = await certificateNftContract.issueCertificate({
    studentId: studentOnChainId,
    rollNumber: student.enrollmentNumber,
    programTitle: student.program.name,
    yearsCompleted,
    cgpa,
    exitYear: new Date().getFullYear(),
    exitReason,
    recipientAddress: student.walletAddress,
  });

  // Create credential in database
  await prisma.credential.create({
    data: {
      studentId: studentId,
      type: "CERTIFICATE",
      status: "ISSUED",
      documentHash: "",
      tokenId: result.tokenId.toString(),
      contractAddress: certificateNftContract.getContractAddress(),
      txHash: result.transactionHash,
      blockNumber: result.blockNumber,
      chainId: 84532,
      issuedAt: new Date(),
      metadata: {
        yearsCompleted,
        exitReason,
        certificateType: type,
        certificateName: name,
      },
    },
  });

  logger.info({
    studentId,
    tokenId: result.tokenId.toString(),
    certificateName: name,
    transactionHash: result.transactionHash,
  }, "Certificate NFT issued");

  return {
    transactionHash: result.transactionHash,
    tokenId: result.tokenId,
    certificateName: name,
  };
}

// ===========================================
// REVOCATION SYNC
// ===========================================

/**
 * Revoke a credential on-chain
 */
export async function revokeCredentialOnChain(
  credentialId: string,
  reason: string
): Promise<{ transactionHash: string }> {
  const credential = await prisma.credential.findUnique({
    where: { id: credentialId },
  });

  if (!credential) {
    throw new Error(`Credential ${credentialId} not found`);
  }

  if (!credential.tokenId) {
    throw new Error(`Credential has no token ID`);
  }

  const tokenId = BigInt(credential.tokenId);

  logger.info({
    credentialId,
    tokenId: tokenId.toString(),
    type: credential.type,
    reason,
  }, "Revoking credential on chain");

  let result;
  switch (credential.type) {
    case "SEMESTER":
      result = await semesterNftContract.revokeReport(tokenId, reason);
      break;
    case "DEGREE":
      result = await degreeNftContract.revokeDegree(tokenId, reason);
      break;
    case "CERTIFICATE":
      result = await certificateNftContract.revokeCertificate(tokenId, reason);
      break;
    default:
      throw new Error(`Unknown credential type: ${credential.type}`);
  }

  // Update credential in database
  await prisma.credential.update({
    where: { id: credentialId },
    data: {
      status: "REVOKED",
      revokedAt: new Date(),
      revokeReason: reason,
    },
  });

  logger.info({
    credentialId,
    transactionHash: result.transactionHash,
  }, "Credential revoked on chain");

  return result;
}

// ===========================================
// VERIFICATION
// ===========================================

/**
 * Verify credential on-chain matches database
 */
export async function verifyCredentialOnChain(credentialId: string): Promise<{
  isValid: boolean;
  onChainData: any;
  discrepancies: string[];
}> {
  const credential = await prisma.credential.findUnique({
    where: { id: credentialId },
    include: {
      student: true,
      semesterResult: true,
      degreeProposal: true,
    },
  });

  if (!credential) {
    throw new Error(`Credential ${credentialId} not found`);
  }

  if (!credential.tokenId) {
    return {
      isValid: false,
      onChainData: null,
      discrepancies: ["No token ID - credential not minted"],
    };
  }

  const tokenId = BigInt(credential.tokenId);
  const discrepancies: string[] = [];
  let onChainData: any = null;
  let isRevoked = false;

  try {
    switch (credential.type) {
      case "SEMESTER":
        onChainData = await semesterNftContract.getNFTInfo(tokenId);
        isRevoked = await semesterNftContract.isRevoked(tokenId);
        break;
      case "DEGREE":
        onChainData = await degreeNftContract.getNFTInfo(tokenId);
        isRevoked = await degreeNftContract.isRevoked(tokenId);
        break;
      case "CERTIFICATE":
        onChainData = await certificateNftContract.getNFTInfo(tokenId);
        isRevoked = await certificateNftContract.isRevoked(tokenId);
        break;
    }

    // Check revocation status
    if (isRevoked && credential.status !== "REVOKED") {
      discrepancies.push("On-chain credential is revoked but database shows not revoked");
    }
    if (!isRevoked && credential.status === "REVOKED") {
      discrepancies.push("Database shows revoked but on-chain credential is not revoked");
    }

    // Verify roll number matches
    if (onChainData?.data?.rollNumber !== credential.student.enrollmentNumber) {
      discrepancies.push(`Roll number mismatch: on-chain=${onChainData?.data?.rollNumber}, db=${credential.student.enrollmentNumber}`);
    }

  } catch (error) {
    discrepancies.push(`Failed to fetch on-chain data: ${error}`);
  }

  return {
    isValid: discrepancies.length === 0,
    onChainData,
    discrepancies,
  };
}

// ===========================================
// STATUS CHECK
// ===========================================

/**
 * Get sync status for all contracts
 */
export function getContractSyncStatus(): {
  studentRecords: boolean;
  semesterNft: boolean;
  degreeNft: boolean;
  certificateNft: boolean;
} {
  return {
    studentRecords: studentRecordsContract.isStudentRecordsConfigured(),
    semesterNft: semesterNftContract.isSemesterNFTConfigured(),
    degreeNft: degreeNftContract.isDegreeNFTConfigured(),
    certificateNft: certificateNftContract.isCertificateNFTConfigured(),
  };
}
