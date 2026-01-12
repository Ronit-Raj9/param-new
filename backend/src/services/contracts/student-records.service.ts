/**
 * StudentRecords Contract Service
 * 
 * Provides type-safe interaction with the StudentRecords.sol smart contract.
 * Handles student registration, department/program management, and semester reports.
 */

import { ethers } from "ethers";
import { getProvider, getContract, contractAddresses } from "../../config/blockchain.js";
import { env } from "../../config/env.js";
import { createLogger } from "../../utils/logger.js";
import * as privyWalletService from "../privy-wallet.service.js";
import {
  ContractStudent,
  ContractDepartment,
  ContractDegreeProgram,
  ContractSemesterReport,
  ContractCourseGrade,
  ContractStudentStatus,
  ContractSemesterType,
  RegisterStudentInput,
  CreateSemesterReportInput,
  RegisterStudentResult,
  SemesterReportResult,
  backendToContractStatus,
  backendToContractSemesterType,
} from "./types.js";
import {
  gpaToContract,
  gpaFromContract,
  gradePointsToContract,
  studentIdToContract,
  studentIdFromContract,
  departmentIdToContract,
  programIdToContract,
  yearToContract,
  semesterToContract,
  creditsToContract,
  toChecksumAddress,
  parseContractError,
} from "./utils.js";

const logger = createLogger("student-records-contract");

// ===========================================
// SIGNER MANAGEMENT
// ===========================================

async function getSigner(): Promise<ethers.Wallet> {
  const signer = await privyWalletService.getSigner();
  if (!signer) {
    throw new Error("No wallet configured - set PRIVY_ADMIN_WALLET_ID in .env");
  }
  return signer;
}

function getStudentRecordsContract(
  signerOrProvider?: ethers.Wallet | ethers.JsonRpcProvider
): any {
  const contract = getContract("studentRecords", signerOrProvider);
  if (!contract) {
    throw new Error("StudentRecords contract not configured");
  }
  return contract as any;
}

// ===========================================
// READ FUNCTIONS
// ===========================================

/**
 * Get department by ID
 */
export async function getDepartment(departmentId: number): Promise<ContractDepartment | null> {
  try {
    const contract = getStudentRecordsContract();
    const dept = await contract.getDepartment(departmentId);

    if (dept.id === 0) {
      return null;
    }

    return {
      id: Number(dept.id),
      name: dept.name,
      code: dept.code,
      account: dept.account,
      active: dept.active,
    };
  } catch (error) {
    logger.error({ error, departmentId }, "Failed to get department");
    throw error;
  }
}

/**
 * Get all departments
 */
export async function getAllDepartments(): Promise<ContractDepartment[]> {
  try {
    const contract = getStudentRecordsContract();
    const count = await contract.getDepartmentCount();

    const departments: ContractDepartment[] = [];
    for (let i = 1; i <= Number(count); i++) {
      const dept = await getDepartment(i);
      if (dept && dept.active) {
        departments.push(dept);
      }
    }

    return departments;
  } catch (error) {
    logger.error({ error }, "Failed to get all departments");
    throw error;
  }
}

/**
 * Get program by ID
 */
export async function getProgram(programId: number): Promise<ContractDegreeProgram | null> {
  try {
    const contract = getStudentRecordsContract();
    const prog = await contract.getProgram(programId);

    if (prog.id === 0) {
      return null;
    }

    return {
      id: Number(prog.id),
      title: prog.title,
      code: prog.code,
      durationYears: Number(prog.durationYears),
      departmentId: Number(prog.departmentId),
      active: prog.active,
    };
  } catch (error) {
    logger.error({ error, programId }, "Failed to get program");
    throw error;
  }
}

/**
 * Get all programs
 */
export async function getAllPrograms(): Promise<ContractDegreeProgram[]> {
  try {
    const contract = getStudentRecordsContract();
    const count = await contract.getProgramCount();

    const programs: ContractDegreeProgram[] = [];
    for (let i = 1; i <= Number(count); i++) {
      const prog = await getProgram(i);
      if (prog && prog.active) {
        programs.push(prog);
      }
    }

    return programs;
  } catch (error) {
    logger.error({ error }, "Failed to get all programs");
    throw error;
  }
}

/**
 * Get student by on-chain ID
 */
export async function getStudent(studentId: bigint): Promise<ContractStudent | null> {
  try {
    const contract = getStudentRecordsContract();
    const student = await contract.getStudent(studentId);

    if (!student.isRegistered) {
      return null;
    }

    return {
      studentId: BigInt(student.studentId),
      name: student.name,
      rollNumber: student.rollNumber,
      walletAddress: student.walletAddress,
      departmentId: Number(student.departmentId),
      programId: Number(student.programId),
      admissionYear: Number(student.admissionYear),
      expectedGraduationYear: Number(student.expectedGraduationYear),
      status: Number(student.status) as ContractStudentStatus,
      activeBacklogCount: Number(student.activeBacklogCount),
      isRegistered: student.isRegistered,
    };
  } catch (error) {
    logger.error({ error, studentId: studentId.toString() }, "Failed to get student");
    throw error;
  }
}

/**
 * Get student by wallet address
 */
export async function getStudentByWallet(walletAddress: string): Promise<ContractStudent | null> {
  try {
    const contract = getStudentRecordsContract();
    const studentId = await contract.getStudentIdByWallet(toChecksumAddress(walletAddress));

    if (studentId === BigInt(0)) {
      return null;
    }

    return getStudent(studentId);
  } catch (error) {
    logger.error({ error, walletAddress }, "Failed to get student by wallet");
    throw error;
  }
}

/**
 * Get student by roll number
 */
export async function getStudentByRollNumber(rollNumber: string): Promise<ContractStudent | null> {
  try {
    const contract = getStudentRecordsContract();
    const studentId = await contract.getStudentIdByRoll(rollNumber);

    if (studentId === BigInt(0)) {
      return null;
    }

    return getStudent(studentId);
  } catch (error) {
    logger.error({ error, rollNumber }, "Failed to get student by roll number");
    throw error;
  }
}

/**
 * Get semester report for a student
 * Contract returns tuple: (SemesterReport report, CourseGrade[] courses)
 */
export async function getSemesterReport(
  studentId: bigint,
  semester: number
): Promise<ContractSemesterReport | null> {
  try {
    const contract = getStudentRecordsContract();
    // Contract returns tuple: [report, courses]
    const result = await contract.getSemesterReport(studentId, semester);
    const report = result[0] || result.report;

    // Check if report exists using the exists boolean field
    if (!report.exists) {
      return null;
    }

    return {
      semesterNumber: Number(report.semesterNumber),
      semesterType: Number(report.semesterType) as ContractSemesterType,
      sgpa: gpaFromContract(Number(report.sgpa)),
      cgpa: gpaFromContract(Number(report.cgpa)),
      totalCredits: Number(report.totalCredits),
      isFinalized: report.isFinalized,
      exists: report.exists,
    };
  } catch (error) {
    logger.error({ error, studentId: studentId.toString(), semester }, "Failed to get semester report");
    throw error;
  }
}

/**
 * Get course grades for a semester
 * Note: Uses getSemesterReport which returns both report and courses
 */
export async function getCourseGrades(
  studentId: bigint,
  semester: number
): Promise<ContractCourseGrade[]> {
  try {
    const contract = getStudentRecordsContract();
    // getSemesterReport returns tuple: [report, courses]
    const result = await contract.getSemesterReport(studentId, semester);
    const courses = result[1] || result.courses || [];

    return courses.map((g: any) => ({
      courseId: g.courseId,
      courseName: g.courseName,
      credits: Number(g.credits),
      gradePoints: Number(g.gradePoints),
    }));
  } catch (error) {
    logger.error({ error, studentId: studentId.toString(), semester }, "Failed to get course grades");
    throw error;
  }
}

/**
 * Check if a semester report is finalized
 * Note: Uses getReportSnapshot which provides isFinalized flag
 */
export async function isSemesterFinalized(studentId: bigint, semester: number): Promise<boolean> {
  try {
    const contract = getStudentRecordsContract();
    // getReportSnapshot returns tuple: (exists, isFinalized, sgpa, cgpa)
    const result = await contract.getReportSnapshot(studentId, semester);
    const isFinalized = result[1] || result.isFinalized || false;
    return isFinalized;
  } catch (error) {
    logger.error({ error, studentId: studentId.toString(), semester }, "Failed to check semester finalization");
    throw error;
  }
}

// ===========================================
// WRITE FUNCTIONS (require signer)
// ===========================================

/**
 * Register a new student on-chain
 */
export async function registerStudent(input: RegisterStudentInput): Promise<RegisterStudentResult> {
  try {
    const signer = await getSigner();
    const contract = getStudentRecordsContract(signer);

    logger.info({
      rollNumber: input.rollNumber,
      walletAddress: input.walletAddress
    }, "Registering student on-chain");

    const tx = await contract.registerStudent(
      toChecksumAddress(input.walletAddress),
      input.name,
      input.rollNumber,
      departmentIdToContract(input.departmentId),
      programIdToContract(input.programId),
      yearToContract(input.admissionYear)
    );

    const receipt = await tx.wait();
    if (!receipt) {
      throw new Error("Transaction receipt not received");
    }

    // Parse StudentRegistered event to get student ID
    const event = receipt.logs.find((log: any) => {
      try {
        const parsed = contract.interface.parseLog({
          topics: log.topics as string[],
          data: log.data,
        });
        return parsed?.name === "StudentRegistered";
      } catch {
        return false;
      }
    });

    let onChainStudentId = BigInt(0);
    if (event) {
      const parsed = contract.interface.parseLog({
        topics: event.topics as string[],
        data: event.data,
      });
      onChainStudentId = BigInt(parsed!.args[0]);
    }

    logger.info({
      transactionHash: receipt.hash,
      onChainStudentId: onChainStudentId.toString(),
      rollNumber: input.rollNumber,
    }, "Student registered on-chain");

    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed,
      onChainStudentId,
    };
  } catch (error) {
    logger.error({ error, input }, "Failed to register student on-chain");
    throw new Error(parseContractError(error));
  }
}

/**
 * Update student status on-chain
 */
export async function updateStudentStatus(
  studentId: bigint,
  status: string // Backend status string
): Promise<{ transactionHash: string }> {
  try {
    const signer = await getSigner();
    const contract = getStudentRecordsContract(signer);

    const contractStatus = backendToContractStatus[status];
    if (contractStatus === undefined) {
      throw new Error(`Cannot map backend status "${status}" to contract status`);
    }

    logger.info({
      studentId: studentId.toString(),
      status,
      contractStatus
    }, "Updating student status on-chain");

    const tx = await contract.updateStudentStatus(studentId, contractStatus);
    const receipt = await tx.wait();

    if (!receipt) {
      throw new Error("Transaction receipt not received");
    }

    logger.info({
      transactionHash: receipt.hash,
      studentId: studentId.toString(),
    }, "Student status updated on-chain");

    return { transactionHash: receipt.hash };
  } catch (error) {
    logger.error({ error, studentId: studentId.toString(), status }, "Failed to update student status");
    throw new Error(parseContractError(error));
  }
}

/**
 * Create a semester report on-chain
 */
export async function createSemesterReport(
  input: CreateSemesterReportInput
): Promise<SemesterReportResult> {
  try {
    const signer = await getSigner();
    const contract = getStudentRecordsContract(signer);

    logger.info({
      studentId: input.studentId.toString(),
      semester: input.semester,
      coursesCount: input.courseIds.length,
    }, "Creating semester report on-chain");

    // Validate arrays are same length
    if (input.courseIds.length !== input.courseNames.length ||
      input.courseIds.length !== input.credits.length ||
      input.courseIds.length !== input.gradePoints.length) {
      throw new Error("Course arrays must have equal length (courseIds, courseNames, credits, gradePoints)");
    }

    const tx = await contract.createSemesterReport(
      input.studentId,
      semesterToContract(input.semester),
      input.semesterType,
      input.courseIds,
      input.courseNames,
      input.credits.map(creditsToContract),
      input.gradePoints.map(gradePointsToContract),
      gpaToContract(input.cgpa)
    );

    const receipt = await tx.wait();
    if (!receipt) {
      throw new Error("Transaction receipt not received");
    }

    // Parse event to get calculated SGPA
    let sgpa = 0;
    const event = receipt.logs.find((log: any) => {
      try {
        const parsed = contract.interface.parseLog({
          topics: log.topics as string[],
          data: log.data,
        });
        return parsed?.name === "SemesterReportCreated";
      } catch {
        return false;
      }
    });

    if (event) {
      const parsed = contract.interface.parseLog({
        topics: event.topics as string[],
        data: event.data,
      });
      sgpa = gpaFromContract(Number(parsed!.args.sgpa || parsed!.args[2]));
    }

    logger.info({
      transactionHash: receipt.hash,
      studentId: input.studentId.toString(),
      semester: input.semester,
      sgpa,
    }, "Semester report created on-chain");

    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed,
      sgpa,
    };
  } catch (error) {
    logger.error({ error, input }, "Failed to create semester report on-chain");
    throw new Error(parseContractError(error));
  }
}

/**
 * Finalize a semester report (locks it for NFT minting)
 */
export async function finalizeSemesterReport(
  studentId: bigint,
  semester: number
): Promise<{ transactionHash: string }> {
  try {
    const signer = await getSigner();
    const contract = getStudentRecordsContract(signer);

    logger.info({
      studentId: studentId.toString(),
      semester,
    }, "Finalizing semester report on-chain");

    const tx = await contract.finalizeReport(studentId, semester);
    const receipt = await tx.wait();

    if (!receipt) {
      throw new Error("Transaction receipt not received");
    }

    logger.info({
      transactionHash: receipt.hash,
      studentId: studentId.toString(),
      semester,
    }, "Semester report finalized on-chain");

    return { transactionHash: receipt.hash };
  } catch (error) {
    logger.error({ error, studentId: studentId.toString(), semester }, "Failed to finalize semester report");
    throw new Error(parseContractError(error));
  }
}

/**
 * Update student backlog count
 */
export async function updateBacklogCount(
  studentId: bigint,
  backlogCount: number
): Promise<{ transactionHash: string }> {
  try {
    const signer = await getSigner();
    const contract = getStudentRecordsContract(signer);

    logger.info({
      studentId: studentId.toString(),
      backlogCount,
    }, "Updating student backlog count");

    // ABI expects: updateBacklogs(uint256 _studentId, uint8 _backlogCount, string[] _backlogCourses)
    // We pass empty array for courses as we only track count
    const tx = await contract.updateBacklogs(studentId, backlogCount, []);
    const receipt = await tx.wait();

    if (!receipt) {
      throw new Error("Transaction receipt not received");
    }

    return { transactionHash: receipt.hash };
  } catch (error) {
    logger.error({ error, studentId: studentId.toString(), backlogCount }, "Failed to update backlog count");
    throw new Error(parseContractError(error));
  }
}

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

/**
 * Check if StudentRecords contract is configured and accessible
 */
export function isStudentRecordsConfigured(): boolean {
  return !!contractAddresses.studentRecords;
}

/**
 * Check if an address has ACADEMIC_ROLE on the contract
 */
export async function hasAcademicRole(address: string): Promise<boolean> {
  try {
    const contract = getStudentRecordsContract();
    const ACADEMIC_ROLE = await contract.ACADEMIC_ROLE();
    return await contract.hasRole(ACADEMIC_ROLE, toChecksumAddress(address));
  } catch (error) {
    logger.error({ error, address }, "Failed to check academic role");
    return false;
  }
}

/**
 * Check if an address has DEFAULT_ADMIN_ROLE on the contract
 */
export async function hasAdminRole(address: string): Promise<boolean> {
  try {
    const contract = getStudentRecordsContract();
    const DEFAULT_ADMIN_ROLE = await contract.DEFAULT_ADMIN_ROLE();
    return await contract.hasRole(DEFAULT_ADMIN_ROLE, toChecksumAddress(address));
  } catch (error) {
    logger.error({ error, address }, "Failed to check admin role");
    return false;
  }
}
