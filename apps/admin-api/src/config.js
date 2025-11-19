/**
 * Configuration Export - Bridge to Typed Config
 *
 * This file maintains backward compatibility with existing imports
 * while using the new type-safe configuration system.
 *
 * Usage:
 *   const config = require('./config');
 *   const port = config.server.port;
 */

"use strict";

// Export the type-safe config from lib/config
module.exports = require('./lib/config');
