"use strict";
const express = require("express");
const config = require("../config");
const prismaDatabase = require("../lib/database");
const { signSession, setAuthCookie, clearAuthCookie } = require("../lib/jwt");
const { getCookieOptions } = require("../services/token");
const { defaultUserSettings } = require("../services/central-settings");
const { resolvePostLoginRedirectUrl } = require("../lib/auth/post-login-redirect");
const {
  PRIMARY_GUILD_ID,
  computeRoleLabelFromRoles,
  fetchMemberRoles,
  getSlimyBotToken,
  botInstalledInGuild,
} = require("../services/discord-shared-guilds");
const router = express.Router();

// Cookie name for active guild
const ACTIVE_GUILD_COOKIE_NAME = "slimy_admin_active_guild_id";

console.log("!!! AUTH LOGIC LOADED v304 (ACTIVE GUILD) !!!");

// Canonical admin-ui endpoints for Discord OAuth.
// These ensure we never generate authorize URLs with localhost:3080 or /api/admin-api redirect_uris.
const CANONICAL_ADMIN_ORIGIN = "https://admin.slimyai.xyz";
const CANONICAL_AUTHORIZE_URL = `${CANONICAL_ADMIN_ORIGIN}/api/auth/discord/authorize-url`;
const CANONICAL_CALLBACK_URL = `${CANONICAL_ADMIN_ORIGIN}/api/auth/callback`;

const DISCORD = {
  API: "https://discord.com/api/v10",
  TOKEN_URL: "https://discord.com/api/oauth2/token",
  AUTH_URL: "https://discord.com/oauth2/authorize",
};

const DISCORD_PERMISSIONS = {
  ADMINISTRATOR: 0x8n,
  MANAGE_GUILD: 0x20n,
  MANAGE_CHANNELS: 0x10n,
  MANAGE_ROLES: 0x10000000n,
};

const CANONICAL_ADMIN_HOSTNAME = (() => {
  try {
    return new URL(CANONICAL_ADMIN_ORIGIN).hostname;
  } catch {
    return "admin.slimyai.xyz";
  }
})();

function parsePermissions(value) {
  try {
    return BigInt(value);
  } catch {
    return 0n;
  }
}

function hasPermission(perms, bit) {
  return (perms & bit) === bit;
}

function deriveMembershipRolesFromGuild(guild) {
  const perms = parsePermissions(guild?.permissions);
  const roles = new Set(["member"]);

  if (guild?.owner) {
    roles.add("owner");
    roles.add("admin");
  }

  if (
    hasPermission(perms, DISCORD_PERMISSIONS.ADMINISTRATOR) ||
    hasPermission(perms, DISCORD_PERMISSIONS.MANAGE_GUILD)
  ) {
    roles.add("admin");
  }

  if (
    hasPermission(perms, DISCORD_PERMISSIONS.MANAGE_CHANNELS) ||
    hasPermission(perms, DISCORD_PERMISSIONS.MANAGE_ROLES)
  ) {
    roles.add("editor");
  }

  return Array.from(roles);
}

async function fetchMemberRoleIdsWithBotToken(guildId, userId) {
  const BOT_TOKEN = String(process.env.DISCORD_BOT_TOKEN || "").trim();
  if (!BOT_TOKEN) return [];
  if (!guildId || !userId) return [];

  const url = `${DISCORD.API}/guilds/${encodeURIComponent(String(guildId))}/members/${encodeURIComponent(String(userId))}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bot ${BOT_TOKEN}`,
    },
  });

  if (!res.ok) {
    if (shouldDebugAuth()) {
      const body = await res.text().catch(() => "");
      console.warn("[auth/callback] Failed to fetch member roles via bot token", {
        guildId: String(guildId),
        userId: String(userId),
        status: res.status,
        body: body.slice(0, 200),
      });
    }
    return [];
  }

  const data = await res.json().catch(() => null);
  const roles = Array.isArray(data?.roles) ? data.roles : [];
  return roles.map(String).filter(Boolean);
}

function clearCookie(req, res, name) {
  const options = { ...getCookieOptions(req) };
  delete options.maxAge;
  res.clearCookie(name, options);
}

function getAllowedOrigins() {
  const origins = config.ui?.origins;
  return Array.isArray(origins) ? origins : [];
}

function getRequestOrigin(req) {
  const xfProto = req?.headers?.["x-forwarded-proto"];
  const protoRaw = Array.isArray(xfProto) ? xfProto[0] : xfProto ? String(xfProto) : "";
  const proto = protoRaw.split(",")[0].trim().toLowerCase() || (req?.secure ? "https" : "http");

  const xfHost = req?.headers?.["x-forwarded-host"];
  const hostRaw = Array.isArray(xfHost)
    ? xfHost[0]
    : xfHost
      ? String(xfHost)
      : String(req?.headers?.host || "");
  const host = hostRaw.split(",")[0].trim();

  return `${proto}://${host}`;
}

function isLocalHostname(hostname) {
  const normalized = String(hostname || "").trim().toLowerCase();
  if (!normalized) return true;
  if (normalized === "localhost" || normalized === "127.0.0.1" || normalized === "::1") return true;
  if (normalized.endsWith(".localhost")) return true;
  return false;
}

function shouldDebugAuth() {
  const flag = String(process.env.ADMIN_AUTH_DEBUG || "").trim().toLowerCase();
  return process.env.NODE_ENV !== "production" || flag === "1" || flag === "true" || flag === "yes";
}

function resolveDiscordRedirectUri(req) {
  const configured = String(config.discord.redirectUri || "").trim();
  if (!configured) return "";

  try {
    const origin = getRequestOrigin(req);
    const originUrl = new URL(origin);

    if (configured.startsWith("/")) {
      return new URL(configured, origin).toString();
    }

    const url = new URL(configured);

    // Dev ergonomics: if configured to localhost/127, ensure the redirect_uri host matches
    // the host the browser is actually using so cookies/state don't get split.
    if (isLocalHostname(url.hostname) && isLocalHostname(originUrl.hostname)) {
      url.protocol = originUrl.protocol;
      url.host = originUrl.host;
    }

    return url.toString();
  } catch {
    return configured;
  }
}

function isLocalOrigin(origin) {
  try {
    const url = new URL(String(origin || ""));
    return isLocalHostname(url.hostname);
  } catch {
    return false;
  }
}

function normalizePostLoginPath(value) {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!trimmed.startsWith("/")) return null;
  if (trimmed.startsWith("//")) return null;
  if (trimmed.includes("\\")) return null;
  if (trimmed.includes("\r") || trimmed.includes("\n")) return null;
  return trimmed;
}

function isCallbackPath(pathname) {
  const p = String(pathname || "").split("?")[0].split("#")[0];
  return (
    p === "/api/auth/callback" ||
    p.startsWith("/api/auth/callback/") ||
    p === "/api/auth/discord/callback" ||
    p.startsWith("/api/auth/discord/callback/")
  );
}

function enforceNoCallbackRedirect(redirectUrl, requestOrigin) {
  const fallbackOrigin = (() => {
    try {
      return new URL(String(requestOrigin || "")).origin;
    } catch {
      return "";
    }
  })();

  try {
    if (typeof redirectUrl === "string" && redirectUrl.startsWith("/")) {
      return isCallbackPath(redirectUrl) ? "/" : redirectUrl;
    }

    const u = new URL(String(redirectUrl || ""));
    if (isCallbackPath(u.pathname)) {
      return fallbackOrigin ? new URL("/", fallbackOrigin).toString() : "/";
    }
    return u.toString();
  } catch {
    return "/";
  }
}

function enforceNoLoopbackRedirectInProd(redirectUrl, fallbackPath = "/") {
  if (process.env.NODE_ENV !== "production") return redirectUrl;

  try {
    if (typeof redirectUrl === "string" && redirectUrl.startsWith("/")) return redirectUrl;
    const u = new URL(String(redirectUrl || ""));
    return isLocalHostname(u.hostname) ? fallbackPath : u.toString();
  } catch {
    return fallbackPath;
  }
}

function safeDebugOrigin(origin) {
  const raw = String(origin || "");
  if (process.env.NODE_ENV !== "production") return raw;
  return isLocalOrigin(raw) ? CANONICAL_ADMIN_ORIGIN : raw;
}

function safeDebugUrl(urlString) {
  const raw = String(urlString || "");
  if (process.env.NODE_ENV !== "production") return raw;
  try {
    const u = new URL(raw);
    if (isLocalHostname(u.hostname)) return "REDACTED_LOOPBACK";
  } catch {
    // keep relative paths as-is; never echo loopback here
  }
  return raw;
}

function isCanonicalAdminRequest(req) {
  try {
    const origin = getRequestOrigin(req);
    const u = new URL(origin);
    return u.hostname === CANONICAL_ADMIN_HOSTNAME;
  } catch {
    return false;
  }
}

router.get("/login", (req, res) => {
  // Safety net: legacy endpoint. Always send the browser to the canonical admin-ui entrypoint.
  return res.redirect(302, CANONICAL_AUTHORIZE_URL);
});

router.get("/callback", async (req, res) => {
  // Safety net: legacy endpoint. Redirect external callers to admin-ui canonical callback.
  // Internal admin-ui -> admin-api proxy calls set a header so token exchange continues to work.
  const internal =
    String(req.headers["x-slimy-internal-auth-callback"] || "").trim() === "1";

  const defaultPath =
    normalizePostLoginPath(String(process.env.ADMIN_UI_POST_LOGIN_REDIRECT || "")) ||
    "/guilds";

  const debug = String(req.query?.debug || "").trim() === "1";
  if (debug) {
    const cookieRedirectUri =
      typeof req.cookies?.oauth_redirect_uri === "string" ? req.cookies.oauth_redirect_uri : "";
    const cookieReturnTo = typeof req.cookies?.oauth_return_to === "string" ? req.cookies.oauth_return_to : "";

    const computed = enforceNoCallbackRedirect(
      resolvePostLoginRedirectUrl({
        cookieRedirectUri,
        headers: req.headers || {},
        returnToCookie: cookieReturnTo,
        allowedOrigins: getAllowedOrigins(),
        isLocalOrigin,
        clientUrl: config.clientUrl,
        defaultPath,
      }),
      getRequestOrigin(req),
    );

    const requestOrigin = safeDebugOrigin(getRequestOrigin(req));

    return res.status(200).json({
      ok: true,
      internal,
      requestOrigin,
      redirectUri: safeDebugUrl(resolveDiscordRedirectUri(req)),
      postLoginDefaultPath: defaultPath,
      postLoginRedirect: safeDebugUrl(computed),
      note: "no redirect performed in debug mode",
    });
  }

  // If a browser hits admin-api directly on the canonical admin domain (via Caddy), do not bounce
  // back to the same callback URL (that creates a self-redirect loop).
  if (!internal && !isCanonicalAdminRequest(req)) {
    const qs = typeof req.url === "string" && req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
    return res.redirect(302, `${CANONICAL_CALLBACK_URL}${qs}`);
  }

  try {
    const CLIENT_ID = config.discord.clientId;
    const CLIENT_SECRET = config.discord.clientSecret;
    const REDIRECT_URI = resolveDiscordRedirectUri(req);

    if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
      throw new Error("Discord OAuth not configured (missing clientId/clientSecret/redirectUri)");
    }

    const { code, state } = req.query;
    const saved = req.cookies && req.cookies.oauth_state;
    if (!code || !state || !saved || state !== saved) {
      clearCookie(req, res, "oauth_state");
      clearCookie(req, res, "oauth_return_to");
      clearCookie(req, res, "oauth_redirect_uri");
      if (shouldDebugAuth()) {
        console.warn("[auth/callback] State mismatch detail", {
          requestOrigin: getRequestOrigin(req),
          hasCode: Boolean(code),
          hasState: Boolean(state),
          hasSaved: Boolean(saved),
          statePrefix: typeof state === "string" ? state.slice(0, 6) : null,
          savedPrefix: typeof saved === "string" ? saved.slice(0, 6) : null,
        });
      } else {
        console.warn("[auth/callback] State mismatch", { hasCode: !!code });
      }
      return res.redirect("/?error=state_mismatch");
    }

    // One-time use once validated.
    clearCookie(req, res, "oauth_state");

    const cookieRedirectUri =
      typeof req.cookies?.oauth_redirect_uri === "string" ? req.cookies.oauth_redirect_uri : "";
    clearCookie(req, res, "oauth_redirect_uri");
    const redirectUriForTokenExchange = cookieRedirectUri || REDIRECT_URI;

    const body = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "authorization_code",
      code: String(code),
      redirect_uri: redirectUriForTokenExchange,
    });

    const tk = await fetch(DISCORD.TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!tk.ok) {
      const text = await tk.text().catch(() => "");
      console.error("[auth/callback] Token exchange failed", { status: tk.status, text });
      return res.redirect("/?error=token_exchange_failed");
    }
    const tokens = await tk.json();

    const headers = { Authorization: `Bearer ${tokens.access_token}` };
    const [meRes, guildsRes] = await Promise.all([
      fetch(`${DISCORD.API}/users/@me`, { headers }),
      fetch(`${DISCORD.API}/users/@me/guilds`, { headers }),
    ]);

    if (!meRes.ok) {
      const text = await meRes.text().catch(() => "");
      console.error("[auth/callback] /users/@me failed", { status: meRes.status, text });
      return res.redirect("/?error=discord_me_failed");
    }
    if (!guildsRes.ok) {
      const text = await guildsRes.text().catch(() => "");
      console.error("[auth/callback] /users/@me/guilds failed", { status: guildsRes.status, text });
      return res.redirect("/?error=discord_guilds_failed");
    }

    const me = await meRes.json();
    const guilds = await guildsRes.json();
    const discordGuilds = Array.isArray(guilds) ? guilds : [];

    console.log("[auth/callback] Sync start", {
      userId: me?.id,
      username: me?.username,
      guildCount: discordGuilds.length,
    });

    // --- SYNC ENGINE: Persist user + guilds + memberships ---
    // Best-effort: never block login if DB sync fails.
    try {
      const prisma = prismaDatabase.getClient();

      const expiresInSec = Number(tokens.expires_in || 0);
      const tokenExpiresAt =
        expiresInSec > 0 ? new Date(Date.now() + expiresInSec * 1000) : null;

      const dbUser = await prisma.user.upsert({
        where: { discordId: String(me.id) },
        update: {
          username: me.username,
          globalName: me.global_name || me.username,
          avatar: me.avatar || null,
          discordAccessToken: tokens.access_token || null,
          discordRefreshToken: tokens.refresh_token || null,
          tokenExpiresAt,
        },
        create: {
          discordId: String(me.id),
          username: me.username,
          globalName: me.global_name || me.username,
          avatar: me.avatar || null,
          discordAccessToken: tokens.access_token || null,
          discordRefreshToken: tokens.refresh_token || null,
          tokenExpiresAt,
        },
      });

      // Ensure central UserSettings exists (best-effort; never block login)
      try {
        await prisma.userSettings.upsert({
          where: { userId: String(dbUser.discordId) },
          update: {},
          create: {
            userId: String(dbUser.discordId),
            data: defaultUserSettings(String(dbUser.discordId)),
          },
        });
      } catch (err) {
        console.warn("[auth/callback] UserSettings upsert failed", {
          userId: String(dbUser.discordId),
          error: err?.message || String(err),
        });
      }

      let guildUpsertsOk = 0;
      let guildUpsertsFailed = 0;
      let membershipUpsertsOk = 0;
      let membershipUpsertsFailed = 0;

    for (const g of discordGuilds) {
      const guildId = g?.id ? String(g.id) : "";
      const guildName = g?.name ? String(g.name) : "";
      if (!guildId || !guildName) {
          guildUpsertsFailed += 1;
          continue;
        }

        try {
          await prisma.guild.upsert({
            where: { id: guildId },
            update: {
              name: guildName,
              icon: g?.icon ?? null,
            },
            create: {
              id: guildId,
              name: guildName,
              icon: g?.icon ?? null,
              ownerId: dbUser.id,
              settings: {},
            },
          });
          guildUpsertsOk += 1;
        } catch (err) {
          guildUpsertsFailed += 1;
          console.warn("[auth/callback] Guild upsert failed", {
            guildId,
            error: err?.message || String(err),
          });
          continue;
        }

        const roleMarkers = deriveMembershipRolesFromGuild(g);
        const roleGuildId =
          String(process.env.ROLE_GUILD_ID || process.env.TEST_GUILD_ID || "").trim() ||
          null;

        // Enrich only for the configured "role guild" (default: TEST_GUILD_ID) to avoid
        // hammering Discord for every guild on login.
        const discordRoleIds =
          roleGuildId && roleGuildId === guildId
            ? await fetchMemberRoleIdsWithBotToken(guildId, me.id)
            : [];

        const roles = Array.from(new Set([...roleMarkers, ...discordRoleIds]));
        try {
          await prisma.userGuild.upsert({
            where: {
              userId_guildId: {
                userId: dbUser.id,
                guildId,
              },
            },
            update: { roles },
            create: {
              userId: dbUser.id,
              guildId,
              roles,
            },
          });
          membershipUpsertsOk += 1;
        } catch (err) {
          membershipUpsertsFailed += 1;
          console.warn("[auth/callback] UserGuild upsert failed", {
            guildId,
            userId: dbUser.id,
            error: err?.message || String(err),
          });
        }
      }

      console.log("[auth/callback] Sync complete", {
        userId: dbUser.discordId,
        guildUpsertsOk,
        guildUpsertsFailed,
        membershipUpsertsOk,
        membershipUpsertsFailed,
      });
    } catch (err) {
      console.error("[auth/callback] DB sync failed (continuing login):", err);
    }

    // Keep cookie small: rely on /me to hydrate from DB.
    const user = {
      id: me.id,
      discordId: me.id,
      username: me.username,
      globalName: me.global_name || me.username,
      avatar: me.avatar || null,
      role: "member",
    };

    const token = signSession({ user });
    setAuthCookie(res, token);

    const cookieReturnTo = req.cookies?.oauth_return_to;
    clearCookie(req, res, "oauth_return_to");

    const redirectUrl = resolvePostLoginRedirectUrl({
      cookieRedirectUri: cookieRedirectUri || "",
      headers: req.headers || {},
      returnToCookie: cookieReturnTo,
      allowedOrigins: getAllowedOrigins(),
      isLocalOrigin,
      clientUrl: config.clientUrl,
      defaultPath,
    });

    const requestOrigin = getRequestOrigin(req);
    const safeRedirect = enforceNoCallbackRedirect(redirectUrl, requestOrigin);
    const loopbackSafe = enforceNoLoopbackRedirectInProd(safeRedirect, defaultPath);

    // Structured monitoring for callback redirect (no secrets; loopback redacted in prod)
    console.log("[auth/callback] Redirect decision", {
      requestOrigin: safeDebugOrigin(requestOrigin),
      redirectTarget: safeDebugUrl(loopbackSafe),
      callbackLoopGuardTriggered: safeRedirect !== redirectUrl,
      loopbackGuardTriggered: loopbackSafe !== safeRedirect,
    });

    return res.redirect(loopbackSafe);
  } catch (err) {
    console.error("[auth/callback] CRITICAL ERROR:", err);
    return res.redirect("/?error=server_error");
  }
});

router.get("/me", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "unauthorized" });

  // UNWRAP USER (safe outside try so we can return it even on failures)
  // @ts-ignore
  const rawUser = req.user.user || req.user;
  const userId = rawUser?.id || rawUser?.discordId || rawUser?.sub;
  const warnings = [];

  try {
    let prisma = null;
    try {
      try {
        prisma = typeof prismaDatabase.getClient === "function" ? prismaDatabase.getClient() : null;
      } catch {
        prisma = null;
      }
      if (!prisma && prismaDatabase && prismaDatabase.client) {
        prisma = prismaDatabase.client;
      }
    } catch (err) {
      warnings.push("db_unavailable");
      if (shouldDebugAuth()) {
        console.warn("[auth/me] Prisma unavailable; returning session-only response", {
          error: err?.message || String(err),
        });
      }
    }

    console.log(`[auth/me] req.user keys: ${Object.keys(req.user || {}).join(",")}`);
    console.log(`[auth/me] rawUser keys: ${Object.keys(rawUser || {}).join(",")}`);
    console.log(`[auth/me] Lookup User ID: ${userId}`);

    if (!userId) {
      console.warn("[auth/me] Missing userId on session user payload:", rawUser);
      warnings.push("missing_user_id");
      return res.json({
        id: null,
        username: "Guest",
        guilds: [],
        sessionGuilds: [],
        warnings,
      });
    }

    // Base response: usable even when DB calls fail.
    const baseResponse = {
      id: userId,
      discordId: userId,
      username: rawUser?.username || rawUser?.name || "Unknown",
      globalName: rawUser?.globalName,
      avatar: rawUser?.avatar,
      role: rawUser?.role || "member",
      sessionGuilds: [],
      guilds: [],
      warnings,
    };

    const resolveActiveGuild = async ({ sessionGuilds, dbUser }) => {
      let activeGuildId = null;
      let activeGuildAppRole = null;

      const headerActiveGuild = req.headers["x-slimy-active-guild-id"];
      const headerValue = Array.isArray(headerActiveGuild) ? headerActiveGuild[0] : headerActiveGuild;
      if (headerValue) {
        activeGuildId = String(headerValue);
      }

      if (!activeGuildId && req.cookies?.[ACTIVE_GUILD_COOKIE_NAME]) {
        activeGuildId = String(req.cookies[ACTIVE_GUILD_COOKIE_NAME]);
      }

      if (!activeGuildId && dbUser?.lastActiveGuildId) {
        activeGuildId = String(dbUser.lastActiveGuildId);
      }

      if (activeGuildId) {
        const activeGuildEntry = sessionGuilds.find((g) => String(g.id) === activeGuildId);
        if (!activeGuildEntry) {
          activeGuildId = null;
        } else {
          const isPrimary = activeGuildId === PRIMARY_GUILD_ID;
          if (isPrimary) {
            const botToken = getSlimyBotToken();
            if (botToken && userId) {
              try {
                const memberRoles = await fetchMemberRoles(PRIMARY_GUILD_ID, String(userId), botToken);
                if (memberRoles) {
                  activeGuildAppRole = computeRoleLabelFromRoles(memberRoles);
                }
              } catch (err) {
                console.warn("[auth/me] Failed to fetch member roles for active guild:", err?.message);
              }
            }
          }

          if (!activeGuildAppRole) {
            const roles = activeGuildEntry.roles || [];
            if (roles.includes("owner") || roles.includes("admin")) {
              activeGuildAppRole = "admin";
            } else if (roles.includes("club")) {
              activeGuildAppRole = "club";
            } else {
              activeGuildAppRole = "member";
            }
          }
        }
      }

      return { activeGuildId, activeGuildAppRole };
    };

    // If DB is unavailable, return the session-only response instead of 500.
    if (!prisma) {
      const cookieGuilds = Array.isArray(rawUser?.guilds) ? rawUser.guilds : [];
      const sessionGuilds = cookieGuilds.map((g) => ({
        id: g?.id,
        roles: g?.roles,
        name: "Unknown (DB unavailable)",
        installed: false,
      }));
      baseResponse.sessionGuilds = sessionGuilds;
      baseResponse.guilds = sessionGuilds;
      const { activeGuildId, activeGuildAppRole } = await resolveActiveGuild({
        sessionGuilds,
        dbUser: null,
      });
      baseResponse.activeGuildId = activeGuildId;
      baseResponse.activeGuildAppRole = activeGuildAppRole;
      return res.json(baseResponse);
    }

    let dbUser = null;
    try {
      const userIdStr = String(userId);
      const isSnowflake = /^\d{17,19}$/.test(userIdStr);
      dbUser = await prisma.user.findUnique({
        where: isSnowflake ? { discordId: userIdStr } : { id: userIdStr },
        include: { lastActiveGuild: true },
      });
    } catch (err) {
      warnings.push("db_user_lookup_failed");
      if (shouldDebugAuth()) {
        console.warn("[auth/me] DB user lookup failed; returning session-only response", {
          error: err?.message || String(err),
        });
      }
    }

    console.log(`[auth/me] DB User Found: ${!!dbUser}`);

    let sessionGuilds = [];
    if (dbUser) {
      // Fetch UserGuilds AND JOIN Guild
      try {
        const userGuilds = await prisma.userGuild.findMany({
          where: { userId: dbUser.id },
          include: { guild: true },
        });

        console.log(`[auth/me] Raw DB Guilds Found: ${userGuilds.length}`);

        sessionGuilds = userGuilds.map((ug) => ({
          id: ug.guild?.id,
          name: ug.guild?.name,
          icon: ug.guild?.icon,
          installed: true,
          roles: ug.roles || [],
        }));
      } catch (err) {
        warnings.push("db_guilds_lookup_failed");
        if (shouldDebugAuth()) {
          console.warn("[auth/me] DB guild lookup failed; returning session-only guilds", {
            error: err?.message || String(err),
          });
        }
        const cookieGuilds = Array.isArray(rawUser?.guilds) ? rawUser.guilds : [];
        sessionGuilds = cookieGuilds.map((g) => ({
          id: g?.id,
          roles: g?.roles,
          name: "Unknown (DB guild lookup failed)",
          installed: false,
        }));
      }
    } else {
      // Fallback: Use cookie guilds if available (will lack names)
      // But ensure we at least pass the ID
      const cookieGuilds = Array.isArray(rawUser?.guilds) ? rawUser.guilds : [];
      console.warn("[auth/me] Fallback to cookie guilds:", cookieGuilds.length);
      sessionGuilds = cookieGuilds.map((g) => ({
        id: g?.id,
        roles: g?.roles,
        name: "Unknown (Not in DB)",
        installed: false,
      }));
    }

    const { activeGuildId, activeGuildAppRole } = await resolveActiveGuild({
      sessionGuilds,
      dbUser,
    });

    return res.json({
      id: dbUser?.discordId || baseResponse.id,
      discordId: dbUser?.discordId || baseResponse.discordId,
      username: dbUser?.username || baseResponse.username,
      globalName: dbUser?.globalName || baseResponse.globalName,
      avatar: dbUser?.avatar || baseResponse.avatar,
      role: baseResponse.role,
      activeGuildId,
      activeGuildAppRole,
      lastActiveGuild: dbUser?.lastActiveGuild
        ? {
            id: dbUser.lastActiveGuild.id,
            name: dbUser.lastActiveGuild.name,
            icon: dbUser.lastActiveGuild.icon,
          }
        : undefined,
      sessionGuilds,
      guilds: sessionGuilds,
      warnings,
    });
  } catch (err) {
    // Last line of defense: never 500 for authenticated sessions.
    console.error("[auth/me] CRITICAL ERROR:", err);
    console.error("[auth/me] rawUser snapshot:", rawUser);
    warnings.push("me_handler_failed");
    return res.json({
      id: userId || null,
      discordId: userId || null,
      username: rawUser?.username || rawUser?.name || "Unknown",
      globalName: rawUser?.globalName,
      avatar: rawUser?.avatar,
      role: rawUser?.role || "member",
      sessionGuilds: [],
      guilds: [],
      warnings,
    });
  }
});

/**
 * POST /api/auth/active-guild
 * Sets the user's active guild (persists in DB + sets cookie)
 * - Validates bot is installed in guild (O(1) check)
 * - Validates user has access to the guild (DB check)
 * - Updates lastActiveGuildId in DB
 * - Returns activeGuildId + appRole
 */
router.post("/active-guild", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  const rawUser = req.user.user || req.user;
  const userId = rawUser?.id || rawUser?.discordId || rawUser?.sub;

  if (!userId) {
    return res.status(400).json({ ok: false, error: "missing_user_id" });
  }

  const { guildId } = req.body || {};
  if (!guildId) {
    return res.status(400).json({ ok: false, error: "missing_guild_id" });
  }

  const normalizedGuildId = String(guildId);
  const normalizedUserId = String(userId);

  try {
    const DISCORD_TIMEOUT_MS = 8_000;
    const discordTimeoutSignal =
      typeof globalThis.AbortSignal?.timeout === "function"
        ? globalThis.AbortSignal.timeout(DISCORD_TIMEOUT_MS)
        : undefined;
    const ADMIN_PERMISSION = 0x8n;
    const MANAGE_GUILD_PERMISSION = 0x20n;
    const hasAdminOrManagePermission = (permissions) => {
      if (permissions === undefined || permissions === null) return false;
      try {
        const permsBigInt = BigInt(permissions);
        const isAdmin = (permsBigInt & ADMIN_PERMISSION) === ADMIN_PERMISSION;
        const canManage = (permsBigInt & MANAGE_GUILD_PERMISSION) === MANAGE_GUILD_PERMISSION;
        return isAdmin || canManage;
      } catch {
        return false;
      }
    };

    // 1. Get Prisma client (required for Discord access token lookup)
    let prisma = null;
    try {
      await prismaDatabase.initialize();
      prisma = prismaDatabase.getClient();
    } catch {
      prisma = null;
    }

    if (!prisma) {
      return res.status(503).json({
        ok: false,
        error: "db_unavailable",
        message: "Database unavailable",
      });
    }

    // 2. Validate the user actually belongs to this guild (aligns semantics with GET /api/guilds)
    const isSnowflake = /^\d{17,19}$/.test(normalizedUserId);
    const dbUser = await prisma.user.findUnique({
      where: isSnowflake ? { discordId: normalizedUserId } : { id: normalizedUserId },
    });

    if (!dbUser) {
      return res.status(401).json({ ok: false, error: "unauthorized" });
    }

    const discordAccessToken = dbUser.discordAccessToken || "";
    if (!discordAccessToken) {
      return res.status(400).json({ ok: false, error: "missing_discord_token" });
    }

    // 2. DB lookup for membership/guild info (best-effort, also used as fallback when Discord is rate-limited)
    let guildInfo = null;
    let userGuildRecord = null;
    try {
      userGuildRecord = await prisma.userGuild.findFirst({
        where: {
          userId: dbUser.id,
          guild: { id: normalizedGuildId },
        },
        include: { guild: true },
      });

      if (userGuildRecord?.guild) {
        guildInfo = userGuildRecord.guild;
      }

      if (!guildInfo) {
        guildInfo = await prisma.guild.findUnique({
          where: { id: normalizedGuildId },
        });
      }
    } catch (err) {
      console.warn("[auth/active-guild] DB lookup failed:", err?.message || err);
    }

    // 3. Validate the user actually belongs to this guild (aligns semantics with GET /api/guilds)
    let guildsRes = null;
    try {
      guildsRes = await fetch(`${DISCORD.API}/users/@me/guilds`, {
        headers: { Authorization: `Bearer ${discordAccessToken}` },
        signal: discordTimeoutSignal,
      });
    } catch (err) {
      console.warn(
        "[auth/active-guild] Discord /users/@me/guilds request failed:",
        err?.name || err?.message || err,
      );
      guildsRes = null;
    }

    if (!guildsRes) {
      if (!userGuildRecord) {
        return res.status(503).json({
          ok: false,
          error: "discord_user_guilds_unavailable",
          message: "Discord /users/@me/guilds unavailable (and no DB fallback)",
        });
      }
    } else if (!guildsRes.ok) {
      const status = Number(guildsRes.status) || 0;

      if (status === 401 || status === 403) {
        return res.status(401).json({
          ok: false,
          error: "discord_token_invalid",
          message: "Discord token invalid or expired; please re-authenticate",
        });
      }

      // If Discord is rate-limiting, allow selecting previously-known guilds (DB fallback)
      if (status === 429) {
        const retryAfter = guildsRes.headers?.get?.("retry-after");
        if (retryAfter) res.set("Retry-After", String(retryAfter));

        if (!userGuildRecord) {
          return res.status(429).json({
            ok: false,
            error: "discord_rate_limited",
            message: "Discord rate limited; retry later",
            retryAfterSeconds: retryAfter ? Number(retryAfter) : undefined,
          });
        }
      } else if (!userGuildRecord) {
        return res.status(503).json({
          ok: false,
          error: "discord_user_guilds_failed",
          message: `Discord /users/@me/guilds failed (${status || "unknown"})`,
        });
      }
    }

    const guilds = guildsRes?.ok ? await guildsRes.json().catch(() => []) : [];
    const list = Array.isArray(guilds) ? guilds : [];
    const userGuild = list.find((g) => String(g?.id || "") === normalizedGuildId) || null;

    if (guildsRes?.ok && !userGuild) {
      return res.status(400).json({
        ok: false,
        error: "guild_not_in_user_guilds",
        message: "Guild must be present in your Discord guild list",
      });
    }

    const manageable =
      userGuild
        ? Boolean(userGuild.owner) || hasAdminOrManagePermission(userGuild.permissions)
        : Boolean(userGuildRecord);

    // 4. Best-effort bot installation check using bot token (DO NOT block selection)
    const botToken = getSlimyBotToken();
    let botInstalled = null;
    if (botToken) {
      try {
        botInstalled = await botInstalledInGuild(normalizedGuildId, botToken);
      } catch (err) {
        console.warn("[auth/active-guild] Bot membership check failed:", err?.message || err);
        botInstalled = null;
      }
    }

    // 5. Compute role for this guild
    let appRole = "member";
    const isPrimary = normalizedGuildId === PRIMARY_GUILD_ID;

    // For PRIMARY_GUILD, fetch fresh roles from Discord
    if (isPrimary && botToken) {
      try {
        const memberRoles = await fetchMemberRoles(PRIMARY_GUILD_ID, normalizedUserId, botToken);
        if (memberRoles) {
          appRole = computeRoleLabelFromRoles(memberRoles);
        }
      } catch (err) {
        console.warn("[auth/active-guild] Failed to fetch member roles:", err?.message || err);
      }
    } else if (userGuildRecord?.roles?.length) {
      // Use roles from UserGuild record if available
      appRole = computeRoleLabelFromRoles(userGuildRecord.roles);
    }

    // 6. Update lastActiveGuildId in DB (best-effort)
    try {
      await prisma.user.update({
        where: isSnowflake ? { discordId: normalizedUserId } : { id: normalizedUserId },
        data: { lastActiveGuildId: normalizedGuildId },
      });
    } catch (err) {
      console.warn("[auth/active-guild] Failed to update lastActiveGuildId:", err?.message || err);
      // Continue anyway - we'll still set the cookie
    }

    // 7. Set the active guild cookie
    const cookieOptions = getCookieOptions(req);
    res.cookie(ACTIVE_GUILD_COOKIE_NAME, normalizedGuildId, {
      ...cookieOptions,
      httpOnly: true,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    // 8. Return success with activeGuildId and appRole
    return res.json({
      ok: true,
      activeGuildId: normalizedGuildId,
      appRole,
      manageable,
      botInstalled,
      guildName: guildInfo?.name || userGuild?.name || null,
    });
  } catch (err) {
    console.error("[auth/active-guild] Error:", err);
    return res.status(500).json({
      ok: false,
      error: "internal_error",
      message: err?.message || String(err),
    });
  }
});

router.post("/logout", (req, res) => {
  clearAuthCookie(res);
  // Also clear active guild cookie on logout
  const cookieOptions = getCookieOptions(req);
  res.clearCookie(ACTIVE_GUILD_COOKIE_NAME, {
    ...cookieOptions,
    httpOnly: true,
    sameSite: "lax",
  });
  res.json({ ok: true });
});

module.exports = router;
