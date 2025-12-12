"use strict";
const express = require("express");
const crypto = require("crypto");
const config = require("../config");
const prismaDatabase = require("../lib/database");
const { signSession, setAuthCookie, clearAuthCookie } = require("../lib/jwt");
const router = express.Router();

console.log("!!! AUTH LOGIC LOADED v303 (DATA INTEGRITY) !!!");

const DISCORD = {
  API: "https://discord.com/api/v10",
  TOKEN_URL: "https://discord.com/api/oauth2/token",
  AUTH_URL: "https://discord.com/oauth2/authorize",
};

function getCookieDomain() {
  return config.jwt.cookieDomain || (process.env.NODE_ENV === "production" ? ".slimyai.xyz" : undefined);
}

function issueState(res) {
  const state = crypto.randomBytes(16).toString("base64url");
  res.cookie("oauth_state", state, {
    httpOnly: true,
    secure: !!config.jwt.cookieSecure,
    sameSite: config.jwt.cookieSameSite || "lax",
    domain: getCookieDomain(),
    path: "/",
    maxAge: 5 * 60 * 1000,
  });
  return state;
}

router.get("/login", (req, res) => {
  try {
    const CLIENT_ID = config.discord.clientId;
    const REDIRECT_URI = config.discord.redirectUri;
    const SCOPES = (config.discord.scopes || ["identify", "guilds"]).join(" ");

    if (!CLIENT_ID || !REDIRECT_URI) {
      throw new Error("Discord OAuth not configured (missing clientId/redirectUri)");
    }

    const state = issueState(res);
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
    const REDIRECT_URI = config.discord.redirectUri;

    if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
      throw new Error("Discord OAuth not configured (missing clientId/clientSecret/redirectUri)");
    }

    const { code, state } = req.query;
    const saved = req.cookies && req.cookies.oauth_state;
    if (!code || !state || !saved || state !== saved) {
      console.warn("[auth/callback] State mismatch", { hasCode: !!code });
      return res.redirect("/?error=state_mismatch");
    }

    const body = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "authorization_code",
      code: String(code),
      redirect_uri: REDIRECT_URI,
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
    res.clearCookie("oauth_state", {
      httpOnly: true,
      secure: !!config.jwt.cookieSecure,
      sameSite: config.jwt.cookieSameSite || "lax",
      domain: getCookieDomain(),
      path: "/",
    });

    const successRedirect =
      (config.ui && config.ui.successRedirect) || "https://slimyai.xyz/dashboard";
    return res.redirect(successRedirect);
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

  try {
    const prisma = prismaDatabase.getClient();

    console.log(`[auth/me] req.user keys: ${Object.keys(req.user || {}).join(",")}`);
    console.log(`[auth/me] rawUser keys: ${Object.keys(rawUser || {}).join(",")}`);
    console.log(`[auth/me] Lookup User ID: ${userId}`);

    if (!userId) {
      console.warn("[auth/me] Missing userId on session user payload:", rawUser);
      return res.json({ id: null, username: "Guest", guilds: [], sessionGuilds: [] });
    }

    const dbUser = await prisma.user.findUnique({
      where: { discordId: String(userId) },
    });

    console.log(`[auth/me] DB User Found: ${!!dbUser}`);

    let sessionGuilds = [];
    if (dbUser) {
      // Fetch UserGuilds AND JOIN Guild
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
    } else {
      // Fallback: Use cookie guilds if available (will lack names)
      // But ensure we at least pass the ID
      const cookieGuilds = rawUser.guilds || [];
      console.warn("[auth/me] Fallback to cookie guilds:", cookieGuilds.length);
      sessionGuilds = cookieGuilds.map((g) => ({
        id: g.id,
        roles: g.roles,
        name: "Unknown (Not in DB)",
        installed: false,
      }));
    }

    const response = {
      id: dbUser?.discordId || userId,
      discordId: dbUser?.discordId || userId,
      username: dbUser?.username || rawUser.username || "Unknown",
      globalName: dbUser?.globalName || rawUser.globalName,
      avatar: dbUser?.avatar || rawUser.avatar,
      role: rawUser.role || "member",
      sessionGuilds: sessionGuilds,
      // Legacy field for compatibility
      guilds: sessionGuilds,
    };

    return res.json(response);
  } catch (err) {
    console.error("[auth/me] CRITICAL ERROR:", err);
    console.error("[auth/me] rawUser snapshot:", rawUser);
    return res.status(500).json({
      error: "internal_error",
      id: userId || null,
      username: rawUser?.username || rawUser?.name || "Unknown",
      sessionGuilds: [],
      guilds: [],
    });
  }
});

router.post("/logout", (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

module.exports = router;
