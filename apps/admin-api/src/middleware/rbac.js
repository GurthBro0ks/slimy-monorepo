"use strict";

const { hasRole } = require("../services/rbac");
const logger = require("../../lib/logger");

/**
 * Log RBAC-related events with proper context
 */
function logRbac(level, message, meta = {}, req = null) {
  try {
    const logData = {
      ...meta,
      timestamp: new Date().toISOString(),
    };

    // Add request context if available
    if (req) {
      logData.ip = req.ip || req.connection?.remoteAddress;
      logData.userAgent = req.get("User-Agent");
      logData.method = req.method;
      logData.path = req.path;
      logData.requestId = req.requestId;
      logData.userId = req.user?.id || null;
      logData.userRole = req.user?.role || null;
    }

    const logMessage = `[admin-api] rbac: ${message}`;

    if (level === "error") {
      logger.error(logMessage, logData);
    } else if (level === "warn") {
      logger.warn(logMessage, logData);
    } else {
      logger.info(logMessage, logData);
    }
  } catch {
    /* ignore logging failures to prevent blocking requests */
  }
}

function requireRole(minRole) {
  return (req, res, next) => {
    if (!req.user?.role || !hasRole(req.user.role, minRole)) {
      logRbac("warn", "Role requirement not met", {
        userRole: req.user?.role || "none",
        requiredRole: minRole
      }, req);
      return res.status(403).json({ error: "forbidden" });
    }
    return next();
  };
}

function requireGuildAccess(req, res, next) {
  const guildId =
    req.params?.guildId || req.body?.guildId || req.query?.guildId;

  if (!guildId) {
    logRbac("warn", "Guild ID missing in request", {}, req);
    return res.status(400).json({ error: "guildId-required" });
  }

  const guild = req.user?.guilds?.find((entry) => entry.id === guildId);
  if (!guild) {
    logRbac("warn", "Guild access denied", {
      guildId,
      userGuilds: req.user?.guilds?.map(g => g.id) || []
    }, req);
    return res.status(403).json({ error: "guild-access-denied" });
  }

  req.guild = guild;
  return next();
}

module.exports = {
  requireRole,
  requireGuildAccess,
};
