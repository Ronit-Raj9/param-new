import { PrivyClient } from "@privy-io/server-auth";
import { PrivyClient as PrivyNodeClient } from "@privy-io/node";
import { env } from "./env.js";

// Privy server-auth client singleton (for token verification)
let privyClient: PrivyClient | null = null;

// Privy node client singleton (for wallet operations)
let privyNodeClient: PrivyNodeClient | null = null;

/**
 * Get Privy server-auth client (for token verification, user lookup)
 */
export function getPrivyClient(): PrivyClient {
  if (!privyClient) {
    privyClient = new PrivyClient(env.PRIVY_APP_ID, env.PRIVY_APP_SECRET);
  }

  return privyClient;
}

/**
 * Get Privy node client (for wallet creation and operations)
 * @see https://docs.privy.io/wallets/wallets/create/create-a-wallet
 */
export function getPrivyNodeClient(): PrivyNodeClient {
  if (!privyNodeClient) {
    privyNodeClient = new PrivyNodeClient({
      appId: env.PRIVY_APP_ID,
      appSecret: env.PRIVY_APP_SECRET,
    });
  }

  return privyNodeClient;
}

// Verify Privy access token
export async function verifyPrivyToken(authToken: string) {
  const client = getPrivyClient();

  try {
    const verifiedClaims = await client.verifyAuthToken(authToken);
    return verifiedClaims;
  } catch (error) {
    console.error("Privy token verification failed:", error);
    return null;
  }
}

// Get user from Privy by DID
export async function getPrivyUser(did: string) {
  const client = getPrivyClient();

  try {
    const user = await client.getUser(did);
    return user;
  } catch (error) {
    console.error("Failed to get Privy user:", error);
    return null;
  }
}

// Get user by email
export async function getPrivyUserByEmail(email: string) {
  const client = getPrivyClient();

  try {
    const user = await client.getUserByEmail(email);
    return user;
  } catch (error) {
    console.error("Failed to get Privy user by email:", error);
    return null;
  }
}

// Delete a user from Privy (for GDPR compliance)
export async function deletePrivyUser(did: string) {
  const client = getPrivyClient();

  try {
    await client.deleteUser(did);
    return true;
  } catch (error) {
    console.error("Failed to delete Privy user:", error);
    return false;
  }
}

/**
 * Create a wallet for credential issuance
 * @see https://docs.privy.io/api-reference/wallets/create
 */
export async function createPrivyWallet(): Promise<{
  id: string;
  address: string;
} | null> {
  const client = getPrivyNodeClient();

  try {
    const wallet = await client.wallets().create({
      chain_type: "ethereum",
    });

    return {
      id: wallet.id,
      address: wallet.address,
    };
  } catch (error) {
    console.error("Failed to create Privy wallet:", error);
    return null;
  }
}

/**
 * List all wallets in the app
 */
export async function listPrivyWallets(): Promise<Array<{
  id: string;
  address: string;
}>> {
  const client = getPrivyNodeClient();
  const wallets: Array<{ id: string; address: string }> = [];

  try {
    for await (const wallet of client.wallets().list()) {
      wallets.push({
        id: wallet.id,
        address: wallet.address,
      });
    }
    return wallets;
  } catch (error) {
    console.error("Failed to list Privy wallets:", error);
    return [];
  }
}

// Types for Privy claims
export interface PrivyVerifiedClaims {
  userId: string;      // Privy DID (did:privy:...)
  appId: string;
  issuer: string;
  issuedAt: Date;
  expiration: Date;
}

/**
 * Get admin wallet ID for signing transactions
 */
export function getAdminWalletId(): string | null {
  return env.PRIVY_ADMIN_WALLET_ID || env.PRIVY_WALLET_ID || null;
}

/**
 * Check if Privy admin wallet is configured
 */
export function isPrivyWalletConfigured(): boolean {
  return !!(env.PRIVY_ADMIN_WALLET_ID || env.PRIVY_WALLET_ID);
}

/**
 * Sign and send a transaction using the admin wallet
 * This is used for minting NFTs to student wallets
 * 
 * @see https://docs.privy.io/wallets/api/sign-transactions
 */
export async function signAndSendTransaction(params: {
  to: string;
  value?: string;
  data?: string;
  chainId: number;
}): Promise<{ hash: string } | null> {
  const walletId = getAdminWalletId();
  if (!walletId) {
    console.error("Admin wallet ID not configured");
    return null;
  }

  const client = getPrivyNodeClient();

  try {
    // Use Privy's Ethereum service to send transaction
    // See: https://docs.privy.io/wallets/api/ethereum
    const result = await client.wallets().ethereum().sendTransaction(walletId, {
      caip2: `eip155:${params.chainId}`,
      params: {
        transaction: {
          to: params.to,
          value: params.value,
          data: params.data,
        },
      },
    });

    return { hash: result.hash };
  } catch (error) {
    console.error("Failed to send transaction via Privy:", error);
    return null;
  }
}

/**
 * Sign a raw message using the admin wallet
 */
export async function signMessage(message: string): Promise<string | null> {
  const walletId = getAdminWalletId();
  if (!walletId) {
    console.error("Admin wallet ID not configured");
    return null;
  }

  const client = getPrivyNodeClient();

  try {
    const result = await client.wallets().ethereum().signMessage(walletId, {
      message,
    });

    return result.signature;
  } catch (error) {
    console.error("Failed to sign message via Privy:", error);
    return null;
  }
}
