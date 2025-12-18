"use strict";

const DISCORD_API_BASE = "https://discord.com/api/v10";

const PRIMARY_GUILD_ID = "1176605506912141444";
const ADMIN_ROLE_IDS = new Set(["1178129227321712701", "1216250443257217124"]);
const CLUB_ROLE_IDS = new Set(["1178143391884775444"]);

const ADMIN_PERMISSION = 0x8n;
const MANAGE_GUILD_PERMISSION = 0x20n;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getSlimyBotToken() {
  return String(process.env.SLIMYAI_BOT_TOKEN || "").trim();
}

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

function createLimiter(concurrency) {
  let active = 0;
  const queue = [];

  const next = () => {
    active -= 1;
    const run = queue.shift();
    if (run) run();
  };

  return (fn) =>
    new Promise((resolve, reject) => {
      const run = () => {
        active += 1;
        Promise.resolve()
          .then(fn)
          .then(resolve, reject)
          .finally(next);
      };

      if (active < concurrency) run();
      else queue.push(run);
    });
}

async function fetchWith429Retry(url, options, maxRetries = 3) {
  let attempt = 0;
  while (true) {
    const res = await fetch(url, options);
    if (res.status !== 429 || attempt >= maxRetries) return res;
    attempt += 1;
    const retryAfter = Number(res.headers?.get?.("retry-after") || "1");
    await sleep(Math.max(250, Math.min(10_000, retryAfter * 1000)));
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

async function botInstalledInGuild(guildId, botToken) {
  const res = await fetchWith429Retry(`${DISCORD_API_BASE}/guilds/${guildId}`, {
    headers: { Authorization: `Bot ${botToken}` },
  });

  if (res.ok) return true;
  if (res.status === 404 || res.status === 403) return false;
  if (res.status === 429) return false;
  return false;
}

async function fetchMemberRoles(guildId, userDiscordId, botToken) {
  const res = await fetchWith429Retry(
    `${DISCORD_API_BASE}/guilds/${guildId}/members/${userDiscordId}`,
    { headers: { Authorization: `Bot ${botToken}` } },
  );

  if (!res.ok) return null;
  const member = await res.json().catch(() => null);
  const roles = member?.roles;
  return Array.isArray(roles) ? roles.map(String) : [];
}

function computeRoleLabelFromRoles(roleIds) {
  const roles = new Set((roleIds || []).map(String));
  const isAdmin = [...ADMIN_ROLE_IDS].some((id) => roles.has(String(id)));
  if (isAdmin) return "admin";
  const isClub = [...CLUB_ROLE_IDS].some((id) => roles.has(String(id)));
  if (isClub) return "club";
  return "member";
}

function normalizeGuildEntry(guild, roleLabel, roleSource) {
  const isPrimary = String(guild.id) === PRIMARY_GUILD_ID;
  return {
    id: String(guild.id),
    name: guild.name,
    icon: guild.icon ?? null,
    botInstalled: true,
    connectable: true,
    isPrimary,
    roleLabel,
    roleSource,
    role: roleLabel, // backwards compat (admin-ui)
    installed: true, // backwards compat (admin-ui)
    botInGuild: true, // backwards compat (web)
  };
}

async function getSharedGuildsForUser({
  discordAccessToken,
  userDiscordId,
  concurrency = 4,
} = {}) {
  const botToken = getSlimyBotToken();
  if (!botToken) {
    const err = new Error("MISSING_SLIMYAI_BOT_TOKEN");
    err.code = "MISSING_SLIMYAI_BOT_TOKEN";
    throw err;
  }
  if (!discordAccessToken) {
    const err = new Error("missing_discord_token");
    err.code = "missing_discord_token";
    throw err;
  }
  if (!userDiscordId) {
    const err = new Error("missing_user_discord_id");
    err.code = "missing_user_discord_id";
    throw err;
  }

  const userGuilds = await fetchUserGuilds(discordAccessToken);
  const limit = createLimiter(Math.max(1, Math.min(8, Number(concurrency) || 4)));

  const checks = await Promise.all(
    userGuilds.map((g) =>
      limit(async () => ({
        guild: g,
        shared: await botInstalledInGuild(g.id, botToken),
      })),
    ),
  );

  const sharedGuilds = checks.filter((x) => x.shared).map((x) => x.guild);
  const out = [];

  for (const guild of sharedGuilds) {
    const isPrimary = String(guild.id) === PRIMARY_GUILD_ID;
    if (!isPrimary) {
      out.push(normalizeGuildEntry(guild, "member", "default"));
      continue;
    }

    const roles = await fetchMemberRoles(PRIMARY_GUILD_ID, String(userDiscordId), botToken);
    if (roles) {
      const roleLabel = computeRoleLabelFromRoles(roles);
      out.push(normalizeGuildEntry(guild, roleLabel, "roles"));
      continue;
    }

    const fallbackAdmin =
      Boolean(guild.owner) || hasAdminOrManagePermission(guild.permissions);
    out.push(
      normalizeGuildEntry(guild, fallbackAdmin ? "admin" : "member", "permissions"),
    );
  }

  return out;
}

module.exports = {
  PRIMARY_GUILD_ID,
  getSlimyBotToken,
  botInstalledInGuild,
  getSharedGuildsForUser,
};

