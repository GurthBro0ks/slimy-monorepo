"use strict";

const { logger, isDebug, logDebug } = require("../lib/logger");

/**
 * Discord Bot Entry Point
 * Demonstrates safe debug mode initialization
 */

async function main() {
  logger.info({
    nodeEnv: process.env.NODE_ENV,
    debugMode: isDebug(),
  }, "Starting Discord bot");

  // Debug: Log startup configuration (with secrets redacted)
  if (isDebug()) {
    logDebug(logger, {
      env: {
        NODE_ENV: process.env.NODE_ENV,
        DEBUG_MODE: process.env.DEBUG_MODE,
        LOG_LEVEL: process.env.LOG_LEVEL,
        BOT_SERVICE_NAME: process.env.BOT_SERVICE_NAME,
        // Never log the actual token, even in debug mode
        hasBotToken: !!process.env.DISCORD_BOT_TOKEN,
      },
      process: {
        nodeVersion: process.version,
        platform: process.platform,
        pid: process.pid,
      },
    }, "[DEBUG] Bot startup configuration");
  }

  // TODO: Initialize Discord client and command handlers
  logger.info("Bot initialization complete (placeholder)");
}

// Handle errors
process.on("unhandledRejection", (error) => {
  logger.error({
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
  }, "Unhandled promise rejection");

  if (isDebug()) {
    logDebug(logger, {
      errorType: error.constructor.name,
      cause: error.cause,
    }, "[DEBUG] Unhandled rejection details");
  }

  process.exit(1);
});

process.on("uncaughtException", (error) => {
  logger.error({
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
  }, "Uncaught exception");

  if (isDebug()) {
    logDebug(logger, {
      errorType: error.constructor.name,
      cause: error.cause,
    }, "[DEBUG] Uncaught exception details");
  }

  process.exit(1);
});

// Start the bot
if (require.main === module) {
  main().catch((error) => {
    logger.error({
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    }, "Bot startup failed");
    process.exit(1);
  });
}

module.exports = { main };
