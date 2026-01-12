/**
 * Contract Type Definitions
 * 
 * TypeScript types matching Solidity structs and enums from the smart contracts.
 * These types ensure type safety when interacting with contract functions.
 */

// ===========================================
// ENUMS (match Solidity enums)
// ===========================================

/**
 * Student status enum (matches StudentRecords.sol)
 * IMPORTANT: Values must match Solidity enum indices
 */
export enum ContractStudentStatus {
  Active = 0,
  LeaveOfAbsence = 1,
  RepeatYear = 2,
  DroppedOut = 3,
  Graduated = 4,
  EarlyExit = 5,
}

/**
 * Semester type enum (matches StudentRecords.sol)
 */
export enum ContractSemesterType {
  Even = 0,  // Jan-May
  Odd = 1,   // July-Dec
  Summer = 2, // May-June (backlogs only)
}

/**
 * Degree approval state (matches DegreeNFT.sol)
 */
export enum ContractApprovalState {
  None = 0,       // Not proposed
  Proposed = 1,   // Academic proposed
  Approved = 2,   // Admin approved
  Finalized = 3,  // NFT minted
}

/**
 * Certificate type (matches CertificateNFT.sol)
 */
export enum ContractCertificateType {
  CertificateOfEngineering = 0,  // 1 year
  DiplomaInEngineering = 1,      // 2 years
  BSc = 2,                       // 3 years
  BTech = 3,                     // 4 years (early exit from integrated)
}

// ===========================================
// STRUCTS (match Solidity structs)
// ===========================================

/**
 * Department struct (matches StudentRecords.sol)
 */
export interface ContractDepartment {
  id: number;        // uint8
  name: string;
  code: string;
  account: string;   // address
  active: boolean;
}

/**
 * Degree program struct (matches StudentRecords.sol)
 */
export interface ContractDegreeProgram {
  id: number;          // uint8
  title: string;
  code: string;
  durationYears: number;  // uint8
  departmentId: number;   // uint8
  active: boolean;
}

/**
 * Student struct (matches StudentRecords.sol)
 */
export interface ContractStudent {
  studentId: bigint;        // uint256
  name: string;
  rollNumber: string;
  walletAddress: string;    // address
  departmentId: number;     // uint8
  programId: number;        // uint8
  admissionYear: number;    // uint16
  expectedGraduationYear: number;  // uint16
  status: ContractStudentStatus;
  activeBacklogCount: number;  // uint8
  isRegistered: boolean;
}

/**
 * Course grade struct (matches StudentRecords.sol)
 */
export interface ContractCourseGrade {
  courseId: string;
  courseName: string;
  credits: number;      // uint8
  gradePoints: number;  // uint8 (0-10 integer scale)
}

/**
 * Semester report struct (matches StudentRecords.sol SemesterReport struct)
 */
export interface ContractSemesterReport {
  semesterNumber: number;     // uint8
  semesterType: ContractSemesterType;  // enum
  sgpa: number;               // uint16 (scaled by 100)
  cgpa: number;               // uint16 (scaled by 100)
  totalCredits: number;       // uint8
  isFinalized: boolean;
  exists: boolean;            // bool - indicates if report exists
}

/**
 * Degree proposal struct (matches DegreeNFT.sol DegreeProposal struct)
 */
export interface ContractDegreeProposal {
  studentId: bigint;           // uint256
  rollNumber: string;          // string
  programTitle: string;        // string
  graduationYear: number;      // uint16
  cgpa: number;                // uint16 (scaled by 100)
  state: ContractApprovalState; // enum
  proposedAt: bigint;          // uint256
  approvedAt: bigint;          // uint256
}

/**
 * Degree data (stored on NFT, matches DegreeNFT.sol)
 */
export interface ContractDegreeData {
  studentId: bigint;           // uint256
  programTitle: string;
  rollNumber: string;
  cgpa: number;                // uint16 (scaled by 100)
  graduationYear: number;      // uint16
  mintTimestamp: bigint;       // uint256
}

/**
 * Certificate data (matches CertificateNFT.sol)
 */
export interface ContractCertificateData {
  studentId: bigint;           // uint256
  rollNumber: string;
  programTitle: string;
  certType: ContractCertificateType;
  yearsCompleted: number;      // uint8
  cgpa: number;                // uint16 (scaled by 100)
  exitYear: number;            // uint16
  exitReason: string;
  mintTimestamp: bigint;       // uint256
}

// ===========================================
// INPUT TYPES (for service functions)
// ===========================================

/**
 * Input for registering a student on-chain
 */
export interface RegisterStudentInput {
  walletAddress: string;
  name: string;
  rollNumber: string;
  departmentId: number;
  programId: number;
  admissionYear: number;
}

/**
 * Input for creating a semester report on-chain
 */
export interface CreateSemesterReportInput {
  studentId: bigint;
  semester: number;
  semesterType: ContractSemesterType;
  courseIds: string[];
  courseNames: string[];  // Course names array - required by contract
  credits: number[];
  gradePoints: number[];
  cgpa: number;  // Backend float value - will be converted
}

/**
 * Input for proposing a degree on-chain
 */
export interface ProposeDegreeInput {
  studentId: bigint;
  programTitle: string;
  rollNumber: string;
  cgpa: number;  // Backend float value - will be converted
  graduationYear: number;
}

/**
 * Input for minting a semester report NFT
 */
export interface MintReportInput {
  studentId: bigint;
  semester: number;
  rollNumber: string;
  sgpa: number;
  cgpa: number;
  recipient: string;
}

/**
 * Input for issuing a certificate on-chain
 */
export interface IssueCertificateInput {
  studentId: bigint;
  rollNumber: string;
  programTitle: string;
  yearsCompleted: number;
  cgpa: number;  // Backend float value - will be converted
  exitYear: number;
  exitReason: string;
  recipientAddress: string;
}

// ===========================================
// RESULT TYPES (from contract calls)
// ===========================================

/**
 * Transaction result
 */
export interface TransactionResult {
  transactionHash: string;
  blockNumber: number;
  gasUsed: bigint;
}

/**
 * Student registration result
 */
export interface RegisterStudentResult extends TransactionResult {
  onChainStudentId: bigint;
}

/**
 * Semester report creation result
 */
export interface SemesterReportResult extends TransactionResult {
  sgpa: number;  // Calculated on-chain
}

/**
 * NFT minting result
 */
export interface MintNFTResult extends TransactionResult {
  tokenId: bigint;
}

// ===========================================
// MAPPING HELPERS (Backend <-> Contract)
// ===========================================

/**
 * Map backend StudentStatus to contract StudentStatus
 */
export const backendToContractStatus: Record<string, ContractStudentStatus> = {
  "ACTIVE": ContractStudentStatus.Active,
  "LEAVE_OF_ABSENCE": ContractStudentStatus.LeaveOfAbsence,
  "REPEAT_YEAR": ContractStudentStatus.RepeatYear,
  "DROPPED_OUT": ContractStudentStatus.DroppedOut,
  "GRADUATED": ContractStudentStatus.Graduated,
  "EARLY_EXIT": ContractStudentStatus.EarlyExit,
  // PENDING_ACTIVATION maps to Active (student not on-chain until activated)
  "PENDING_ACTIVATION": ContractStudentStatus.Active,
};

/**
 * Map contract StudentStatus to backend StudentStatus
 */
export const contractToBackendStatus: Record<ContractStudentStatus, string> = {
  [ContractStudentStatus.Active]: "ACTIVE",
  [ContractStudentStatus.LeaveOfAbsence]: "LEAVE_OF_ABSENCE",
  [ContractStudentStatus.RepeatYear]: "REPEAT_YEAR",
  [ContractStudentStatus.DroppedOut]: "DROPPED_OUT",
  [ContractStudentStatus.Graduated]: "GRADUATED",
  [ContractStudentStatus.EarlyExit]: "EARLY_EXIT",
};

/**
 * Map backend SemesterType to contract SemesterType
 */
export const backendToContractSemesterType: Record<string, ContractSemesterType> = {
  "EVEN": ContractSemesterType.Even,
  "ODD": ContractSemesterType.Odd,
  "SUMMER": ContractSemesterType.Summer,
};

/**
 * Map contract SemesterType to backend SemesterType
 */
export const contractToBackendSemesterType: Record<ContractSemesterType, string> = {
  [ContractSemesterType.Even]: "EVEN",
  [ContractSemesterType.Odd]: "ODD",
  [ContractSemesterType.Summer]: "SUMMER",
};

/**
 * Map contract DegreeProposalStatus to backend status
 */
export const contractToBackendDegreeStatus: Record<ContractApprovalState, string> = {
  [ContractApprovalState.None]: "DRAFT",
  [ContractApprovalState.Proposed]: "PENDING_ADMIN",
  [ContractApprovalState.Approved]: "APPROVED",
  [ContractApprovalState.Finalized]: "ISSUED",
};

/**
 * Map certificate type based on years completed
 */
export function getCertificateTypeFromYears(yearsCompleted: number): ContractCertificateType {
  switch (yearsCompleted) {
    case 1: return ContractCertificateType.CertificateOfEngineering;
    case 2: return ContractCertificateType.DiplomaInEngineering;
    case 3: return ContractCertificateType.BSc;
    case 4: return ContractCertificateType.BTech;
    default: throw new Error(`Invalid years completed: ${yearsCompleted}`);
  }
}

/**
 * Get certificate name from type
 */
export function getCertificateName(certType: ContractCertificateType): string {
  switch (certType) {
    case ContractCertificateType.CertificateOfEngineering:
      return "Certificate of Engineering";
    case ContractCertificateType.DiplomaInEngineering:
      return "Diploma in Engineering";
    case ContractCertificateType.BSc:
      return "Bachelor of Science";
    case ContractCertificateType.BTech:
      return "Bachelor of Technology";
  }
}
