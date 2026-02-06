/**
 * Trader Auth TOTP Utilities
 *
 * Implements HMAC-based One-Time Password (HOTP/TOTP) per RFC 6238.
 * Uses only Node.js crypto — no external TOTP library needed.
 */

import { createHmac, randomBytes } from "crypto";

const TOTP_PERIOD = 30; // seconds
const TOTP_DIGITS = 6;
const TOTP_ALGORITHM = "sha1";

/**
 * Generate a random TOTP secret (base32 encoded, 20 bytes)
 */
export function generateTotpSecret(): string {
  const raw = randomBytes(20);
  return base32Encode(raw);
}

/**
 * Build an otpauth:// URI for QR code generation.
 *
 * @param secret  Base32-encoded secret
 * @param username  Account identifier
 * @param issuer  Application name
 */
export function buildTotpUri(
  secret: string,
  username: string,
  issuer: string = "SlimyTrader"
): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedUser = encodeURIComponent(username);
  return `otpauth://totp/${encodedIssuer}:${encodedUser}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD}`;
}

/**
 * Verify a TOTP code against a secret.
 * Accepts codes from the current window and +/- 1 window for clock skew.
 *
 * @param token  The 6-digit code to verify
 * @param secret Base32-encoded secret
 * @returns true if the code is valid within the window
 */
export function verifyTotp(token: string, secret: string): boolean {
  if (!token || token.length !== TOTP_DIGITS) return false;

  const secretBuffer = base32Decode(secret);
  const now = Math.floor(Date.now() / 1000);

  // Check current window and +/- 1 for clock skew
  for (let offset = -1; offset <= 1; offset++) {
    const counter = Math.floor((now + offset * TOTP_PERIOD) / TOTP_PERIOD);
    const expected = generateHotp(secretBuffer, counter);
    if (expected === token) return true;
  }

  return false;
}

/**
 * Generate a HOTP code for a given counter value.
 */
function generateHotp(secret: Buffer, counter: number): string {
  // Convert counter to 8-byte big-endian buffer
  const counterBuffer = Buffer.alloc(8);
  for (let i = 7; i >= 0; i--) {
    counterBuffer[i] = counter & 0xff;
    counter = counter >> 8;
  }

  const hmac = createHmac(TOTP_ALGORITHM, secret);
  hmac.update(counterBuffer);
  const hash = hmac.digest();

  // Dynamic truncation per RFC 4226
  const offset = hash[hash.length - 1] & 0x0f;
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);

  const otp = binary % Math.pow(10, TOTP_DIGITS);
  return otp.toString().padStart(TOTP_DIGITS, "0");
}

// ---------------------------------------------------------------------------
// Base32 encoding/decoding (RFC 4648)
// ---------------------------------------------------------------------------

const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(buffer: Buffer): string {
  let result = "";
  let bits = 0;
  let value = 0;

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      result += BASE32_CHARS[(value >>> (bits - 5)) & 0x1f];
      bits -= 5;
    }
  }

  if (bits > 0) {
    result += BASE32_CHARS[(value << (5 - bits)) & 0x1f];
  }

  return result;
}

function base32Decode(encoded: string): Buffer {
  const cleaned = encoded.toUpperCase().replace(/=+$/, "");
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;

  for (const char of cleaned) {
    const idx = BASE32_CHARS.indexOf(char);
    if (idx === -1) continue;

    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}
