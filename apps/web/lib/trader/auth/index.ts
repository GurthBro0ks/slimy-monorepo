/**
 * Trader Auth - Barrel Export
 *
 * Isolated authentication system for trader.slimyai.xyz
 */

// Crypto utilities
export {
  hashPassword,
  verifyPassword,
  generateToken,
  hashToken,
  generateInviteCode,
  safeCompare,
} from "./crypto";

// Session management
export {
  TRADER_SESSION_COOKIE,
  SESSION_DURATION_HOURS,
  getSessionCookieOptions,
  createTraderSession,
  validateTraderSession,
  revokeTraderSession,
  revokeAllUserSessions,
  type TraderSessionUser,
  type TraderAuthResult,
} from "./session";

// Rate limiting
export {
  checkLoginRateLimit,
  recordLoginAttempt,
  type RateLimitResult,
} from "./rate-limit";

// Invite management
export {
  createInviteCode,
  validateInviteCode,
  markInviteAsUsed,
  getInviteStats,
  type ValidateInviteResult,
  type CreateInviteOptions,
} from "./invite";
