"use strict";

const { hasRole } = require("../services/rbac");
const database = require("../lib/database");

function requireRole(minRole) {
  return (req, res, next) => {
    if (!req.user?.role || !hasRole(req.user.role, minRole)) {
      return res.status(403).json({ error: "forbidden" });
    }
    return next();
  };
}

async function requireGuildAccess(req, res, next) {
  const guildId =
    req.params?.guildId || req.body?.guildId || req.query?.guildId;

  if (!guildId) {
    console.error("[requireGuildAccess] Missing guildId parameter", {
      path: req.path,
      method: req.method,
      params: req.params,
      query: req.query,
    });
    return res.status(400).json({ error: "guildId-required" });
  }

  // Check if user is authenticated
  if (!req.user?.id) {
    console.warn("[requireGuildAccess] Unauthenticated request", {
      guildId,
      path: req.path,
      hasUser: !!req.user,
    });
    return res.status(401).json({ error: "authentication-required" });
  }

  try {
    // Query database to check if user has access to this guild
    const prisma = database.getClient();

    // Log the access attempt for debugging
    console.log(`[requireGuildAccess] Checking access for user ${req.user.id} to guild ${guildId}`);

    const user = await prisma.user.findUnique({
      where: { discordId: req.user.id },
    });

    if (!user) {
      console.warn(`[requireGuildAccess] User ${req.user.id} not found in DB`, {
        guildId,
        discordId: req.user.id,
      });
      return res.status(403).json({ error: "guild-access-denied", message: "User not found in database" });
    }

    // Check if user has a UserGuild relationship with this guild
    const userGuild = await prisma.userGuild.findUnique({
      where: {
        userId_guildId: {
          userId: user.id,
          guildId: String(guildId),
        },
      },
      include: {
        guild: true,
      },
    });

    if (!userGuild) {
      console.warn(`[requireGuildAccess] User ${user.id} (discord: ${req.user.id}) is not a member of guild ${guildId}`, {
        userId: user.id,
        discordId: req.user.id,
        guildId,
      });
      return res.status(403).json({ error: "guild-access-denied", message: "You are not a member of this guild" });
    }

    console.log(`[requireGuildAccess] Access granted for user ${user.id} to guild ${guildId}`, {
      roles: userGuild.roles,
    });

    // Attach guild info to request for downstream use
    req.guild = userGuild.guild;
    req.userRoles = userGuild.roles || [];
    return next();
  } catch (error) {
    console.error("[requireGuildAccess] Database error:", {
      error: error.message,
      stack: error.stack,
      guildId,
      userId: req.user?.id,
    });
    return res.status(500).json({ error: "internal-server-error", message: "Database error while checking access" });
  }
}

module.exports = {
  requireRole,
  requireGuildAccess,
};
