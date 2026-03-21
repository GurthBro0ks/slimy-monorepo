/**
 * Slimy Auth — Cryptographic utilities
 * Handles password hashing (argon2) and token generation/hashing (SHA-256)
 */

import { randomBytes, createHash } from "crypto";
import argon2 from "argon2";

/**
 * Generate a cryptographically random session token (base64url, 32 bytes)
 */
export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Hash a token with SHA-256 for storage (never store plaintext tokens)
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Hash a password with argon2id
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password);
}

/**
 * Verify a password against an argon2 hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return argon2.verify(hash, password);
}
