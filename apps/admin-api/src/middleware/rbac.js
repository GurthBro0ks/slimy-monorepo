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
    return res.status(400).json({ error: "guildId-required" });
  }

  // Check if user is authenticated
  if (!req.user?.id) {
    return res.status(401).json({ error: "authentication-required" });
  }

  try {
    // Query database to check if user has access to this guild
    // First, find the user by their Discord ID to get the database UUID
    const prisma = database.getClient();
    const user = await prisma.user.findUnique({
      where: { discordId: req.user.id },
    });

    if (!user) {
      return res.status(403).json({ error: "guild-access-denied" });
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
      return res.status(403).json({ error: "guild-access-denied" });
    }

    // Attach guild info to request for downstream use
    req.guild = userGuild.guild;
    req.userRoles = userGuild.roles || [];
    return next();
  } catch (error) {
    console.error("[requireGuildAccess] Database error:", error);
    return res.status(500).json({ error: "internal-server-error" });
  }
}

module.exports = {
  requireRole,
  requireGuildAccess,
};
