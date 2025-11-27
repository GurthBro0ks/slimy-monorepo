/**
 * Authentication configuration constants
 */

export const AUTH_COOKIE_NAME = 'slimy_admin' as const;

export const SESSION_VALIDATION_TIMEOUT = 5000; // 5 seconds

export const AUTH_ERRORS = {
  NO_COOKIE: 'No authentication cookie found',
  INVALID_SESSION: 'Invalid or expired session',
  API_UNAVAILABLE: 'Authentication service unavailable',
} as const;
