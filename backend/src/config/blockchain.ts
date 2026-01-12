import { ethers } from "ethers";
import { env } from "./env.js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// ===========================================
// PROVIDER CONFIGURATION
// ===========================================

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

// ===========================================
// BLOCK EXPLORER URLS
// ===========================================

export function getExplorerTxUrl(txHash: string): string {
  return `${env.BLOCK_EXPLORER_URL}/tx/${txHash}`;
}

export function getExplorerAddressUrl(address: string): string {
  return `${env.BLOCK_EXPLORER_URL}/address/${address}`;
}

export function getExplorerTokenUrl(contractAddress: string, tokenId: string): string {
  return `${env.BLOCK_EXPLORER_URL}/nft/${contractAddress}/${tokenId}`;
}

// ===========================================
// CONTRACT ADDRESSES
// ===========================================

export const contractAddresses = {
  studentRecords: env.STUDENT_RECORDS_CONTRACT || "",
  collegeRegistry: env.COLLEGE_REGISTRY_CONTRACT || "",
  semesterReportNft: env.SEMESTER_NFT_CONTRACT || "",
  degreeNft: env.DEGREE_NFT_CONTRACT || "",
  certificateNft: env.CERTIFICATE_NFT_CONTRACT || "",
} as const;

// Legacy alias for backwards compatibility
export const CREDENTIAL_NFT_ADDRESS = contractAddresses.semesterReportNft;

// ===========================================
// ABI LOADING
// ===========================================

// Path to ABI files (relative to project root: ../../contracts/ABI)
const ABI_DIR = join(__dirname, "..", "..", "..", "contracts", "ABI");

/**
 * Load ABI from JSON file
 */
function loadABI(filename: string): ethers.InterfaceAbi {
  try {
    const abiPath = join(ABI_DIR, filename);
    const abiJson = readFileSync(abiPath, "utf-8");
    return JSON.parse(abiJson);
  } catch (error) {
    console.warn(`⚠️ Could not load ABI from ${filename}:`, error);
    return [];
  }
}

// Load ABIs from contract build artifacts
export const ABIs = {
  studentRecords: loadABI("StudentRecord.json"),
  collegeRegistry: loadABI("CollegeRegistry.json"),
  semesterReportNft: loadABI("SemesterReportNFT.json"),
  degreeNft: loadABI("DegreeNFT.json"),
  certificateNft: loadABI("CertificateNFT.json"),
} as const;

// Minimal ERC-721 ABI for reading (fallback)
export const ERC721_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function balanceOf(address owner) view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
];

// Legacy credential NFT ABI (for backwards compatibility)
export const CREDENTIAL_NFT_ABI = [
  ...ERC721_ABI,
  "function mint(address to, string memory tokenURI, bytes32 documentHash) returns (uint256)",
  "function batchMint(address[] memory recipients, string[] memory tokenURIs, bytes32[] memory documentHashes) returns (uint256[])",
  "function revoke(uint256 tokenId, string memory reason)",
  "function isRevoked(uint256 tokenId) view returns (bool)",
  "function getDocumentHash(uint256 tokenId) view returns (bytes32)",
  "function getCredentialInfo(uint256 tokenId) view returns (address owner, string memory uri, bytes32 docHash, bool revoked, uint256 issuedAt)",
  "event CredentialIssued(uint256 indexed tokenId, address indexed recipient, bytes32 documentHash)",
  "event CredentialRevoked(uint256 indexed tokenId, string reason)",
];

// ===========================================
// BLOCKCHAIN CONFIGURATION
// ===========================================

export const blockchainConfig = {
  chainId: env.CHAIN_ID,
  rpcUrl: env.RPC_URL,
  explorerUrl: env.BLOCK_EXPLORER_URL,
  contracts: {
    studentRecords: contractAddresses.studentRecords,
    collegeRegistry: contractAddresses.collegeRegistry,
    semesterNft: contractAddresses.semesterReportNft,
    degreeNft: contractAddresses.degreeNft,
    certificateNft: contractAddresses.certificateNft,
  },
};

// ===========================================
// CONTRACT INSTANCES
// ===========================================

/**
 * Get contract instance by type
 */
export function getContract(
  type: keyof typeof contractAddresses,
  signerOrProvider?: ethers.Wallet | ethers.JsonRpcProvider
): ethers.Contract | null {
  const address = contractAddresses[type];
  const abi = ABIs[type];

  if (!address) {
    console.warn(`⚠️ Contract address for ${type} not configured`);
    return null;
  }

  if (!abi || (Array.isArray(abi) && abi.length === 0)) {
    console.warn(`⚠️ ABI for ${type} not loaded`);
    return null;
  }

  const providerOrSigner = signerOrProvider || getProvider();
  if (!providerOrSigner) {
    console.warn("⚠️ No provider available");
    return null;
  }

  return new ethers.Contract(address, abi, providerOrSigner);
}

// Legacy function for backwards compatibility
export function getCredentialNFTContract(): ethers.Contract | null {
  return getContract("semesterReportNft");
}

// ===========================================
// CONTRACT STATUS CHECK
// ===========================================

/**
 * Check which contracts are configured
 */
export function getContractStatus(): Record<keyof typeof contractAddresses, boolean> {
  return {
    studentRecords: !!contractAddresses.studentRecords,
    collegeRegistry: !!contractAddresses.collegeRegistry,
    semesterReportNft: !!contractAddresses.semesterReportNft,
    degreeNft: !!contractAddresses.degreeNft,
    certificateNft: !!contractAddresses.certificateNft,
  };
}

/**
 * Check if a wallet is configured (either Privy or fallback private key)
 */
function isWalletConfigured(): boolean {
  return !!env.PRIVY_ADMIN_WALLET_ID;
}

/**
 * Check if blockchain integration is fully configured
 */
export function isBlockchainFullyConfigured(): boolean {
  return !!(
    env.RPC_URL &&
    isWalletConfigured() &&
    contractAddresses.studentRecords &&
    contractAddresses.semesterReportNft &&
    contractAddresses.degreeNft
  );
}

/**
 * Check if minimal blockchain is configured (for NFT minting)
 */
export function isBlockchainEnabled(): boolean {
  return !!(env.RPC_URL && isWalletConfigured() && contractAddresses.semesterReportNft);
}
