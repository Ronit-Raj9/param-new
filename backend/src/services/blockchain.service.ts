import { ethers } from "ethers";
import { getProvider, CREDENTIAL_NFT_ABI, CREDENTIAL_NFT_ADDRESS } from "../config/blockchain.js";
import { env } from "../config/env.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("blockchain-service");

// Contract interface for type safety
interface CredentialNFTContract {
  mint(to: string, tokenURI: string, documentHash: string): Promise<ethers.ContractTransactionResponse>;
  revoke(tokenId: string, reason: string): Promise<ethers.ContractTransactionResponse>;
  isRevoked(tokenId: string): Promise<boolean>;
  tokenURI(tokenId: string): Promise<string>;
  ownerOf(tokenId: string): Promise<string>;
  getDocumentHash(tokenId: string): Promise<string>;
}

/**
 * Get signer for transactions
 */
function getSigner(): ethers.Wallet {
  const provider = getProvider();
  if (!provider) {
    throw new Error("Blockchain provider not configured");
  }
  
  if (!env.MINTER_PRIVATE_KEY) {
    throw new Error("MINTER_PRIVATE_KEY not configured");
  }
  
  return new ethers.Wallet(env.MINTER_PRIVATE_KEY, provider);
}

/**
 * Get credential NFT contract instance
 */
function getContract(signerOrProvider?: ethers.Wallet | ethers.JsonRpcProvider): ethers.Contract {
  if (!CREDENTIAL_NFT_ADDRESS) {
    throw new Error("CREDENTIAL_NFT_ADDRESS not configured");
  }
  
  const providerOrSigner = signerOrProvider || getProvider();
  if (!providerOrSigner) {
    throw new Error("Blockchain provider not configured");
  }
  
  return new ethers.Contract(CREDENTIAL_NFT_ADDRESS, CREDENTIAL_NFT_ABI, providerOrSigner);
}

/**
 * Mint a credential NFT
 */
export async function mintCredentialNFT(
  recipientAddress: string,
  tokenURI: string, // Metadata URI or document hash
  documentHash: string
): Promise<{ tokenId: string; transactionHash: string }> {
  try {
    const signer = getSigner();
    const contract = getContract(signer) as unknown as CredentialNFTContract;

    logger.info({ recipientAddress, tokenURI }, "Minting credential NFT");

    // Call the mint function
    const tx = await contract.mint(recipientAddress, tokenURI, documentHash);
    const receipt = await tx.wait();

    if (!receipt) {
      throw new Error("Transaction receipt not received");
    }

    // Parse the Transfer event to get token ID
    const transferEvent = receipt.logs.find(
      (log) => log.topics[0] === ethers.id("Transfer(address,address,uint256)")
    );

    if (!transferEvent || !transferEvent.topics[3]) {
      throw new Error("Transfer event not found in transaction receipt");
    }

    const tokenId = ethers.toBigInt(transferEvent.topics[3]).toString();

    logger.info({ 
      tokenId, 
      transactionHash: receipt.hash,
      recipientAddress 
    }, "Credential NFT minted successfully");

    return {
      tokenId,
      transactionHash: receipt.hash,
    };
  } catch (error) {
    logger.error({ error, recipientAddress }, "Failed to mint credential NFT");
    throw error;
  }
}

/**
 * Batch mint multiple credential NFTs
 */
export async function batchMintCredentialNFTs(
  credentials: Array<{
    recipientAddress: string;
    tokenURI: string;
    documentHash: string;
  }>
): Promise<Array<{ tokenId: string; transactionHash: string; error?: string }>> {
  const results: Array<{ tokenId: string; transactionHash: string; error?: string }> = [];

  for (const credential of credentials) {
    try {
      const result = await mintCredentialNFT(
        credential.recipientAddress,
        credential.tokenURI,
        credential.documentHash
      );
      results.push(result);
    } catch (error) {
      results.push({
        tokenId: "",
        transactionHash: "",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return results;
}

/**
 * Revoke a credential NFT
 */
export async function revokeCredentialNFT(tokenId: string, reason: string): Promise<string> {
  try {
    const signer = getSigner();
    const contract = getContract(signer) as unknown as CredentialNFTContract;

    logger.info({ tokenId, reason }, "Revoking credential NFT");

    const tx = await contract.revoke(tokenId, reason);
    const receipt = await tx.wait();

    if (!receipt) {
      throw new Error("Transaction receipt not received");
    }

    logger.info({ tokenId, transactionHash: receipt.hash }, "Credential NFT revoked");

    return receipt.hash;
  } catch (error) {
    logger.error({ error, tokenId }, "Failed to revoke credential NFT");
    throw error;
  }
}

/**
 * Check if a credential NFT is revoked
 */
export async function isCredentialRevoked(tokenId: string): Promise<boolean> {
  try {
    const contract = getContract() as unknown as CredentialNFTContract;
    const isRevoked = await contract.isRevoked(tokenId);
    return isRevoked;
  } catch (error) {
    logger.error({ error, tokenId }, "Failed to check revocation status");
    throw error;
  }
}

/**
 * Get credential NFT metadata
 */
export async function getCredentialMetadata(tokenId: string): Promise<{
  tokenURI: string;
  owner: string;
  documentHash: string;
  isRevoked: boolean;
}> {
  try {
    const contract = getContract() as unknown as CredentialNFTContract;

    const [tokenURI, owner, documentHash, isRevoked] = await Promise.all([
      contract.tokenURI(tokenId),
      contract.ownerOf(tokenId),
      contract.getDocumentHash(tokenId),
      contract.isRevoked(tokenId),
    ]);

    return {
      tokenURI,
      owner,
      documentHash,
      isRevoked,
    };
  } catch (error) {
    logger.error({ error, tokenId }, "Failed to get credential metadata");
    throw error;
  }
}

/**
 * Verify credential on blockchain
 */
export async function verifyCredentialOnChain(
  tokenId: string,
  expectedHash: string
): Promise<{ valid: boolean; reason?: string }> {
  try {
    const metadata = await getCredentialMetadata(tokenId);

    if (metadata.isRevoked) {
      return { valid: false, reason: "Credential has been revoked on blockchain" };
    }

    if (metadata.documentHash !== expectedHash) {
      return { valid: false, reason: "Document hash mismatch" };
    }

    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      reason: error instanceof Error ? error.message : "Verification failed" 
    };
  }
}

/**
 * Get gas estimate for minting
 */
export async function estimateMintGas(
  recipientAddress: string,
  tokenURI: string,
  documentHash: string
): Promise<bigint> {
  const signer = getSigner();
  const contract = getContract(signer);

  const gasEstimate = await contract.mint!.estimateGas(
    recipientAddress,
    tokenURI,
    documentHash
  );

  return gasEstimate;
}

/**
 * Get current gas price
 */
export async function getCurrentGasPrice(): Promise<bigint> {
  const provider = getProvider();
  if (!provider) {
    throw new Error("Blockchain provider not configured");
  }
  
  const feeData = await provider.getFeeData();
  return feeData.gasPrice || BigInt(0);
}

/**
 * Check if blockchain is configured and available
 */
export function isBlockchainEnabled(): boolean {
  return !!(env.RPC_URL && env.MINTER_PRIVATE_KEY && CREDENTIAL_NFT_ADDRESS);
}
