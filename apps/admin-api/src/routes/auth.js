"use strict";

const express = require("express");
const crypto = require("crypto");
const { signSession, setAuthCookie, clearAuthCookie } = require("../../lib/jwt");
const { storeSession, clearSession, getSession } = require("../../lib/session-store");
const { resolveRoleLevel } = require("../lib/roles");
const config = require("../config");
const prismaDatabase = require("../lib/database");

const router = express.Router();

const DISCORD = {
  API: "https://discord.com/api/v10",
  TOKEN_URL: "https://discord.com/api/oauth2/token",
  AUTH_URL: "https://discord.com/oauth2/authorize",
};

const {
  clientId: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
  redirectUri: CONFIG_REDIRECT_URI,
  scopes: CONFIG_SCOPES,
} = config.discord;

const REDIRECT_URI =
  CONFIG_REDIRECT_URI ||
  process.env.DISCORD_REDIRECT_URI ||
  "https://admin.slimyai.xyz/api/auth/callback";
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || null;
const FRONTEND_URL =
  process.env.CLIENT_URL ||
  process.env.ADMIN_APP_URL ||
  "http://localhost:3000";
const COOKIE_DOMAIN =
  config.jwt.cookieDomain ||
  process.env.SESSION_COOKIE_DOMAIN ||
  process.env.COOKIE_DOMAIN ||
  process.env.ADMIN_COOKIE_DOMAIN ||
  (process.env.NODE_ENV === "production" ? ".slimyai.xyz" : undefined);
const DEFAULT_SCOPES = "identify email guilds";
const requestedScopes = Array.isArray(CONFIG_SCOPES)
  ? CONFIG_SCOPES.join(" ")
  : CONFIG_SCOPES || DEFAULT_SCOPES;
const scopeSet = new Set(
  String(requestedScopes)
    .split(/\s+/)
    .filter(Boolean)
    .concat(["identify", "email"]),
);
const SCOPES = Array.from(scopeSet).join(" ");
const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "slimy_admin";
const SESSION_COOKIE_DOMAIN_OVERRIDE =
  process.env.NODE_ENV === "production" ? ".slimyai.xyz" : COOKIE_DOMAIN;

const oauthStateCookieOptions = {
  httpOnly: true,
  secure: Boolean(
    config.jwt.cookieSecure ?? process.env.NODE_ENV === "production",
  ),
  sameSite: "lax",
  path: "/",
};
if (COOKIE_DOMAIN) {
  oauthStateCookieOptions.domain = COOKIE_DOMAIN;
}

const missingAuthConfig = [];
if (!CLIENT_ID) missingAuthConfig.push("DISCORD_CLIENT_ID");
if (!CLIENT_SECRET) missingAuthConfig.push("DISCORD_CLIENT_SECRET");
if (!REDIRECT_URI) missingAuthConfig.push("DISCORD_REDIRECT_URI");
if (!COOKIE_DOMAIN && process.env.NODE_ENV === "production") {
  missingAuthConfig.push("COOKIE_DOMAIN");
}
if (!FRONTEND_URL) missingAuthConfig.push("CLIENT_URL");
if (
  !config.jwt.secret &&
  !process.env.JWT_SECRET &&
  !process.env.SESSION_SECRET
) {
  missingAuthConfig.push("JWT_SECRET");
}
if (missingAuthConfig.length && process.env.NODE_ENV !== "test") {
  console.warn("[auth] Missing env vars for Discord auth", {
    missing: missingAuthConfig,
  });
}

const ROLE_ORDER = { member: 0, club: 1, admin: 2 };

function issueState(res) {
  const payload = {
    nonce: crypto.randomBytes(16).toString("base64url"),
    ts: Date.now(),
  };
  res.cookie("oauth_state", payload.nonce, {
    ...oauthStateCookieOptions,
    maxAge: 5 * 60 * 1000,
  });
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function parseState(value) {
  if (!value) return null;
  try {
    return JSON.parse(
      Buffer.from(String(value), "base64url").toString("utf8"),
    );
  } catch (err) {
    return null;
  }
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    const error = new Error(`Request failed: ${response.status} ${text}`);
    error.status = response.status;
    error.raw = text;
    throw error;
  }
  return response.json();
}

router.get("/login", (_req, res) => {
  const state = issueState(res);
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: SCOPES,
    state,
    prompt: "consent",
  });
  res.redirect(302, `${DISCORD.AUTH_URL}?${params.toString()}`);
});

router.get("/callback", async (req, res) => {
  try {
    console.log("Callback started");
    const { code, state } = req.query;
    console.info("[admin-api] /api/auth/callback start", {
      hasCode: Boolean(code),
    });
    const savedNonce = req.cookies?.oauth_state;
    const parsed = parseState(state);
    if (
      !code ||
      !parsed ||
      !parsed.nonce ||
      !savedNonce ||
      parsed.nonce !== savedNonce
    ) {
      return res.redirect("/?error=state_mismatch");
    }

    const body = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "authorization_code",
      code: String(code),
      redirect_uri: REDIRECT_URI,
    });

    const tokenResponse = await fetch(DISCORD.TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!tokenResponse.ok) {
      return res.redirect("/?error=token_exchange_failed");
    }
    const tokens = await tokenResponse.json();
    const accessToken = tokens.access_token;
    const refreshToken = tokens.refresh_token;
    const tokenExpiresAt = Date.now() + Number(tokens.expires_in || 3600) * 1000;

    const headers = { Authorization: `Bearer ${accessToken}` };
    const me = await fetchJson(`${DISCORD.API}/users/@me`, { headers });
    const userGuilds = await fetchJson(`${DISCORD.API}/users/@me/guilds`, {
      headers,
    });

    const guilds = Array.isArray(userGuilds) ? userGuilds : [];
    const enrichedGuilds = [];
    let highestRole = "member";

    const MANAGE_GUILD = 0x0000000000000020n;
    const ADMINISTRATOR = 0x0000000000080000n;

    if (!BOT_TOKEN) {
      console.warn(
        "[auth] DISCORD_BOT_TOKEN not configured; skipping guild intersection",
      );
      for (const guild of guilds) {
        let roleLevel = "member";
        try {
          const perms = BigInt(guild.permissions || "0");
          if ((perms & ADMINISTRATOR) === ADMINISTRATOR || guild.owner) {
            roleLevel = "admin";
          } else if ((perms & MANAGE_GUILD) === MANAGE_GUILD) {
            roleLevel = "admin";
          }
        } catch {
          roleLevel = "member";
        }
        if (ROLE_ORDER[roleLevel] > ROLE_ORDER[highestRole]) {
          highestRole = roleLevel;
        }
        enrichedGuilds.push({
          id: guild.id,
          name: guild.name,
          icon: guild.icon,
          roles: [],
          role: roleLevel,
          permissions: guild.permissions,
          installed: false,
        });
      }
    } else {
      // Optimized: Fetch bot's guilds once, then intersect with user's guilds
      try {
        const botGuildsResponse = await fetch(`${DISCORD.API}/users/@me/guilds?limit=200`, {
          headers: { Authorization: `Bot ${BOT_TOKEN}` },
        });

        if (botGuildsResponse.ok) {
          const botGuilds = await botGuildsResponse.json();
          const botGuildIds = new Set(botGuilds.map((g) => g.id));

          // Filter user's guilds to only those the bot is also in
          const sharedGuilds = guilds.filter((g) => botGuildIds.has(g.id));

          console.info("[auth] Guild intersection:", {
            userGuilds: guilds.length,
            botGuilds: botGuilds.length,
            shared: sharedGuilds.length,
          });

          for (const guild of sharedGuilds) {
            let roleLevel = "member";
            try {
              const perms = BigInt(guild.permissions || "0");
              if ((perms & ADMINISTRATOR) === ADMINISTRATOR || guild.owner) {
                roleLevel = "admin";
              } else if ((perms & MANAGE_GUILD) === MANAGE_GUILD) {
                roleLevel = "admin";
              }
            } catch {
              roleLevel = "member";
            }

            if (ROLE_ORDER[roleLevel] > ROLE_ORDER[highestRole]) {
              highestRole = roleLevel;
            }

            enrichedGuilds.push({
              id: guild.id,
              name: guild.name,
              icon: guild.icon,
              roles: [], // Cannot fetch roles without O(N) calls
              role: roleLevel,
              permissions: guild.permissions,
              installed: true,
            });
          }
        } else {
          console.error(
            "[auth] Failed to fetch bot guilds:",
            botGuildsResponse.status,
            await botGuildsResponse.text(),
          );
          // If bot guild fetch fails, we can't filter. 
          // Fallback to empty enrichedGuilds (login proceeds but no servers shown)
          // or we could try to fallback to the old method, but that caused 429s.
          // Better to fail safe and log error.
        }
      } catch (err) {
        console.error("[auth] Error in guild intersection:", err);
      }
    }

    if (!enrichedGuilds.length && guilds.length && !BOT_TOKEN) {
      // Provide graceful fallback so members still see guilds even without bot token.
      for (const guild of guilds) {
        let roleLevel = "member";
        try {
          const perms = BigInt(guild.permissions || "0");
          if ((perms & ADMINISTRATOR) === ADMINISTRATOR || guild.owner) {
            roleLevel = "admin";
          } else if ((perms & MANAGE_GUILD) === MANAGE_GUILD) {
            roleLevel = "admin";
          }
        } catch {
          roleLevel = "member";
        }
        if (ROLE_ORDER[roleLevel] > ROLE_ORDER[highestRole]) {
          highestRole = roleLevel;
        }
        enrichedGuilds.push({
          id: guild.id,
          name: guild.name,
          icon: guild.icon,
          roles: [],
          role: roleLevel,
          permissions: guild.permissions,
          installed: false,
        });
      }
    }

    const lightweightGuilds = enrichedGuilds.map((guild) => ({
      id: guild.id,
      name: guild.name,
      icon: guild.icon,
      role: guild.role,
      installed: guild.installed,
      permissions: guild.permissions,
    }));

    const userRole = highestRole;
    const user = {
      id: me.id,
      username: me.username,
      globalName: me.global_name || me.username,
      avatar: me.avatar || null,
      email: me.email || null,
      role: userRole,
      // SAFETY: Guilds list is too large for cookies (93+ guilds = header overflow).
      // Since DB is down, we cannot persist them. We must omit them to allow login.
      guilds: [],
    };

    try {
      const ready = await prismaDatabase.initialize();
      if (!ready) {
        console.error("[auth/callback] prisma not initialized");
        return res.redirect(`${FRONTEND_URL}/?error=session_error`);
      }

      const prismaUser = await prismaDatabase.findOrCreateUser(me, {
        accessToken,
        refreshToken,
        expiresAt: tokenExpiresAt,
      });
      console.log("User Upserted: ", prismaUser.id);
      await prismaDatabase.deleteUserSessions(prismaUser.id);
      const sessionToken = crypto.randomBytes(32).toString("hex");
      const expiresMs = Number(tokens.expires_in || 3600) * 1000;
      const expiresAt = new Date(Date.now() + expiresMs);
      console.log("Creating Session...");
      await prismaDatabase.createSession(prismaUser.id, sessionToken, expiresAt);
      res.cookie(SESSION_COOKIE_NAME, sessionToken, {
        httpOnly: true,
        secure: Boolean(
          config.jwt.cookieSecure ?? process.env.NODE_ENV === "production",
        ),
        sameSite: "lax",
        domain: SESSION_COOKIE_DOMAIN_OVERRIDE,
        maxAge: expiresMs,
        path: "/",
      });
    } catch (dbErr) {
      console.error("[auth/callback] failed to persist session", {
        error: dbErr.message,
      });
      return res.redirect(`${FRONTEND_URL}/?error=session_error`);
    }

    // NOTE: Session is already created above with prismaDatabase.createSession()
    // The legacy storeSession() call was removed because it was passing user.id (Discord ID)
    // instead of prismaUser.id (database UUID), causing foreign key constraint errors.
    // All session data is now managed through the Prisma database layer.

    const signed = signSession({ user });
    setAuthCookie(res, signed);
    res.clearCookie("oauth_state", oauthStateCookieOptions);

    console.info("[admin-api] /api/auth/callback created session", {
      userId: user.id,
      guildCount: lightweightGuilds.length,
    });

    // Redirect to dashboard after successful login
    const redirectUrl = new URL("/dashboard", FRONTEND_URL);
    return res.redirect(redirectUrl.toString());
  } catch (err) {
    console.error("Callback Error Full: ", err);
    console.error("[auth/callback] failed:", err);
    return res.redirect("/?error=server_error");
  }
});

router.get("/me", async (req, res) => {
  console.info("[admin-api] /api/auth/me called", {
    hasUser: Boolean(req.user),
    userId: req.user?.id || null,
  });
  if (!req.user) {
    return res.status(401).json({ error: "unauthorized" });
  }

  // Fetch fresh user data from DB to get lastActiveGuild
  let dbUser = null;
  try {
    if (prismaDatabase.client) {
      dbUser = await prismaDatabase.client.user.findUnique({
        where: { id: req.user.id },
        include: { lastActiveGuild: true },
      });
    }
  } catch (err) {
    console.warn("[auth] Failed to fetch fresh user data:", err);
  }

  const session = getSession(req.user.id);

  // Merge req.user (from token/session) with fresh DB data
  const responseUser = {
    ...req.user,
    ...(dbUser || {}),
    // Ensure these exist even if DB fetch fails
    guilds: req.user.guilds || [],
    sessionGuilds: session?.guilds || [],
  };

  return res.json(responseUser);
});

router.post("/logout", (req, res) => {
  if (req.user?.id) {
    clearSession(req.user.id);
  }
  clearAuthCookie(res);
  res.json({ ok: true });
});

module.exports = router;
