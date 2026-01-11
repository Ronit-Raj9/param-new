/**
 * Privy Wallet Service
 * 
 * Provides wallet functionality using Privy Server Wallets for secure key management.
 * Falls back to raw private key if Privy wallet is not configured.
 * 
 * For production, ALWAYS use Privy Server Wallets instead of raw private keys.
 * See: https://docs.privy.io/wallets/
 */

import { ethers } from "ethers";
import { env } from "../config/env.js";
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
export type WalletMode = "privy" | "raw" | "none";

/**
 * Determine which wallet mode to use
 */
export function getWalletMode(): WalletMode {
    if (isPrivyWalletConfigured()) {
        return "privy";
    }
    if (env.MINTER_PRIVATE_KEY) {
        return "raw";
    }
    return "none";
}

/**
 * Get a signer for signing transactions (raw key mode only)
 * For Privy mode, use signAndSendTransaction instead
 */
export async function getSigner(): Promise<ethers.Wallet | null> {
    const provider = getProvider();
    if (!provider) {
        logger.warn("Blockchain provider not configured");
        return null;
    }

    const mode = getWalletMode();

    if (mode === "privy") {
        // Privy wallets don't expose a traditional signer
        // Use signAndSendTransaction() or signMessage() for Privy operations
        logger.warn("Privy mode uses API-based signing, not ethers.Wallet signer");

        // Fall back to raw key if available for compatibility
        if (env.MINTER_PRIVATE_KEY) {
            logger.info("Falling back to MINTER_PRIVATE_KEY for ethers signer");
            return new ethers.Wallet(env.MINTER_PRIVATE_KEY, provider);
        }
        return null;
    }

    if (mode === "raw") {
        return new ethers.Wallet(env.MINTER_PRIVATE_KEY!, provider);
    }

    logger.error("No wallet configured - set PRIVY_ADMIN_WALLET_ID or MINTER_PRIVATE_KEY");
    return null;
}

/**
 * Sign a message using the configured wallet
 */
export async function signMessage(message: string): Promise<string | null> {
    const mode = getWalletMode();

    if (mode === "privy") {
        return privySignMessage(message);
    }

    const signer = await getSigner();
    if (!signer) {
        return null;
    }

    try {
        return await signer.signMessage(message);
    } catch (error) {
        logger.error({ error }, "Failed to sign message");
        return null;
    }
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
 * Send a transaction using the configured wallet
 */
export async function sendTransaction(tx: {
    to: string;
    value?: string;
    data?: string;
    chainId: number;
}): Promise<{ hash: string } | null> {
    const mode = getWalletMode();

    if (mode === "privy") {
        return privySignAndSend(tx);
    }

    // Raw key mode
    const signer = await getSigner();
    if (!signer) {
        return null;
    }

    try {
        const response = await signer.sendTransaction({
            to: tx.to,
            value: tx.value ? BigInt(tx.value) : undefined,
            data: tx.data,
            chainId: tx.chainId,
        });
        logger.info({ txHash: response.hash }, "Transaction sent");
        return { hash: response.hash };
    } catch (error) {
        logger.error({ error }, "Failed to send transaction");
        throw error;
    }
}
