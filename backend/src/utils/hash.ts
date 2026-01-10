import crypto from "crypto";

/**
 * Generate SHA-256 hash of data
 */
export function sha256(data: string | Buffer): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Hash data - alias for sha256
 */
export function hashData(data: string | Buffer): string {
  return sha256(data);
}

/**
 * Generate SHA-256 hash as bytes32 (for blockchain)
 */
export function sha256Bytes32(data: string | Buffer): string {
  return "0x" + sha256(data);
}

/**
 * Verify SHA-256 hash
 */
export function verifySha256(data: string | Buffer, hash: string): boolean {
  const computed = sha256(data);
  return computed === hash || `0x${computed}` === hash;
}

/**
 * Generate a random token (for share links)
 */
export function generateToken(length: number = 16): string {
  return crypto.randomBytes(length).toString("base64url").slice(0, length);
}

/**
 * Generate a short unique ID
 */
export function generateShortId(): string {
  return crypto.randomBytes(8).toString("base64url");
}
