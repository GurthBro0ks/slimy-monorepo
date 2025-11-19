"use strict";

const pino = require("pino");

const isDevelopment = process.env.NODE_ENV === "development";
const logLevel = process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info");

/**
 * Check if debug mode is enabled
 * Returns true if:
 * - NODE_ENV is 'development', OR
 * - DEBUG_MODE environment variable is set to 'true'
 *
 * This allows verbose logging in dev/staging without affecting production
 */
function isDebug() {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.DEBUG_MODE === "true"
  );
}

// Base logger configuration
const baseConfig = {
  level: logLevel,
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
    log: (obj) => {
      // Add service context to all logs
      return {
        ...obj,
        service: process.env.BOT_SERVICE_NAME || "slimy-discord-bot",
        version: process.env.BOT_VERSION || "dev",
        env: process.env.NODE_ENV || "development",
        hostname: require("os").hostname(),
        pid: process.pid,
      };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  // Add serializers for common objects
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
  },
};

// Development logger with pretty printing
const devConfig = {
  ...baseConfig,
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "HH:MM:ss.l",
      ignore: "pid,hostname,service,version,env",
      messageFormat: "{service} {level} {msg}",
    },
  },
};

// Production logger with JSON output for monitoring platforms
const prodConfig = {
  ...baseConfig,
  // Ensure JSON format for production monitoring
  formatters: {
    ...baseConfig.formatters,
    // Add additional structured fields for monitoring
    log: (obj) => {
      const base = baseConfig.formatters.log(obj);

      // Add monitoring-specific fields
      if (obj.interactionId) {
        base.dd = {
          trace_id: obj.interactionId,
          span_id: obj.interactionId,
        };
      }

      return base;
    },
  },
};

// Create logger based on environment
const logger = pino(isDevelopment ? devConfig : prodConfig);

/**
 * Create a child logger with context
 */
function createLogger(context = {}) {
  return logger.child(context);
}

/**
 * Safely redact sensitive fields from an object for logging
 * This prevents secrets/tokens from appearing in debug logs
 */
function redactSecrets(obj) {
  if (!obj || typeof obj !== "object") {
    return obj;
  }

  const sensitiveKeys = [
    "password",
    "token",
    "secret",
    "apiKey",
    "api_key",
    "authorization",
    "cookie",
    "sessionId",
    "session_id",
    "accessToken",
    "access_token",
    "refreshToken",
    "refresh_token",
    "privateKey",
    "private_key",
    "bot_token",
    "botToken",
  ];

  const redacted = Array.isArray(obj) ? [...obj] : { ...obj };

  for (const [key, value] of Object.entries(redacted)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveKeys.some((sensitive) =>
      lowerKey.includes(sensitive.toLowerCase())
    );

    if (isSensitive) {
      redacted[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      redacted[key] = redactSecrets(value);
    }
  }

  return redacted;
}

/**
 * Log debug information only when debug mode is enabled
 * Automatically redacts sensitive fields
 */
function logDebug(logger, data, message) {
  if (!isDebug()) {
    return;
  }

  const safeData = redactSecrets(data);
  logger.debug(safeData, message);
}

/**
 * Log command execution with timing
 */
function logCommandExecution(logger, commandName, userId, guildId, startTime) {
  const duration = Date.now() - startTime;

  const baseData = {
    command: commandName,
    userId,
    guildId,
    duration,
  };

  logger.info(baseData, "Command executed");

  // Enhanced debug logging for command execution
  if (isDebug()) {
    const debugData = {
      ...baseData,
      timing: {
        total: duration,
        perSecond: duration > 0 ? (1000 / duration).toFixed(2) : "N/A",
      },
    };
    logDebug(logger, debugData, "[DEBUG] Command execution details");
  }
}

module.exports = {
  logger,
  createLogger,
  isDebug,
  logDebug,
  redactSecrets,
  logCommandExecution,
};
