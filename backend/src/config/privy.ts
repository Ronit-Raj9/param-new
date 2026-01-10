import { PrivyClient } from "@privy-io/server-auth";
import { env } from "./env.js";

// Privy client singleton
let privyClient: PrivyClient | null = null;

export function getPrivyClient(): PrivyClient {
  if (!privyClient) {
    privyClient = new PrivyClient(env.PRIVY_APP_ID, env.PRIVY_APP_SECRET);
  }

  return privyClient;
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

// Types for Privy claims
export interface PrivyVerifiedClaims {
  userId: string;      // Privy DID (did:privy:...)
  appId: string;
  issuer: string;
  issuedAt: Date;
  expiration: Date;
}
