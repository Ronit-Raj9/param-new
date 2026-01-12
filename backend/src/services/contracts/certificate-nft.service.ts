/**
 * CertificateNFT Contract Service
 * 
 * Provides type-safe interaction with the CertificateNFT.sol smart contract.
 * Handles issuing certificates for dropout and early exit students.
 */

import { ethers } from "ethers";
import { getProvider, getContract, contractAddresses, getExplorerTokenUrl } from "../../config/blockchain.js";
import { createLogger } from "../../utils/logger.js";
import * as privyWalletService from "../privy-wallet.service.js";
import {
  ContractCertificateType,
  ContractCertificateData,
  IssueCertificateInput,
  MintNFTResult,
  TransactionResult,
  getCertificateTypeFromYears,
  getCertificateName,
} from "./types.js";
import {
  gpaToContract,
  gpaFromContract,
  yearToContract,
  parseTokenIdFromReceipt,
  toChecksumAddress,
  parseContractError,
} from "./utils.js";

const logger = createLogger("certificate-nft-contract");

// ===========================================
// TYPES
// ===========================================

export interface CertificateNFTInfo {
  tokenId: bigint;
  owner: string;
  data: ContractCertificateData;
  certificateName: string;
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

function getCertificateNFTContract(
  signerOrProvider?: ethers.Wallet | ethers.JsonRpcProvider
): any {
  const contract = getContract("certificateNft", signerOrProvider);
  if (!contract) {
    throw new Error("CertificateNFT contract not configured");
  }
  return contract as any;
}

// ===========================================
// READ FUNCTIONS
// ===========================================

/**
 * Get certificate data by token ID
 */
export async function getCertificateData(tokenId: bigint): Promise<ContractCertificateData | null> {
  try {
    const contract = getCertificateNFTContract();
    const data = await contract.getCertificateData(tokenId);

    return {
      studentId: BigInt(data.studentId),
      rollNumber: data.rollNumber,
      programTitle: data.programTitle,
      certType: Number(data.certType) as ContractCertificateType,
      yearsCompleted: Number(data.yearsCompleted),
      cgpa: gpaFromContract(Number(data.cgpa)),
      exitYear: Number(data.exitYear),
      exitReason: data.exitReason,
      mintTimestamp: BigInt(data.mintTimestamp),
    };
  } catch (error) {
    logger.error({ error, tokenId: tokenId.toString() }, "Failed to get certificate data");
    return null;
  }
}

/**
 * Check if a student has a certificate
 */
export async function hasCertificate(studentId: bigint): Promise<boolean> {
  try {
    const contract = getCertificateNFTContract();
    return await contract.hasCertificate(studentId);
  } catch (error) {
    logger.error({ error, studentId: studentId.toString() }, "Failed to check certificate existence");
    throw error;
  }
}

/**
 * Get token ID for a student's certificate
 * Uses getCertificateByStudent contract function that returns (tokenId, issued)
 */
export async function getTokenIdForStudent(studentId: bigint): Promise<bigint | null> {
  try {
    const contract = getCertificateNFTContract();
    // Contract function returns tuple: (tokenId, issued)
    const result = await contract.getCertificateByStudent(studentId);
    const tokenId = BigInt(result[0] || result.tokenId);
    const issued = result[1] || result.issued;

    // Token ID 0 or issued=false means not issued
    if (!issued || tokenId === BigInt(0)) {
      return null;
    }

    return tokenId;
  } catch (error) {
    logger.error({ error, studentId: studentId.toString() }, "Failed to get token ID for student");
    return null;
  }
}

/**
 * Check if a certificate is revoked
 */
export async function isRevoked(tokenId: bigint): Promise<boolean> {
  try {
    // FIXME: Contract ABI does not have isRevoked function
    // const contract = getCertificateNFTContract();
    // return await contract.isRevoked(tokenId);
    return false;
  } catch (error) {
    logger.error({ error, tokenId: tokenId.toString() }, "Failed to check revocation status");
    return false; // Fail safe
  }
}

/**
 * Get revocation reason
 */
export async function getRevokeReason(tokenId: bigint): Promise<string> {
  try {
    // FIXME: Contract ABI does not have getRevokeReason function
    // const contract = getCertificateNFTContract();
    // return await contract.getRevokeReason(tokenId);
    return "";
  } catch (error) {
    logger.error({ error, tokenId: tokenId.toString() }, "Failed to get revoke reason");
    return ""; // Fail safe
  }
}

/**
 * Get token URI (on-chain metadata)
 */
export async function getTokenURI(tokenId: bigint): Promise<string> {
  try {
    const contract = getCertificateNFTContract();
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
    const contract = getCertificateNFTContract();
    return await contract.ownerOf(tokenId);
  } catch (error) {
    logger.error({ error, tokenId: tokenId.toString() }, "Failed to get token owner");
    throw error;
  }
}

/**
 * Get full NFT info
 */
export async function getNFTInfo(tokenId: bigint): Promise<CertificateNFTInfo | null> {
  try {
    const [data, owner, revoked, tokenURI] = await Promise.all([
      getCertificateData(tokenId),
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
      certificateName: getCertificateName(data.certType),
      isRevoked: revoked,
      revokeReason,
      tokenURI,
    };
  } catch (error) {
    logger.error({ error, tokenId: tokenId.toString() }, "Failed to get NFT info");
    return null;
  }
}

// ===========================================
// WRITE FUNCTIONS (require signer)
// ===========================================

/**
 * Issue a certificate for a dropout or early exit student
 */
export async function issueCertificate(input: IssueCertificateInput): Promise<MintNFTResult> {
  try {
    const signer = await getSigner();
    const contract = getCertificateNFTContract(signer);

    // Validate years completed
    if (input.yearsCompleted < 1 || input.yearsCompleted > 4) {
      throw new Error("Years completed must be between 1 and 4");
    }

    const certType = getCertificateTypeFromYears(input.yearsCompleted);

    logger.info({
      studentId: input.studentId.toString(),
      rollNumber: input.rollNumber,
      yearsCompleted: input.yearsCompleted,
      certType,
      certificateName: getCertificateName(certType),
    }, "Issuing certificate NFT");

    const tx = await contract.issueCertificate(
      input.studentId,
      input.rollNumber,
      input.programTitle,
      input.yearsCompleted,
      gpaToContract(input.cgpa),
      yearToContract(input.exitYear),
      input.exitReason,
      toChecksumAddress(input.recipientAddress)
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
      certificateName: getCertificateName(certType),
    }, "Certificate NFT issued");

    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed,
      tokenId,
    };
  } catch (error) {
    logger.error({ error, input }, "Failed to issue certificate NFT");
    throw new Error(parseContractError(error));
  }
}

/**
 * Revoke a certificate NFT
 */
export async function revokeCertificate(
  tokenId: bigint,
  reason: string
): Promise<TransactionResult> {
  try {
    const signer = await getSigner();
    const contract = getCertificateNFTContract(signer);

    logger.info({
      tokenId: tokenId.toString(),
      reason,
    }, "Revoking certificate NFT");

    const tx = await contract.revokeCertificate(tokenId, reason);
    const receipt = await tx.wait();

    if (!receipt) {
      throw new Error("Transaction receipt not received");
    }

    logger.info({
      transactionHash: receipt.hash,
      tokenId: tokenId.toString(),
    }, "Certificate NFT revoked");

    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed,
    };
  } catch (error) {
    logger.error({ error, tokenId: tokenId.toString(), reason }, "Failed to revoke certificate NFT");
    throw new Error(parseContractError(error));
  }
}

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

/**
 * Check if CertificateNFT contract is configured
 */
export function isCertificateNFTConfigured(): boolean {
  return !!contractAddresses.certificateNft;
}

/**
 * Get explorer URL for a token
 */
export function getTokenExplorerUrl(tokenId: bigint): string {
  return getExplorerTokenUrl(contractAddresses.certificateNft, tokenId.toString());
}

/**
 * Get contract address
 */
export function getContractAddress(): string {
  return contractAddresses.certificateNft;
}

/**
 * Determine certificate type from years completed
 */
export function determineCertificateType(yearsCompleted: number): {
  type: ContractCertificateType;
  name: string;
} {
  const type = getCertificateTypeFromYears(yearsCompleted);
  return {
    type,
    name: getCertificateName(type),
  };
}

/**
 * Get all certificate type names
 */
export function getCertificateTypes(): Array<{ years: number; type: ContractCertificateType; name: string }> {
  return [
    { years: 1, type: ContractCertificateType.CertificateOfEngineering, name: "Certificate of Engineering" },
    { years: 2, type: ContractCertificateType.DiplomaInEngineering, name: "Diploma in Engineering" },
    { years: 3, type: ContractCertificateType.BSc, name: "Bachelor of Science" },
    { years: 4, type: ContractCertificateType.BTech, name: "Bachelor of Technology" },
  ];
}
