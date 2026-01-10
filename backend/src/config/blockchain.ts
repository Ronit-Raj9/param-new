import { ethers } from "ethers";
import { env } from "./env.js";

// Provider singleton
let provider: ethers.JsonRpcProvider | null = null;

export function getProvider(): ethers.JsonRpcProvider | null {
  if (!env.RPC_URL) {
    console.warn("⚠️ RPC_URL not configured - blockchain features disabled");
    return null;
  }

  if (!provider) {
    provider = new ethers.JsonRpcProvider(env.RPC_URL, env.CHAIN_ID);
  }

  return provider;
}

// Connection test
export async function testBlockchainConnection(): Promise<boolean> {
  const p = getProvider();
  if (!p) return false;

  try {
    const network = await p.getNetwork();
    console.log(`✅ Connected to blockchain: Chain ID ${network.chainId}`);
    return true;
  } catch (error) {
    console.error("❌ Blockchain connection failed:", error);
    return false;
  }
}

// Get block explorer URL for transaction
export function getExplorerTxUrl(txHash: string): string {
  return `${env.BLOCK_EXPLORER_URL}/tx/${txHash}`;
}

// Get block explorer URL for address
export function getExplorerAddressUrl(address: string): string {
  return `${env.BLOCK_EXPLORER_URL}/address/${address}`;
}

// Get block explorer URL for token
export function getExplorerTokenUrl(contractAddress: string, tokenId: string): string {
  return `${env.BLOCK_EXPLORER_URL}/nft/${contractAddress}/${tokenId}`;
}

// Blockchain configuration
export const blockchainConfig = {
  chainId: env.CHAIN_ID,
  rpcUrl: env.RPC_URL,
  explorerUrl: env.BLOCK_EXPLORER_URL,
  contracts: {
    semesterNft: env.SEMESTER_NFT_CONTRACT,
    degreeNft: env.DEGREE_NFT_CONTRACT,
  },
};

// Minimal ERC-721 ABI for reading
export const ERC721_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function balanceOf(address owner) view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
];

// Credential NFT ABI (extends ERC-721)
export const CREDENTIAL_NFT_ABI = [
  ...ERC721_ABI,
  // Custom functions for credential NFT
  "function mint(address to, string memory tokenURI, bytes32 documentHash) returns (uint256)",
  "function batchMint(address[] memory recipients, string[] memory tokenURIs, bytes32[] memory documentHashes) returns (uint256[])",
  "function revoke(uint256 tokenId, string memory reason)",
  "function isRevoked(uint256 tokenId) view returns (bool)",
  "function getDocumentHash(uint256 tokenId) view returns (bytes32)",
  "function getCredentialInfo(uint256 tokenId) view returns (address owner, string memory uri, bytes32 docHash, bool revoked, uint256 issuedAt)",
  // Events
  "event CredentialIssued(uint256 indexed tokenId, address indexed recipient, bytes32 documentHash)",
  "event CredentialRevoked(uint256 indexed tokenId, string reason)",
];

// Export contract address (use semester NFT as default credential contract)
export const CREDENTIAL_NFT_ADDRESS = env.SEMESTER_NFT_CONTRACT || "";

// Get contract instance
export function getCredentialNFTContract(): ethers.Contract | null {
  const p = getProvider();
  if (!p || !CREDENTIAL_NFT_ADDRESS) {
    return null;
  }
  return new ethers.Contract(CREDENTIAL_NFT_ADDRESS, CREDENTIAL_NFT_ABI, p);
}
