"use strict";

/**
 * Configuration Module - Type-Safe Wrapper
 *
 * This module now wraps the TypeScript-based typed-config module,
 * providing the same interface but with full type safety and Zod validation.
 *
 * Migration: This file replaces the old manual validation with a Zod-based
 * type-safe configuration system. The old implementation has been backed up
 * to index.js.backup for reference.
 *
 * Usage:
 *   const config = require('./lib/config');
 *   const clientId = config.discord.clientId;
 */

// Import the compiled TypeScript config
const { config, getConfigSummary } = require('../../../dist/lib/config/typed-config');

// Export the validated config
module.exports = config;

// Also export the summary function for debugging
module.exports.getConfigSummary = getConfigSummary;

