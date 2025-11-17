"use strict";

const fs = require("fs");
const path = require("path");

const dotenv = require("dotenv");

const database = require("../lib/database");
const { applyDatabaseUrl } = require("./src/utils/apply-db-url");
const logger = require("../lib/logger");

function loadEnv() {
  const explicitEnvPath =
    process.env.ADMIN_ENV_FILE || process.env.ENV_FILE || null;
  if (explicitEnvPath && fs.existsSync(explicitEnvPath)) {
    dotenv.config({ path: explicitEnvPath });
  }

  const envPath = path.join(process.cwd(), ".env.admin");
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }

  // Allow fallback to default .env for shared values
  const defaultEnvPath = path.join(process.cwd(), ".env");
  if (fs.existsSync(defaultEnvPath)) {
    dotenv.config({ path: defaultEnvPath });
  }
}

async function start() {
  loadEnv();
  applyDatabaseUrl(process.env.DB_URL);

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET must be set in .env.admin for admin-api");
  }

  if (process.env.NODE_ENV !== "production") {
    logger.info("[admin-api] Booting in non-production mode");
  }

  if (!database.isConfigured()) {
    logger.warn("[admin-api] Database not configured; admin API will be read-only");
  } else {
    await database.initialize();
  }

  // Initialize queue infrastructure if Redis is configured
  if (process.env.REDIS_URL) {
    logger.info("[admin-api] Initializing queue infrastructure...");
    const { queueManager } = require("./src/lib/queues");
    const queueInitialized = await queueManager.initialize();
    if (queueInitialized) {
      logger.info("[admin-api] Queue infrastructure ready (screenshot analysis, chat, database, audit)");
    } else {
      logger.warn("[admin-api] Queue infrastructure failed to initialize; background jobs will be disabled");
    }
  } else {
    logger.info("[admin-api] REDIS_URL not configured; background job queues disabled (using synchronous processing)");
  }

  const app = require("./src/app");
  const port = Number(process.env.PORT || process.env.ADMIN_API_PORT || 3080);
  const host = process.env.HOST || process.env.ADMIN_API_HOST || "127.0.0.1";

  const server = app.listen(port, host, () => {
    logger.info(`[admin-api] Listening on http://${host}:${port}`);
  });

  // Graceful shutdown handler
  const shutdown = async () => {
    logger.info("[admin-api] Caught SIGINT, shutting down gracefully");

    server.close(async () => {
      // Close queue infrastructure if initialized
      if (process.env.REDIS_URL) {
        try {
          const { queueManager } = require("./src/lib/queues");
          if (queueManager.isInitialized) {
            logger.info("[admin-api] Closing queue infrastructure...");
            await queueManager.close();
          }
        } catch (err) {
          logger.error("[admin-api] Error closing queue infrastructure", { err: err?.message || err });
        }
      }

      // Close database connection
      await database.close();

      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  process.on("unhandledRejection", (err) => {
    logger.error("[admin-api] Unhandled rejection", { err: err?.message || err });
  });
}

start().catch((err) => {
  logger.error("[admin-api] Failed to start", { err: err?.message || err });
  console.error(err);
  process.exit(1);
});
