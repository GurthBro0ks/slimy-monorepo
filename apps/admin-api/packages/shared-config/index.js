/**
 * Shared configuration utilities and constants
 * This package provides common config functions used across the monorepo
 */

module.exports = {
  // Environment configuration
  getEnv: (key, defaultValue) => process.env[key] || defaultValue,

  // Common constants
  CONSTANTS: {
    DEFAULT_TIMEOUT: 30000,
    MAX_RETRY_ATTEMPTS: 3,
    SESSION_EXPIRY: 24 * 60 * 60 * 1000 // 24 hours
  },

  version: '1.0.0'
};
