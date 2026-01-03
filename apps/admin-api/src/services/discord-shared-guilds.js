"use strict";

const DISCORD_API_BASE = "https://discord.com/api/v10";
const DISCORD_TIMEOUT_MS = 8_000;

const PRIMARY_GUILD_ID = "1176605506912141444";
const ADMIN_ROLE_IDS = new Set(["1178129227321712701", "1216250443257217124"]);
const CLUB_ROLE_IDS = new Set(["1178143391884775444"]);

const ADMIN_PERMISSION = 0x8n;
const MANAGE_GUILD_PERMISSION = 0x20n;

// ----------------------------------------------------------------------------
// Discord user guild list cache (shared across endpoints)
// ----------------------------------------------------------------------------

const USER_GUILDS_TTL_MS = 120_000; // 2 minutes (conservative)
const MAX_RETRY_AFTER_MS = 10 * 60_000; // cap 10 minutes
const MIN_429_COOLDOWN_MS = 10_000; // prevent retry storms even with tiny Retry-After

// key: userDiscordId -> cache entry
const userGuildsCache = new Map();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getSlimyBotToken() {
  const explicit = String(process.env.SLIMYAI_BOT_TOKEN || "").trim();
  if (explicit) return explicit;
  return String(process.env.DISCORD_BOT_TOKEN || "").trim();
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

function getDiscordTimeoutSignal() {
  return typeof globalThis.AbortSignal?.timeout === "function"
    ? globalThis.AbortSignal.timeout(DISCORD_TIMEOUT_MS)
    : undefined;
}

function attachMeta(list, meta) {
  if (!list || typeof list !== "object") return list;

  const existing = Object.getOwnPropertyDescriptor(list, "__slimyMeta");
  if (existing && existing.writable) {
    list.__slimyMeta = meta;
    return list;
  }

  try {
    Object.defineProperty(list, "__slimyMeta", {
      value: meta,
      enumerable: false,
      writable: true,
      configurable: true,
    });
    return list;
  } catch {
    // JSON.stringify ignores non-index array props; ok if enumerable.
    try {
      list.__slimyMeta = meta;
    } catch {
      // ignore (frozen/sealed)
    }
  }
  return list;
}

function getRetryAfterMs({ res, body }) {
  const headerValue = res?.headers?.get?.("retry-after");
  const headerSeconds = headerValue ? Number(headerValue) : NaN;
  const bodySeconds =
    body && typeof body === "object" && body.retry_after !== undefined ? Number(body.retry_after) : NaN;

  const seconds = Number.isFinite(headerSeconds)
    ? headerSeconds
    : Number.isFinite(bodySeconds)
      ? bodySeconds
      : 1;

  const baseMs = Math.max(250, Math.min(MAX_RETRY_AFTER_MS, Math.round(seconds * 1000)));
  const jitterMs = Math.floor(Math.random() * 250);
  return baseMs + jitterMs;
}

function getCacheEntry(key) {
  const existing = userGuildsCache.get(key);
  if (existing) return existing;
  const entry = {
    guilds: null,
    fetchedAt: 0,
    expiresAt: 0,
    rateLimitedUntil: 0,
    inflight: null,
    lastError: null,
    lastStatus: null,
  };
  userGuildsCache.set(key, entry);
  return entry;
}

function primeUserGuildsCache(userDiscordId, guilds) {
  const key = String(userDiscordId || "").trim();
  if (!key) return;
  const list = Array.isArray(guilds) ? guilds : [];
  const now = Date.now();
  const entry = getCacheEntry(key);
  entry.guilds = list;
  entry.fetchedAt = now;
  entry.expiresAt = now + USER_GUILDS_TTL_MS;
  entry.lastError = null;
  entry.lastStatus = 200;
}

async function fetchWith429Retry(url, options, maxRetries = 3) {
  let attempt = 0;
  while (true) {
    const res = await fetch(url, {
      ...(options || {}),
      signal: options?.signal || getDiscordTimeoutSignal(),
    });
    if (res.status !== 429 || attempt >= maxRetries) return res;
    attempt += 1;
    const retryAfter = Number(res.headers?.get?.("retry-after") || "1");
    await sleep(Math.max(250, Math.min(10_000, retryAfter * 1000)));
  }
}

async function fetchUserGuildsFromDiscord(discordAccessToken) {
  const res = await fetch(`${DISCORD_API_BASE}/users/@me/guilds`, {
    headers: { Authorization: `Bearer ${discordAccessToken}` },
    signal: getDiscordTimeoutSignal(),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const err = new Error(`discord_user_guilds_failed:${res.status}`);
    err.status = res.status;
    err.code = `discord_user_guilds_failed:${res.status}`;
    if (res.status === 429) {
      err.retryAfterMs = getRetryAfterMs({ res, body });
    }
    throw err;
  }

  const guilds = await res.json();
  return Array.isArray(guilds) ? guilds : [];
}

async function fetchUserGuildsCached({ userDiscordId, discordAccessToken, force = false } = {}) {
  const key = String(userDiscordId || "").trim();
  if (!key) {
    return attachMeta(await fetchUserGuildsFromDiscord(discordAccessToken), {
      source: "discord",
      stale: false,
      discordRateLimited: false,
      retryAfterMs: null,
    });
  }

  const entry = getCacheEntry(key);
  const now = Date.now();
  const hasCache = Array.isArray(entry.guilds);

  if (!force) {
    if (hasCache && now < entry.expiresAt) {
      return attachMeta(entry.guilds, {
        source: "cache",
        stale: false,
        discordRateLimited: now < entry.rateLimitedUntil,
        retryAfterMs: now < entry.rateLimitedUntil ? entry.rateLimitedUntil - now : null,
      });
    }

    if (now < entry.rateLimitedUntil) {
      if (hasCache) {
        return attachMeta(entry.guilds, {
          source: "cache",
          stale: true,
          discordRateLimited: true,
          retryAfterMs: entry.rateLimitedUntil - now,
        });
      }

      const err = new Error("discord_rate_limited");
      err.status = 429;
      err.code = "discord_rate_limited";
      err.retryAfterMs = entry.rateLimitedUntil - now;
      throw err;
    }
  }

  if (entry.inflight) return entry.inflight;

  entry.inflight = (async () => {
    try {
      const guilds = await fetchUserGuildsFromDiscord(discordAccessToken);
      entry.guilds = guilds;
      entry.fetchedAt = now;
      entry.expiresAt = now + USER_GUILDS_TTL_MS;
      entry.lastError = null;
      entry.lastStatus = 200;
      return attachMeta(guilds, {
        source: "discord",
        stale: false,
        discordRateLimited: false,
        retryAfterMs: null,
      });
    } catch (err) {
      const status = Number(err?.status) || 0;
      entry.lastError = err?.code || err?.message || "error";
      entry.lastStatus = status || null;

      if (status === 429) {
        const retryAfterMs = Math.max(MIN_429_COOLDOWN_MS, Number(err?.retryAfterMs) || 1000);
        entry.rateLimitedUntil = Math.max(entry.rateLimitedUntil || 0, now + retryAfterMs);

        if (hasCache) {
          return attachMeta(entry.guilds, {
            source: "cache",
            stale: true,
            discordRateLimited: true,
            retryAfterMs: entry.rateLimitedUntil - now,
          });
        }
      }

      throw err;
    } finally {
      entry.inflight = null;
    }
  })();

  return entry.inflight;
}

async function botInstalledInGuild(guildId, botToken) {
  // Do not retry for guild-list calls; keep responses fast and avoid hanging on rate limits.
  const res = await fetchWith429Retry(
    `${DISCORD_API_BASE}/guilds/${guildId}`,
    { headers: { Authorization: `Bot ${botToken}` }, signal: getDiscordTimeoutSignal() },
    0,
  );

  if (res.ok) return true;
  if (res.status === 404 || res.status === 403) return false;
  if (res.status === 429) return false;
  return false;
}

async function fetchMemberRoles(guildId, userDiscordId, botToken) {
  const res = await fetchWith429Retry(
    `${DISCORD_API_BASE}/guilds/${guildId}/members/${userDiscordId}`,
    { headers: { Authorization: `Bot ${botToken}` }, signal: getDiscordTimeoutSignal() },
    1,
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

  const userGuilds = await fetchUserGuildsCached({ userDiscordId, discordAccessToken });
  const userGuildsMeta = userGuilds?.__slimyMeta || null;
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

  return attachMeta(out, userGuildsMeta);
}

function normalizeGuildEntryWithBotStatus(guild, botInstalled) {
  const isPrimary = String(guild.id) === PRIMARY_GUILD_ID;
  const isAdmin = Boolean(guild.owner) || hasAdminOrManagePermission(guild.permissions);
  return {
    id: String(guild.id),
    name: guild.name,
    icon: guild.icon ?? null,
    botInstalled,
    manageable: isAdmin, // User can manage/invite based on Discord permissions
    connectable: botInstalled, // Backward compat: true only if bot installed
    isPrimary,
    roleLabel: isAdmin ? "admin" : "member",
    roleSource: "permissions",
    role: isAdmin ? "admin" : "member",
    installed: botInstalled,
    botInGuild: botInstalled,
  };
}

async function getAllUserGuildsWithBotStatus({
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

  const userGuilds = await fetchUserGuildsCached({ userDiscordId, discordAccessToken });
  const userGuildsMeta = userGuilds?.__slimyMeta || null;
  const limit = createLimiter(Math.max(1, Math.min(8, Number(concurrency) || 4)));

  const results = await Promise.all(
    userGuilds.map((g) =>
      limit(async () => {
        const isManageable = Boolean(g?.owner) || hasAdminOrManagePermission(g?.permissions);
        const shouldCheckBot = isManageable || String(g?.id) === PRIMARY_GUILD_ID;
        const botInstalled = shouldCheckBot ? await botInstalledInGuild(g.id, botToken) : false;
        return normalizeGuildEntryWithBotStatus(g, botInstalled);
      }),
    ),
  );

  return attachMeta(results, userGuildsMeta);
}

module.exports = {
  PRIMARY_GUILD_ID,
  ADMIN_ROLE_IDS,
  CLUB_ROLE_IDS,
  getSlimyBotToken,
  botInstalledInGuild,
  getSharedGuildsForUser,
  getAllUserGuildsWithBotStatus,
  computeRoleLabelFromRoles,
  fetchMemberRoles,
  primeUserGuildsCache,
};
