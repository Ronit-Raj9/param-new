/**
 * DegreeNFT Contract Service
 * 
 * Provides type-safe interaction with the DegreeNFT.sol smart contract.
 * Handles the multi-step approval workflow and NFT minting for degrees.
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

const logger = createLogger("degree-nft-contract");

// ===========================================
// TYPES
// ===========================================

export interface DegreeNFTInfo {
  tokenId: bigint;
  owner: string;
  data: ContractDegreeData;
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

function getDegreeNFTContract(
  signerOrProvider?: ethers.Wallet | ethers.JsonRpcProvider
): any {
  const contract = getContract("degreeNft", signerOrProvider);
  if (!contract) {
    throw new Error("DegreeNFT contract not configured");
  }
  return contract as any;
}

// ===========================================
// READ FUNCTIONS
// ===========================================

/**
 * Get degree proposal for a student
 * Note: Contract function is named "getProposal" not "getDegreeProposal"
 */
export async function getDegreeProposal(studentId: bigint): Promise<ContractDegreeProposal | null> {
  try {
    const contract = getDegreeNFTContract();
    // Contract function is named "getProposal"
    const proposal = await contract.getProposal(studentId);

    // Check if proposal exists (state will be None if not)
    if (Number(proposal.state) === ContractApprovalState.None) {
      return null;
    }

    return {
      studentId: BigInt(proposal.studentId),
      rollNumber: proposal.rollNumber,
      programTitle: proposal.programTitle,
      graduationYear: Number(proposal.graduationYear),
      cgpa: gpaFromContract(Number(proposal.cgpa)),
      state: Number(proposal.state) as ContractApprovalState,
      proposedAt: BigInt(proposal.proposedAt),
      approvedAt: BigInt(proposal.approvedAt),
    };
  } catch (error) {
    logger.error({ error, studentId: studentId.toString() }, "Failed to get degree proposal");
    return null;
  }
}

/**
 * Get approval state for a student's degree
 * Note: Uses getProposal and extracts the state field
 */
export async function getApprovalState(studentId: bigint): Promise<ContractApprovalState> {
  try {
    const proposal = await getDegreeProposal(studentId);
    if (!proposal) {
      return ContractApprovalState.None;
    }
    return proposal.state;
  } catch (error) {
    logger.error({ error, studentId: studentId.toString() }, "Failed to get approval state");
    throw error;
  }
}

/**
 * Get backend-compatible status from contract state
 */
export async function getBackendStatus(studentId: bigint): Promise<string> {
  const state = await getApprovalState(studentId);
  return contractToBackendDegreeStatus[state];
}

/**
 * Get degree NFT data by token ID
 */
export async function getDegreeData(tokenId: bigint): Promise<ContractDegreeData | null> {
  try {
    const contract = getDegreeNFTContract();
    const data = await contract.getDegreeData(tokenId);

    return {
      studentId: BigInt(data.studentId),
      programTitle: data.programTitle,
      rollNumber: data.rollNumber,
      cgpa: gpaFromContract(Number(data.cgpa)),
      graduationYear: Number(data.graduationYear),
      mintTimestamp: BigInt(data.mintTimestamp),
    };
  } catch (error) {
    logger.error({ error, tokenId: tokenId.toString() }, "Failed to get degree data");
    return null;
  }
}

/**
 * Get token ID for a student's degree
 * Uses getDegreeByStudent contract function that returns (tokenId, issued)
 */
export async function getTokenIdForStudent(studentId: bigint): Promise<bigint | null> {
  try {
    const contract = getDegreeNFTContract();
    // Contract function returns tuple: (tokenId, issued)
    const result = await contract.getDegreeByStudent(studentId);
    const tokenId = BigInt(result[0] || result.tokenId);
    const issued = result[1] || result.issued;
    
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
 * Check if student has a degree NFT
 */
export async function hasDegreeNFT(studentId: bigint): Promise<boolean> {
  const tokenId = await getTokenIdForStudent(studentId);
  return tokenId !== null;
}

/**
 * Check if an NFT is revoked
 */
export async function isRevoked(tokenId: bigint): Promise<boolean> {
  try {
    // FIXME: Contract ABI does not have isRevoked function
    // const contract = getDegreeNFTContract();
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
    // const contract = getDegreeNFTContract();
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
    const contract = getDegreeNFTContract();
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
    const contract = getDegreeNFTContract();
    return await contract.ownerOf(tokenId);
  } catch (error) {
    logger.error({ error, tokenId: tokenId.toString() }, "Failed to get token owner");
    throw error;
  }
}

/**
 * Get full NFT info
 */
export async function getNFTInfo(tokenId: bigint): Promise<DegreeNFTInfo | null> {
  try {
    const [data, owner, revoked, tokenURI] = await Promise.all([
      getDegreeData(tokenId),
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

// ===========================================
// WRITE FUNCTIONS (require signer)
// ===========================================

/**
 * Propose a degree (Step 1 - Academic)
 * Moves state from None → Proposed
 */
export async function proposeDegree(input: ProposeDegreeInput): Promise<TransactionResult> {
  try {
    const signer = await getSigner();
    const contract = getDegreeNFTContract(signer);

    logger.info({
      studentId: input.studentId.toString(),
      programTitle: input.programTitle,
      rollNumber: input.rollNumber,
    }, "Proposing degree on-chain");

    const tx = await contract.proposeDegree(
      input.studentId,
      input.rollNumber,
      input.programTitle,
      yearToContract(input.graduationYear),
      gpaToContract(input.cgpa)
    );

    const receipt = await tx.wait();
    if (!receipt) {
      throw new Error("Transaction receipt not received");
    }

    logger.info({
      transactionHash: receipt.hash,
      studentId: input.studentId.toString(),
    }, "Degree proposed on-chain");

    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed,
    };
  } catch (error) {
    logger.error({ error, input }, "Failed to propose degree on-chain");
    throw new Error(parseContractError(error));
  }
}

/**
 * Approve a degree (Step 2 - Admin)
 * Moves state from Proposed → Approved
 */
export async function approveDegree(studentId: bigint): Promise<TransactionResult> {
  try {
    const signer = await getSigner();
    const contract = getDegreeNFTContract(signer);

    logger.info({
      studentId: studentId.toString(),
    }, "Approving degree on-chain");

    const tx = await contract.approveDegree(studentId);
    const receipt = await tx.wait();

    if (!receipt) {
      throw new Error("Transaction receipt not received");
    }

    logger.info({
      transactionHash: receipt.hash,
      studentId: studentId.toString(),
    }, "Degree approved on-chain");

    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed,
    };
  } catch (error) {
    logger.error({ error, studentId: studentId.toString() }, "Failed to approve degree on-chain");
    throw new Error(parseContractError(error));
  }
}

/**
 * Finalize a degree (Step 3 - Mints NFT)
 * Moves state from Approved → Finalized
 */
export async function finalizeDegree(studentId: bigint, recipient: string): Promise<MintNFTResult> {
  try {
    const signer = await getSigner();
    const contract = getDegreeNFTContract(signer);

    logger.info({
      studentId: studentId.toString(),
      recipient,
    }, "Finalizing degree and minting NFT");

    const tx = await contract.finalizeDegree(studentId, recipient);
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
      studentId: studentId.toString(),
    }, "Degree NFT minted");

    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed,
      tokenId,
    };
  } catch (error) {
    logger.error({ error, studentId: studentId.toString() }, "Failed to finalize degree");
    throw new Error(parseContractError(error));
  }
}

/**
 * Revoke a degree NFT
 */
export async function revokeDegree(
  tokenId: bigint,
  reason: string
): Promise<TransactionResult> {
  try {
    const signer = await getSigner();
    const contract = getDegreeNFTContract(signer);

    logger.info({
      tokenId: tokenId.toString(),
      reason,
    }, "Revoking degree NFT");

    const tx = await contract.revokeDegree(tokenId, reason);
    const receipt = await tx.wait();

    if (!receipt) {
      throw new Error("Transaction receipt not received");
    }

    logger.info({
      transactionHash: receipt.hash,
      tokenId: tokenId.toString(),
    }, "Degree NFT revoked");

    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed,
    };
  } catch (error) {
    logger.error({ error, tokenId: tokenId.toString(), reason }, "Failed to revoke degree NFT");
    throw new Error(parseContractError(error));
  }
}

/**
 * Cancel a degree proposal (before finalization)
 */
export async function cancelProposal(studentId: bigint): Promise<TransactionResult> {
  try {
    const signer = await getSigner();
    const contract = getDegreeNFTContract(signer);

    logger.info({
      studentId: studentId.toString(),
    }, "Cancelling degree proposal");

    const tx = await contract.cancelProposal(studentId);
    const receipt = await tx.wait();

    if (!receipt) {
      throw new Error("Transaction receipt not received");
    }

    logger.info({
      transactionHash: receipt.hash,
      studentId: studentId.toString(),
    }, "Degree proposal cancelled");

    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed,
    };
  } catch (error) {
    logger.error({ error, studentId: studentId.toString() }, "Failed to cancel proposal");
    throw new Error(parseContractError(error));
  }
}

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

/**
 * Check if DegreeNFT contract is configured
 */
export function isDegreeNFTConfigured(): boolean {
  return !!contractAddresses.degreeNft;
}

/**
 * Get explorer URL for a token
 */
export function getTokenExplorerUrl(tokenId: bigint): string {
  return getExplorerTokenUrl(contractAddresses.degreeNft, tokenId.toString());
}

/**
 * Get contract address
 */
export function getContractAddress(): string {
  return contractAddresses.degreeNft;
}

/**
 * Get human-readable state name
 */
export function getStateName(state: ContractApprovalState): string {
  switch (state) {
    case ContractApprovalState.None:
      return "Not Proposed";
    case ContractApprovalState.Proposed:
      return "Pending Admin Approval";
    case ContractApprovalState.Approved:
      return "Approved (Ready to Mint)";
    case ContractApprovalState.Finalized:
      return "Finalized (NFT Minted)";
  }
}
