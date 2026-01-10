import { PrivyClient } from "@privy-io/server-auth";
import { env } from "../config/env.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("privy-service");

let privyClient: PrivyClient | null = null;

/**
 * Get Privy client instance
 */
export function getPrivyClient(): PrivyClient {
  if (!privyClient) {
    privyClient = new PrivyClient(env.PRIVY_APP_ID, env.PRIVY_APP_SECRET);
  }
  return privyClient;
}

/**
 * Create an embedded wallet for a user (after degree approval)
 */
export async function createEmbeddedWallet(userId: string): Promise<string | null> {
  try {
    const client = getPrivyClient();
    
    // Get user to check if they already have a wallet
    const user = await client.getUser(userId);
    
    // Check if user already has an embedded wallet
    const embeddedWallet = user?.linkedAccounts?.find(
      (account) => account.type === "wallet" && account.walletClientType === "privy"
    );

    if (embeddedWallet && "address" in embeddedWallet) {
      logger.info({ userId, address: embeddedWallet.address }, "User already has embedded wallet");
      return embeddedWallet.address;
    }

    // Create embedded wallet
    // Note: This is typically done on the client side with Privy SDK
    // Server-side wallet creation requires enterprise features
    logger.info({ userId }, "Embedded wallet creation requested");
    
    return null;
  } catch (error) {
    logger.error({ error, userId }, "Failed to create embedded wallet");
    return null;
  }
}

/**
 * Get user's wallet addresses
 */
export async function getUserWallets(privyUserId: string): Promise<string[]> {
  try {
    const client = getPrivyClient();
    const user = await client.getUser(privyUserId);

    if (!user?.linkedAccounts) {
      return [];
    }

    const wallets = user.linkedAccounts
      .filter((account) => account.type === "wallet")
      .map((account) => {
        if ("address" in account) {
          return account.address;
        }
        return null;
      })
      .filter((address): address is string => address !== null);

    return wallets;
  } catch (error) {
    logger.error({ error, privyUserId }, "Failed to get user wallets");
    return [];
  }
}

/**
 * Delete a user from Privy
 */
export async function deletePrivyUserById(privyUserId: string): Promise<boolean> {
  try {
    const client = getPrivyClient();
    await client.deleteUser(privyUserId);
    logger.info({ privyUserId }, "Privy user deleted");
    return true;
  } catch (error) {
    logger.error({ error, privyUserId }, "Failed to delete Privy user");
    return false;
  }
}

/**
 * Import a user to Privy (for pre-registration)
 */
export async function importUserToPrivy(email: string): Promise<{ userId: string } | null> {
  try {
    const client = getPrivyClient();
    
    // Import user with email
    const result = await client.importUser({
      linkedAccounts: [
        {
          type: "email",
          address: email,
        },
      ],
      createEthereumWallet: false, // Don't create wallet until degree approval
    });

    logger.info({ email, userId: result.id }, "User imported to Privy");
    return { userId: result.id };
  } catch (error) {
    logger.error({ error, email }, "Failed to import user to Privy");
    return null;
  }
}
