"use strict";
const express = require("express");
const crypto = require("crypto");
const config = require("../config");
const prismaDatabase = require("../lib/database");
const { signSession, setAuthCookie, clearAuthCookie } = require("../lib/jwt");
const { getCookieOptions } = require("../services/token");
const router = express.Router();

console.log("!!! AUTH LOGIC LOADED v303 (DATA INTEGRITY) !!!");

const DISCORD = {
  API: "https://discord.com/api/v10",
  TOKEN_URL: "https://discord.com/api/oauth2/token",
  AUTH_URL: "https://discord.com/oauth2/authorize",
};

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

function normalizeReturnToPath(returnTo) {
  if (!returnTo || typeof returnTo !== "string") return null;
  const trimmed = returnTo.trim();
  if (!trimmed.startsWith("/")) return null;
  if (trimmed.startsWith("//")) return null;
  if (trimmed.includes("\\")) return null;
  if (trimmed.includes("\r") || trimmed.includes("\n")) return null;
  return trimmed;
}

function isLocalOrigin(origin) {
  try {
    const url = new URL(String(origin || ""));
    return isLocalHostname(url.hostname);
  } catch {
    return false;
  }
}

function issueState(req, res) {
  const state = crypto.randomBytes(16).toString("base64url");
  res.cookie("oauth_state", state, getCookieOptions(req, { maxAge: 5 * 60 * 1000 }));
  return state;
}

router.get("/login", (req, res) => {
  try {
    const CLIENT_ID = config.discord.clientId;
    const REDIRECT_URI = resolveDiscordRedirectUri(req);
    const SCOPES = (config.discord.scopes || ["identify", "guilds"]).join(" ");

    if (!CLIENT_ID || !REDIRECT_URI) {
      throw new Error("Discord OAuth not configured (missing clientId/redirectUri)");
    }

    if (shouldDebugAuth()) {
      const clientIdMasked =
        typeof CLIENT_ID === "string" && CLIENT_ID.length > 8
          ? `${CLIENT_ID.slice(0, 4)}…${CLIENT_ID.slice(-4)}`
          : CLIENT_ID;
      console.info("[auth/login] oauth config", {
        clientId: clientIdMasked,
        redirectUri: REDIRECT_URI,
        requestOrigin: getRequestOrigin(req),
      });
    }

    const rawReturnTo = Array.isArray(req.query?.returnTo)
      ? req.query.returnTo[0]
      : req.query?.returnTo;
    const returnToPath = normalizeReturnToPath(rawReturnTo);
    if (returnToPath) {
      res.cookie("oauth_return_to", returnToPath, getCookieOptions(req, { maxAge: 10 * 60 * 1000 }));
    }

    // Persist the exact redirect_uri used for this authorization request so the
    // token exchange in /callback can be byte-for-byte identical even if proxy
    // headers differ between requests.
    res.cookie("oauth_redirect_uri", REDIRECT_URI, getCookieOptions(req, { maxAge: 10 * 60 * 1000 }));

    const state = issueState(req, res);
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: "code",
      scope: SCOPES,
      state,
      prompt: "consent",
    });

    return res.redirect(302, `${DISCORD.AUTH_URL}?${params.toString()}`);
  } catch (err) {
    console.error("[auth/login] CRITICAL ERROR:", err);
    return res.redirect("/?error=login_not_configured");
  }
});

router.get("/callback", async (req, res) => {
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

        const roles = g?.owner ? ["owner"] : [];
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

    const successRedirect =
      (config.ui && config.ui.successRedirect) || "https://slimyai.xyz/dashboard";

    const origin = getRequestOrigin(req);
    const allowed = getAllowedOrigins();
    const originAllowed = isLocalOrigin(origin) || !allowed.length || allowed.includes(origin);
    const originDashboard = originAllowed ? new URL("/dashboard", origin).toString() : null;

    const returnToPath = normalizeReturnToPath(cookieReturnTo);
    const returnToUrl =
      originAllowed && returnToPath ? new URL(returnToPath, origin).toString() : null;

    return res.redirect(returnToUrl || originDashboard || successRedirect);
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
      prisma = prismaDatabase.getClient();
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
      return res.json(baseResponse);
    }

    let dbUser = null;
    try {
      dbUser = await prisma.user.findUnique({
        where: { discordId: String(userId) },
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

    return res.json({
      id: dbUser?.discordId || baseResponse.id,
      discordId: dbUser?.discordId || baseResponse.discordId,
      username: dbUser?.username || baseResponse.username,
      globalName: dbUser?.globalName || baseResponse.globalName,
      avatar: dbUser?.avatar || baseResponse.avatar,
      role: baseResponse.role,
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

router.post("/logout", (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

module.exports = router;
