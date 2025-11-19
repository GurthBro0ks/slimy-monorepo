"use strict";

const { hasRole } = require("../services/rbac");
const { AuthorizationError, BadRequestError } = require("../lib/errors");

function requireRole(minRole) {
  return (req, res, next) => {
    if (!req.user?.role || !hasRole(req.user.role, minRole)) {
      return next(new AuthorizationError("Insufficient permissions"));
    }
    return next();
  };
}

function requireGuildAccess(req, res, next) {
  const guildId =
    req.params?.guildId || req.body?.guildId || req.query?.guildId;

  if (!guildId) {
    return next(new BadRequestError("Guild ID is required"));
  }

  const guild = req.user?.guilds?.find((entry) => entry.id === guildId);
  if (!guild) {
    return next(new AuthorizationError("Access denied to this guild"));
  }

  req.guild = guild;
  return next();
}

module.exports = {
  requireRole,
  requireGuildAccess,
};
