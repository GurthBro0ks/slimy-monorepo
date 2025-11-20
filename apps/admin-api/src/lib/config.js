/**
 * Main configuration export - uses the type-safe config module
 *
 * This file serves as the primary configuration export for the admin-api.
 * It wraps the TypeScript-based typed-config module and provides it to
 * the rest of the application.
 *
 * Usage:
 *   const config = require('./lib/config');
 *   const port = config.server.port;
 */

"use strict";

// Import the compiled TypeScript config
const { config, getConfigSummary } = require('../../dist/lib/config/typed-config');

// Export the validated config as the default export
module.exports = config;

// Also export the summary function for debugging
module.exports.getConfigSummary = getConfigSummary;
