"use strict";

const fs = require("fs");
const path = require("path");

const dotenv = require("dotenv");

const database = require("../lib/database");
const { applyDatabaseUrl } = require("./src/utils/apply-db-url");
const { logger } = require("./src/lib/logger");

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
    logger.info({ env: process.env.NODE_ENV }, "[admin-api] Booting in non-production mode");
  }

  if (!database.isConfigured()) {
    logger.warn("[admin-api] Database not configured; admin API will be read-only");
  } else {
    await database.initialize();
  }

  const app = require("./src/app");
  const port = Number(process.env.PORT || process.env.ADMIN_API_PORT || 3080);
  const host = process.env.HOST || process.env.ADMIN_API_HOST || "127.0.0.1";

  const server = app.listen(port, host, () => {
    logger.info({ port, host }, `[admin-api] Listening on http://${host}:${port}`);
  });

  process.on("SIGINT", () => {
    logger.info("[admin-api] Caught SIGINT, shutting down");
    server.close(() => {
      database.close().finally(() => process.exit(0));
    });
  });

  process.on("unhandledRejection", (err) => {
    logger.error({ error: err }, "[admin-api] Unhandled rejection");
  });
}

start().catch((err) => {
  logger.error({ error: err }, "[admin-api] Failed to start");
  console.error(err);
  process.exit(1);
});
