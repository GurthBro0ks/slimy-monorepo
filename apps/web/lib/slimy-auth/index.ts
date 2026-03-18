/**
 * Slimy Auth — Barrel export
 * Import from "@/lib/slimy-auth" for clean access to all auth utilities.
 */

export { generateToken, hashToken, hashPassword, verifyPassword } from "./crypto";
export {
  createSession,
  validateSession,
  revokeSession,
  getSessionCookieOptions,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
} from "./session";
export { checkLoginRateLimit, recordLoginAttempt } from "./rate-limit";
export { validateInviteCode, markInviteAsUsed, createInviteCode } from "./invite";
export { sendEmail, verificationEmailHtml, passwordResetEmailHtml } from "./email";
