"use strict";

const prismaDatabase = require("../lib/database");
const {
  PRIMARY_GUILD_ID,
  ADMIN_ROLE_IDS,
  botInstalledInGuild,
  fetchMemberRoles,
  getSlimyBotToken,
} = require("./discord-shared-guilds");

const DISCORD_API_BASE = "https://discord.com/api/v10";

const ADMIN_PERMISSION = 0x8n;
const MANAGE_GUILD_PERMISSION = 0x20n;

function hasAdminOrManagePermission(permissions) {
  if (permissions === undefined || permissions === null) return false;
  try {
    const permsBigInt = BigInt(permissions);
    const isAdmin = (permsBigInt & ADMIN_PERMISSION) === ADMIN_PERMISSION;
    const canManage = (permsBigInt & MANAGE_GUILD_PERMISSION) === MANAGE_GUILD_PERMISSION;
    return isAdmin || canManage;
  } catch {
    return false;
  }
}

async function fetchUserGuilds(discordAccessToken) {
  const res = await fetch(`${DISCORD_API_BASE}/users/@me/guilds`, {
    headers: { Authorization: `Bearer ${discordAccessToken}` },
  });
  if (!res.ok) {
    const err = new Error(`discord_user_guilds_failed:${res.status}`);
    err.status = res.status;
    throw err;
  }
  const guilds = await res.json();
  return Array.isArray(guilds) ? guilds : [];
}

function canManageByPrimaryRoles(roleIds) {
  const roles = new Set((roleIds || []).map(String));
  return [...ADMIN_ROLE_IDS].some((id) => roles.has(String(id)));
}

function resolveCallerDiscordId(req) {
  const raw = req.user?.user || req.user || null;
  const id = raw?.discordId || raw?.id || raw?.sub || null;
  return id ? String(id) : null;
}

function isPlatformAdmin(req) {
  return req.user?.role === "admin" || req.user?.role === "owner";
}

async function requireGuildSettingsAdmin(req, guildIdRaw) {
  const guildId = String(guildIdRaw || "").trim();
  const userDiscordId = resolveCallerDiscordId(req);
  if (!guildId || !userDiscordId) {
    return { ok: false, status: 401, error: "unauthorized" };
  }

  if (isPlatformAdmin(req)) {
    return { ok: true, roleSource: "platform_admin" };
  }

  if (req.user?.authType === "internal_bot") {
    const ctx = req.user?.interaction || {};
    const ctxGuildId = ctx.guildId ? String(ctx.guildId).trim() : "";
    const ctxPerms = ctx.permissions ? String(ctx.permissions).trim() : "";

    if (!ctxGuildId || ctxGuildId !== guildId) {
      return { ok: false, status: 403, error: "missing_interaction_context" };
    }

    return hasAdminOrManagePermission(ctxPerms)
      ? { ok: true, roleSource: "interaction_permissions" }
      : { ok: false, status: 403, error: "forbidden" };
  }

  const botToken = getSlimyBotToken();
  if (!botToken) {
    return { ok: false, status: 500, error: "MISSING_SLIMYAI_BOT_TOKEN" };
  }

  const botInGuild = await botInstalledInGuild(guildId, botToken);
  if (!botInGuild) {
    return { ok: false, status: 403, error: "BOT_NOT_IN_GUILD" };
  }

  await prismaDatabase.initialize();
  const userRecord = await prismaDatabase.findUserByDiscordId(userDiscordId);
  if (!userRecord) {
    return { ok: false, status: 404, error: "user_not_found" };
  }
  if (!userRecord.discordAccessToken) {
    return { ok: false, status: 400, error: "missing_discord_token" };
  }

  if (guildId === PRIMARY_GUILD_ID) {
    const roles = await fetchMemberRoles(PRIMARY_GUILD_ID, userDiscordId, botToken);
    if (roles) {
      return canManageByPrimaryRoles(roles)
        ? { ok: true, roleSource: "roles" }
        : { ok: false, status: 403, error: "forbidden" };
    }
  }

  const guilds = await fetchUserGuilds(userRecord.discordAccessToken);
  const g = guilds.find((entry) => String(entry?.id) === guildId);
  if (!g) {
    return { ok: false, status: 403, error: "USER_NOT_IN_GUILD" };
  }
  const allowed = Boolean(g.owner) || hasAdminOrManagePermission(g.permissions);
  return allowed
    ? { ok: true, roleSource: "permissions" }
    : { ok: false, status: 403, error: "forbidden" };
}

module.exports = {
  isPlatformAdmin,
  resolveCallerDiscordId,
  requireGuildSettingsAdmin,
};
