/**
 * Trader Auth Crypto Utilities
 *
 * Handles password hashing (argon2id), token generation, and invite code generation.
 */

import { randomBytes, createHash, timingSafeEqual } from "crypto";
import * as argon2 from "argon2";

// Argon2id configuration (OWASP recommendations)
const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 65536, // 64 MiB
  timeCost: 3,
  parallelism: 4,
  hashLength: 32,
};

/**
 * Hash a password using argon2id
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, ARGON2_OPTIONS);
}

/**
 * Verify a password against its hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

/**
 * Generate a cryptographically secure random token
 */
export function generateToken(bytes: number = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/**
 * Hash a token using SHA-256 (for storage comparison)
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Generate an invite code (human-readable, 16 chars)
 * Format: XXXX-XXXX-XXXX-XXXX
 * Uses characters that are easy to read (no O/0, I/l/1)
 */
export function generateInviteCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(16);
  let code = "";
  for (let i = 0; i < 16; i++) {
    code += chars[bytes[i] % chars.length];
  }
  // Format as XXXX-XXXX-XXXX-XXXX for readability
  return `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}-${code.slice(12, 16)}`;
}

/**
 * Timing-safe string comparison
 */
export function safeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}
