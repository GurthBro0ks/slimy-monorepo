"use strict";

const config = require("../config");
const { hasRole } = require("../services/rbac");
const { verifySessionToken, getCookieOptions } = require("../services/token");
const logger = require("../../lib/logger");

/**
 * Log authentication-related events with proper context
 * @param {string} level - Log level (info, warn, error)
 * @param {string} message - Log message
 * @param {object} meta - Additional metadata
 * @param {object} req - Express request object
 */
function logAuth(level, message, meta = {}, req = null) {
  try {
    const logData = {
      ...meta,
      timestamp: new Date().toISOString(),
    };

    // Add request context if available (without sensitive data)
    if (req) {
      logData.ip = req.ip || req.connection?.remoteAddress;
      logData.userAgent = req.get("User-Agent");
      logData.method = req.method;
      logData.path = req.path;
      logData.requestId = req.requestId;
    }

    const logMessage = `[admin-api] auth: ${message}`;

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

function resolveUser(req) {
  if ("_cachedUser" in req) {
    return req._cachedUser;
  }

  const token = req.cookies?.[config.jwt.cookieName];
  if (!token) {
    // Info level - missing cookie is normal for unauthenticated requests
    logAuth("info", "No auth cookie present", { cookieName: config.jwt.cookieName }, req);
    req._cachedUser = null;
    return null;
  }

  try {
    const payload = verifySessionToken(token);
    const sessionUser = payload?.user || payload;
    req.session = payload?.session || payload;
    req.user = sessionUser || null;
    req._cachedUser = req.user;

    if (req.user) {
      logAuth("info", "User authenticated", {
        userId: req.user.id,
        role: req.user.role,
        username: req.user.username
      }, req);
    } else {
      logAuth("warn", "Token verified but no user payload", {}, req);
    }
    return req.user;
  } catch (err) {
    // Warn level - failed token verification is suspicious
    logAuth("warn", "Token verification failed", {
      error: err.message,
      errorType: err.name
    }, req);
    req._cachedUser = null;
    return null;
  }
}

function attachSession(req, res, next) {
  const user = resolveUser(req);
  if (!user && req.cookies?.[config.jwt.cookieName]) {
    res.clearCookie(config.jwt.cookieName, getCookieOptions());
  }
  return next();
}

function unauthorized(res, req = null, reason = "missing_token") {
  // Log auth failure with context
  logAuth("warn", "Authentication failed - 401 Unauthorized", {
    reason,
    userId: req?.user?.id || null
  }, req);

  return res.status(401).json({
    ok: false,
    code: "UNAUTHORIZED",
    message: "Authentication required",
  });
}

function forbidden(res, req = null, message = "Insufficient role") {
  // Log authorization failure with context
  logAuth("warn", "Authorization failed - 403 Forbidden", {
    reason: message,
    userId: req?.user?.id || null,
    userRole: req?.user?.role || null
  }, req);

  return res.status(403).json({
    ok: false,
    code: "FORBIDDEN",
    message,
  });
}

function requireAuth(req, res, next) {
  const user = req.user || resolveUser(req);
  if (!user) {
    return unauthorized(res, req, "missing_or_invalid_token");
  }
  return next();
}

function requireRole(minRole = "admin") {
  return (req, res, next) => {
    const user = req.user || resolveUser(req);
    if (!user) {
      return unauthorized(res, req, "missing_or_invalid_token");
    }
    if (!user.role || !hasRole(user.role, minRole)) {
      logAuth("warn", "Role requirement not met", {
        userId: user.id,
        userRole: user.role || "none",
        requiredRole: minRole
      }, req);
      return forbidden(res, req, `Requires ${minRole} role or higher`);
    }
    return next();
  };
}

function resolveGuildId(req, paramKey = "guildId") {
  return (
    req.params?.[paramKey] ||
    req.query?.[paramKey] ||
    req.body?.[paramKey] ||
    req.params?.guildId ||
    req.query?.guildId ||
    req.body?.guildId ||
    null
  );
}

function requireGuildMember(paramKey = "guildId") {
  return (req, res, next) => {
    const user = req.user || resolveUser(req);
    if (!user) {
      return unauthorized(res, req, "missing_or_invalid_token");
    }

    const guildId = resolveGuildId(req, paramKey);
    if (!guildId) {
      logAuth("warn", "Guild ID missing in request", {
        userId: user.id,
        paramKey
      }, req);
      return res.status(400).json({
        ok: false,
        code: "BAD_REQUEST",
        message: "Missing guildId parameter",
      });
    }

    if (user.role && hasRole(user.role, "admin")) {
      return next();
    }

    const guilds = user.guilds || [];
    const guild = guilds.find((entry) => entry.id === guildId);
    if (!guild) {
      logAuth("warn", "User not member of guild", {
        userId: user.id,
        guildId,
        userGuilds: guilds.map(g => g.id)
      }, req);
      return forbidden(res, req, "You are not a member of this guild");
    }

    req.guild = guild;
    return next();
  };
}

function readAuth(req, _res, next) {
  resolveUser(req);
  return next();
}

module.exports = {
  attachSession,
  requireAuth,
  requireRole,
  requireGuildMember,
  resolveUser,
  readAuth,
};
