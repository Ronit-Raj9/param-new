/**
 * Contract Utility Functions
 * 
 * Helper functions for converting between backend and contract data formats.
 */

import { ethers } from "ethers";

// ===========================================
// GPA CONVERSION (Backend Float <-> Contract uint16)
// ===========================================

/**
 * Convert backend GPA (float) to contract GPA (uint16 scaled by 100)
 * @param gpa Backend GPA (e.g., 8.50)
 * @returns Contract GPA (e.g., 850)
 */
export function gpaToContract(gpa: number): number {
  return Math.round(gpa * 100);
}

/**
 * Convert contract GPA (uint16) to backend GPA (float)
 * @param contractGpa Contract GPA (e.g., 850)
 * @returns Backend GPA (e.g., 8.50)
 */
export function gpaFromContract(contractGpa: number): number {
  return contractGpa / 100;
}

// ===========================================
// GRADE POINTS CONVERSION
// ===========================================

/**
 * Convert backend grade points (float) to contract grade points (uint8)
 * Contract only supports integer grades 0-10
 * @param gradePoints Backend grade points (e.g., 8.5)
 * @returns Contract grade points (e.g., 9) - rounds to nearest integer
 */
export function gradePointsToContract(gradePoints: number): number {
  return Math.round(gradePoints);
}

/**
 * Convert contract grade points (uint8) to backend grade points (float)
 * @param contractGradePoints Contract grade points (e.g., 9)
 * @returns Backend grade points (e.g., 9.0)
 */
export function gradePointsFromContract(contractGradePoints: number): number {
  return contractGradePoints;
}

// ===========================================
// STUDENT ID CONVERSION
// ===========================================

/**
 * Convert backend student onChainId (number) to contract studentId (bigint)
 * @param onChainId Backend onChainId
 * @returns Contract studentId as bigint
 */
export function studentIdToContract(onChainId: number): bigint {
  return BigInt(onChainId);
}

/**
 * Convert contract studentId (bigint) to backend onChainId (number)
 * @param contractStudentId Contract studentId
 * @returns Backend onChainId
 */
export function studentIdFromContract(contractStudentId: bigint): number {
  // Safe conversion for student IDs that fit in JavaScript number
  if (contractStudentId > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error("Student ID exceeds safe integer range");
  }
  return Number(contractStudentId);
}

// ===========================================
// DEPARTMENT/PROGRAM ID CONVERSION
// ===========================================

/**
 * Contract uses uint8 for department/program IDs (1-255)
 * Backend uses cuid() strings but stores onChainId mapping
 */
export function departmentIdToContract(onChainId: number): number {
  if (onChainId < 1 || onChainId > 255) {
    throw new Error(`Department ID ${onChainId} out of range (1-255)`);
  }
  return onChainId;
}

export function programIdToContract(onChainId: number): number {
  if (onChainId < 1 || onChainId > 255) {
    throw new Error(`Program ID ${onChainId} out of range (1-255)`);
  }
  return onChainId;
}

// ===========================================
// YEAR VALIDATION
// ===========================================

/**
 * Validate year is in contract-acceptable range (2000-2100)
 */
export function validateYear(year: number): boolean {
  return year >= 2000 && year <= 2100;
}

/**
 * Convert year to uint16 for contract
 */
export function yearToContract(year: number): number {
  if (!validateYear(year)) {
    throw new Error(`Year ${year} out of range (2000-2100)`);
  }
  return year;
}

// ===========================================
// SEMESTER VALIDATION
// ===========================================

/**
 * Validate semester number is in contract-acceptable range (1-12)
 */
export function validateSemester(semester: number): boolean {
  return semester >= 1 && semester <= 12;
}

/**
 * Convert semester to uint8 for contract
 */
export function semesterToContract(semester: number): number {
  if (!validateSemester(semester)) {
    throw new Error(`Semester ${semester} out of range (1-12)`);
  }
  return semester;
}

// ===========================================
// CREDITS VALIDATION
// ===========================================

/**
 * Validate credits value fits in uint8 (0-255)
 */
export function validateCredits(credits: number): boolean {
  return credits >= 0 && credits <= 255;
}

/**
 * Convert credits to uint8 for contract
 */
export function creditsToContract(credits: number): number {
  if (!validateCredits(credits)) {
    throw new Error(`Credits ${credits} out of range (0-255)`);
  }
  return credits;
}

// ===========================================
// ADDRESS VALIDATION
// ===========================================

/**
 * Validate Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return ethers.isAddress(address);
}

/**
 * Ensure address is checksummed
 */
export function toChecksumAddress(address: string): string {
  return ethers.getAddress(address);
}

/**
 * Check if address is zero address
 */
export function isZeroAddress(address: string): boolean {
  return address === ethers.ZeroAddress;
}

// ===========================================
// TRANSACTION HELPERS
// ===========================================

/**
 * Parse Transfer event from receipt to get token ID
 */
export function parseTokenIdFromReceipt(receipt: ethers.TransactionReceipt): bigint | null {
  const transferTopic = ethers.id("Transfer(address,address,uint256)");

  const transferLog = receipt.logs.find(
    (log) => log.topics[0] === transferTopic
  );

  if (!transferLog || !transferLog.topics[3]) {
    return null;
  }

  return ethers.toBigInt(transferLog.topics[3]);
}

/**
 * Parse event from receipt logs
 */
export function parseEventFromReceipt<T>(
  receipt: ethers.TransactionReceipt,
  contract: ethers.Contract,
  eventName: string
): T | null {
  for (const log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog({
        topics: log.topics as string[],
        data: log.data,
      });
      if (parsed && parsed.name === eventName) {
        return parsed.args as T;
      }
    } catch {
      // Not this event, continue
    }
  }
  return null;
}

// ===========================================
// COURSE GRADE ARRAY HELPERS
// ===========================================

/**
 * Prepare course grades for contract call
 * Contract expects parallel arrays: courseIds[], credits[], gradePoints[]
 */
export function prepareCourseGradesForContract(
  courses: Array<{
    courseId: string;
    courseName: string;
    credits: number;
    gradePoints: number;
  }>
): {
  courseIds: string[];
  credits: number[];
  gradePoints: number[];
} {
  return {
    courseIds: courses.map((c) => c.courseId),
    credits: courses.map((c) => creditsToContract(c.credits)),
    gradePoints: courses.map((c) => gradePointsToContract(c.gradePoints)),
  };
}

// ===========================================
// ERROR HELPERS
// ===========================================

/**
 * Parse contract revert reason from error
 */
export function parseContractError(error: unknown): string {
  if (error instanceof Error) {
    // Check for revert reason
    const message = error.message;

    // Common contract error patterns
    const revertMatch = message.match(/reverted with reason string '(.+?)'/);
    if (revertMatch && revertMatch[1]) {
      return revertMatch[1];
    }

    // Custom error pattern (StudentRecords__ErrorName)
    const customErrorMatch = message.match(/(\w+__\w+)/);
    if (customErrorMatch && customErrorMatch[1]) {
      return customErrorMatch[1];
    }

    return message;
  }

  return "Unknown contract error";
}

/**
 * Check if error is a specific contract error
 */
export function isContractError(error: unknown, errorName: string): boolean {
  const message = parseContractError(error);
  return message.includes(errorName);
}

// ===========================================
// BATCH OPERATION HELPERS
// ===========================================

/**
 * Chunk array for batch operations
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Wait for multiple transactions
 */
export async function waitForTransactions(
  txResponses: ethers.TransactionResponse[]
): Promise<ethers.TransactionReceipt[]> {
  return Promise.all(txResponses.map((tx) => tx.wait().then((r) => r!)));
}
