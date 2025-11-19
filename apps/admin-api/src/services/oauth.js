"use strict";

const config = require("../config");
const { logger, isDebug, logDebug, redactSecrets } = require("../lib/logger");

const DISCORD_API_BASE = "https://discord.com/api/v10";

function buildAuthorizeUrl(state) {
  const params = new URLSearchParams({
    client_id: config.discord.clientId,
    redirect_uri: config.discord.redirectUri,
    response_type: "code",
    scope: config.discord.scopes.join(" "),
    state,
    prompt: "consent",
  });

  // Debug: Log OAuth flow initiation
  if (isDebug()) {
    logDebug(logger, {
      state,
      redirectUri: config.discord.redirectUri,
      scopes: config.discord.scopes,
      clientId: config.discord.clientId.substring(0, 8) + "...", // Partial ID for debugging
    }, "[DEBUG] Building Discord OAuth authorize URL");
  }

  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}

async function exchangeCode(code) {
  const startTime = Date.now();

  // Debug: Log token exchange attempt
  if (isDebug()) {
    logDebug(logger, {
      codePrefix: code.substring(0, 10) + "...",
      endpoint: `${DISCORD_API_BASE}/oauth2/token`,
    }, "[DEBUG] Exchanging OAuth code for access token");
  }

  const body = new URLSearchParams({
    client_id: config.discord.clientId,
    client_secret: config.discord.clientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: config.discord.redirectUri,
  });

  const response = await fetch(`${DISCORD_API_BASE}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const duration = Date.now() - startTime;

  if (!response.ok) {
    const text = await response.text();
    logger.warn("[admin-api] Discord token exchange failed", {
      status: response.status,
      text,
    });

    // Debug: Log failure details
    if (isDebug()) {
      logDebug(logger, {
        status: response.status,
        duration,
        headers: Object.fromEntries(response.headers.entries()),
      }, "[DEBUG] Token exchange failed with details");
    }

    throw new Error("Failed to exchange code with Discord");
  }

  const tokenData = await response.json();

  // Debug: Log successful exchange (with redacted tokens)
  if (isDebug()) {
    logDebug(logger, {
      duration,
      tokenType: tokenData.token_type,
      expiresIn: tokenData.expires_in,
      scope: tokenData.scope,
      hasAccessToken: !!tokenData.access_token,
      hasRefreshToken: !!tokenData.refresh_token,
    }, "[DEBUG] Token exchange successful");
  }

  return tokenData;
}

async function fetchDiscord(endpoint, accessToken) {
  const response = await fetch(`${DISCORD_API_BASE}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    logger.warn("[admin-api] Discord API request failed", {
      endpoint,
      status: response.status,
      text,
    });
    throw new Error(`Discord API request failed (${response.status})`);
  }

  return response.json();
}

function transformUser(raw) {
  return {
    id: raw.id,
    username: raw.username,
    globalName: raw.global_name || null,
    avatar: raw.avatar || null,
    discriminator: raw.discriminator,
  };
}

function transformGuild(raw) {
  return {
    id: raw.id,
    name: raw.name,
    permissions: raw.permissions, // string bitfield
    owner: Boolean(raw.owner),
  };
}

async function fetchUserProfile(accessToken) {
  const raw = await fetchDiscord("/users/@me", accessToken);
  const user = transformUser(raw);

  // Debug: Log user profile fetch success
  if (isDebug()) {
    logDebug(logger, {
      userId: user.id,
      username: user.username,
      hasAvatar: !!user.avatar,
      hasGlobalName: !!user.globalName,
    }, "[DEBUG] Fetched Discord user profile");
  }

  return user;
}

async function fetchUserGuilds(accessToken) {
  const rawGuilds = await fetchDiscord("/users/@me/guilds", accessToken);
  return rawGuilds.map(transformGuild);
}

module.exports = {
  buildAuthorizeUrl,
  exchangeCode,
  fetchUserProfile,
  fetchUserGuilds,
};
