/**
 * SemesterReportNFT Contract Service
 * 
 * Provides type-safe interaction with the SemesterReportNFT.sol smart contract.
 * Handles minting and querying semester transcript NFTs.
 */

import { ethers } from "ethers";
import { getProvider, getContract, contractAddresses, getExplorerTokenUrl } from "../../config/blockchain.js";
import { createLogger } from "../../utils/logger.js";
import * as privyWalletService from "../privy-wallet.service.js";
import {
  ContractApprovalState,
  ContractDegreeProposal,
  ContractDegreeData,
  ProposeDegreeInput,
  MintNFTResult,
  TransactionResult,
  contractToBackendDegreeStatus,
  MintReportInput,
} from "./types.js";
import {
  gpaToContract,
  gpaFromContract,
  studentIdFromContract,
  yearToContract,
  parseTokenIdFromReceipt,
  toChecksumAddress,
  parseContractError,
} from "./utils.js";

const logger = createLogger("semester-nft-contract");

// ===========================================
// TYPES
// ===========================================

/**
 * SemesterReportNFT data - matches SemesterReportNFT.sol ReportMetadata struct
 * Note: Does NOT include programTitle (that's in DegreeNFT, not SemesterReportNFT)
 */
export interface SemesterReportNFTData {
  studentId: bigint;
  rollNumber: string;
  semester: number;
  sgpa: number;
  cgpa: number;
  mintTimestamp: bigint;
}

export interface SemesterReportNFTInfo {
  tokenId: bigint;
  owner: string;
  data: SemesterReportNFTData;
  isRevoked: boolean;
  revokeReason?: string;
  tokenURI: string;
}

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

function getSemesterNFTContract(
  signerOrProvider?: ethers.Wallet | ethers.JsonRpcProvider
): any {
  const contract = getContract("semesterReportNft", signerOrProvider);
  if (!contract) {
    throw new Error("SemesterReportNFT contract not configured");
  }
  return contract as any;
}

// ===========================================
// READ FUNCTIONS
// ===========================================

/**
 * Get semester report NFT data by token ID
 */
export async function getReportData(tokenId: bigint): Promise<SemesterReportNFTData | null> {
  try {
    const contract = getSemesterNFTContract();
    const data = await contract.getReportByToken(tokenId);

    return {
      studentId: BigInt(data.studentId),
      rollNumber: data.rollNumber,
      semester: Number(data.semester),
      sgpa: gpaFromContract(Number(data.sgpa)),
      cgpa: gpaFromContract(Number(data.cgpa)),
      mintTimestamp: BigInt(data.mintTimestamp),
    };
  } catch (error) {
    logger.error({ error, tokenId: tokenId.toString() }, "Failed to get report data");
    return null;
  }
}

/**
 * Get token ID for a student's semester
 */
export async function getTokenIdForSemester(
  studentId: bigint,
  semester: number
): Promise<bigint | null> {
  try {
    const contract = getSemesterNFTContract();
    const result = await contract.getTokenIdBySemester(studentId, semester);

    // contract returns (uint256 tokenId, bool minted)
    // We only care about tokenId if minted is true, or if tokenId > 0
    const tokenId = result.tokenId || result[0];

    // Token ID 0 means not minted
    if (tokenId === BigInt(0)) {
      return null;
    }

    return BigInt(tokenId);
  } catch (error) {
    logger.error({
      error,
      studentId: studentId.toString(),
      semester
    }, "Failed to get token ID for semester");
    return null;
  }
}

/**
 * Check if a student has an NFT for a semester
 */
export async function hasNFTForSemester(studentId: bigint, semester: number): Promise<boolean> {
  const tokenId = await getTokenIdForSemester(studentId, semester);
  return tokenId !== null;
}

/**
 * Check if an NFT is revoked
 */
export async function isRevoked(tokenId: bigint): Promise<boolean> {
  try {
    // FIXME: Contract ABI does not have isRevoked function
    // For now we assume false to prevent runtime errors
    // const contract = getSemesterNFTContract();
    // return await contract.isRevoked(tokenId);
    return false;
  } catch (error) {
    logger.error({ error, tokenId: tokenId.toString() }, "Failed to check revocation status");
    throw error;
  }
}

/**
 * Get revocation reason
 */
export async function getRevokeReason(tokenId: bigint): Promise<string> {
  try {
    // FIXME: Contract ABI does not have getRevokeReason function
    // const contract = getSemesterNFTContract();
    // return await contract.getRevokeReason(tokenId);
    return "";
  } catch (error) {
    logger.error({ error, tokenId: tokenId.toString() }, "Failed to get revoke reason");
    throw error;
  }
}

/**
 * Get token URI (on-chain metadata)
 */
export async function getTokenURI(tokenId: bigint): Promise<string> {
  try {
    const contract = getSemesterNFTContract();
    return await contract.tokenURI(tokenId);
  } catch (error) {
    logger.error({ error, tokenId: tokenId.toString() }, "Failed to get token URI");
    throw error;
  }
}

/**
 * Get token owner
 */
export async function getOwner(tokenId: bigint): Promise<string> {
  try {
    const contract = getSemesterNFTContract();
    return await contract.ownerOf(tokenId);
  } catch (error) {
    logger.error({ error, tokenId: tokenId.toString() }, "Failed to get token owner");
    throw error;
  }
}

/**
 * Get full NFT info
 */
export async function getNFTInfo(tokenId: bigint): Promise<SemesterReportNFTInfo | null> {
  try {
    const [data, owner, revoked, tokenURI] = await Promise.all([
      getReportData(tokenId),
      getOwner(tokenId),
      isRevoked(tokenId),
      getTokenURI(tokenId),
    ]);

    if (!data) {
      return null;
    }

    let revokeReason: string | undefined;
    if (revoked) {
      revokeReason = await getRevokeReason(tokenId);
    }

    return {
      tokenId,
      owner,
      data,
      isRevoked: revoked,
      revokeReason,
      tokenURI,
    };
  } catch (error) {
    logger.error({ error, tokenId: tokenId.toString() }, "Failed to get NFT info");
    return null;
  }
}

/**
 * Get all NFTs owned by an address
 */
export async function getBalance(owner: string): Promise<bigint> {
  try {
    const contract = getSemesterNFTContract();
    return await contract.balanceOf(toChecksumAddress(owner));
  } catch (error) {
    logger.error({ error, owner }, "Failed to get balance");
    throw error;
  }
}

// ===========================================
// WRITE FUNCTIONS (require signer)
// ===========================================

/**
 * Mint a semester report NFT
 * NOTE: Semester report must be finalized in StudentRecords first
 */
export async function mintReport(input: MintReportInput): Promise<MintNFTResult> {
  try {
    const signer = await getSigner();
    const contract = getSemesterNFTContract(signer);

    logger.info({
      studentId: input.studentId.toString(),
      semester: input.semester,
      recipient: input.recipient,
    }, "Minting semester report NFT");

    // mintReport(uint256 _studentId, uint8 _semester, string _rollNumber, uint16 _sgpa, uint16 _cgpa, address _recipient)
    const tx = await contract.mintReport(
      input.studentId,
      input.semester,
      input.rollNumber,
      gpaToContract(input.sgpa),
      gpaToContract(input.cgpa),
      input.recipient
    );
    const receipt = await tx.wait();

    if (!receipt) {
      throw new Error("Transaction receipt not received");
    }

    const tokenId = parseTokenIdFromReceipt(receipt);
    if (!tokenId) {
      throw new Error("Could not parse token ID from receipt");
    }

    logger.info({
      transactionHash: receipt.hash,
      tokenId: tokenId.toString(),
      studentId: input.studentId.toString(),
      semester: input.semester,
    }, "Semester report NFT minted");

    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed,
      tokenId,
    };
  } catch (error) {
    logger.error({
      error,
      studentId: input.studentId.toString(),
      semester: input.semester
    }, "Failed to mint semester report NFT");
    throw new Error(parseContractError(error));
  }
}

/**
 * Revoke a semester report NFT
 */
export async function revokeReport(
  tokenId: bigint,
  reason: string
): Promise<TransactionResult> {
  try {
    const signer = await getSigner();
    const contract = getSemesterNFTContract(signer);

    logger.info({
      tokenId: tokenId.toString(),
      reason,
    }, "Revoking semester report NFT");

    const tx = await contract.revokeReport(tokenId, reason);
    const receipt = await tx.wait();

    if (!receipt) {
      throw new Error("Transaction receipt not received");
    }

    logger.info({
      transactionHash: receipt.hash,
      tokenId: tokenId.toString(),
    }, "Semester report NFT revoked");

    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed,
    };
  } catch (error) {
    logger.error({ error, tokenId: tokenId.toString(), reason }, "Failed to revoke semester report NFT");
    throw new Error(parseContractError(error));
  }
}

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

/**
 * Check if SemesterReportNFT contract is configured
 */
export function isSemesterNFTConfigured(): boolean {
  return !!contractAddresses.semesterReportNft;
}

/**
 * Get explorer URL for a token
 */
export function getTokenExplorerUrl(tokenId: bigint): string {
  return getExplorerTokenUrl(contractAddresses.semesterReportNft, tokenId.toString());
}

/**
 * Get contract address
 */
export function getContractAddress(): string {
  return contractAddresses.semesterReportNft;
}
