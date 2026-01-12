/**
 * Privy Wallet Service
 * 
 * Provides wallet functionality using Privy Server Wallets for secure key management.
 * See: https://docs.privy.io/wallets/
 */

import { ethers } from "ethers";
import { getProvider } from "../config/blockchain.js";
import {
    getAdminWalletId,
    isPrivyWalletConfigured,
    signAndSendTransaction as privySignAndSend,
    signMessage as privySignMessage,
} from "../config/privy.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("privy-wallet-service");

// Wallet mode configuration
export type WalletMode = "privy" | "none";

/**
 * Determine which wallet mode to use
 */
export function getWalletMode(): WalletMode {
    if (isPrivyWalletConfigured()) {
        return "privy";
    }
    return "none";
}

/**
 * Get a signer for signing transactions
 * Note: Privy wallets use API-based signing, so this returns null for Privy mode.
 * Use signAndSendTransaction() or signMessage() for Privy operations.
 */
export async function getSigner(): Promise<ethers.Wallet | null> {
    const provider = getProvider();
    if (!provider) {
        logger.warn("Blockchain provider not configured");
        return null;
    }

    const mode = getWalletMode();

    if (mode === "privy") {
        // Privy wallets use API-based signing, not ethers.Wallet
        // The contract services should use Privy's signAndSendTransaction
        logger.debug("Privy mode - use signAndSendTransaction() for transactions");
        return null;
    }

    logger.error("No wallet configured - set PRIVY_ADMIN_WALLET_ID in .env");
    return null;
}

/**
 * Sign a message using Privy wallet
 */
export async function signMessage(message: string): Promise<string | null> {
    const mode = getWalletMode();

    if (mode !== "privy") {
        logger.error("No wallet configured - set PRIVY_ADMIN_WALLET_ID in .env");
        return null;
    }

    return privySignMessage(message);
}

/**
 * Get wallet address for the admin/minter
 */
export async function getMinterAddress(): Promise<string | null> {
    const mode = getWalletMode();

    if (mode === "privy") {
        // For Privy, we need to look up the wallet address from the wallet ID
        // This would require an additional API call to Privy
        // For now, return null and log - the address should be stored after first use
        const walletId = getAdminWalletId();
        logger.debug({ walletId }, "Using Privy wallet - address lookup requires API call");
        return null;
    }

    const signer = await getSigner();
    if (!signer) {
        return null;
    }

    try {
        return await signer.getAddress();
    } catch (error) {
        logger.error({ error }, "Failed to get minter address");
        return null;
    }
}

/**
 * Check wallet balance
 */
export async function getWalletBalance(): Promise<{ balance: string; formatted: string } | null> {
    const provider = getProvider();
    const address = await getMinterAddress();

    if (!provider || !address) {
        return null;
    }

    try {
        const balance = await provider.getBalance(address);
        return {
            balance: balance.toString(),
            formatted: ethers.formatEther(balance),
        };
    } catch (error) {
        logger.error({ error }, "Failed to get wallet balance");
        return null;
    }
}

/**
 * Check if wallet is properly configured and has sufficient balance
 */
export async function checkWalletHealth(): Promise<{
    configured: boolean;
    mode: WalletMode;
    adminWalletId: string | null;
    address: string | null;
    balance: string | null;
    hasBalance: boolean;
}> {
    const mode = getWalletMode();
    const adminWalletId = getAdminWalletId();
    const address = await getMinterAddress();
    const balanceInfo = await getWalletBalance();

    return {
        configured: mode !== "none",
        mode,
        adminWalletId,
        address,
        balance: balanceInfo?.formatted ?? null,
        hasBalance: balanceInfo ? BigInt(balanceInfo.balance) > 0 : false,
    };
}

/**
 * Send a transaction using Privy wallet
 */
export async function sendTransaction(tx: {
    to: string;
    value?: string;
    data?: string;
    chainId: number;
}): Promise<{ hash: string } | null> {
    const mode = getWalletMode();

    if (mode !== "privy") {
        logger.error("No wallet configured - set PRIVY_ADMIN_WALLET_ID in .env");
        return null;
    }

    return privySignAndSend(tx);
}
