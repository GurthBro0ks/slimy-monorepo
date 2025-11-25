"use strict";

const express = require("express");
const { requireAuth } = require("../middleware/auth");
const prismaDatabase = require("../lib/database");

const router = express.Router();
const DISCORD_GUILDS_URL = "https://discord.com/api/users/@me/guilds";

router.get("/guilds", requireAuth, async (req, res) => {
  try {
    await prismaDatabase.initialize();

    const userRecord = await prismaDatabase.findUserByDiscordId(req.user.id);
    if (!userRecord) {
      return res.status(404).json({ error: "user_not_found" });
    }
    if (!userRecord.discordAccessToken) {
      return res.status(400).json({ error: "missing_discord_token" });
    }

    if (
      userRecord.tokenExpiresAt &&
      new Date(userRecord.tokenExpiresAt).getTime() < Date.now()
    ) {
      // TODO: implement token refresh using refresh_token
      return res.status(401).json({ error: "discord_token_expired" });
    }

    const response = await fetch(DISCORD_GUILDS_URL, {
      headers: { Authorization: `Bearer ${userRecord.discordAccessToken}` },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      return res.status(response.status).json({
        error: "discord_fetch_failed",
        message: body || "Failed to fetch guilds from Discord",
      });
    }

    const guilds = await response.json();

    const BOT_TOKEN = (process.env.DISCORD_BOT_TOKEN || "").trim();
    let sanitized = [];

    if (BOT_TOKEN) {
      try {
        const botGuildsResponse = await fetch(`https://discord.com/api/v10/users/@me/guilds?limit=200`, {
          headers: { Authorization: `Bot ${BOT_TOKEN}` },
        });

        if (botGuildsResponse.ok) {
          const botGuilds = await botGuildsResponse.json();
          const botGuildIds = new Set(botGuilds.map((g) => g.id));

          sanitized = Array.isArray(guilds)
            ? guilds
              .filter((guild) => {
                const has = botGuildIds.has(guild.id);
                return has;
              })
              .map((guild) => ({
                id: guild.id,
                name: guild.name,
                icon: guild.icon,
                permissions: guild.permissions,
              }))
            : [];
        } else {
          console.warn("[discord/guilds] Failed to fetch bot guilds:", botGuildsResponse.status, await botGuildsResponse.text());
          // Fallback to all guilds if bot fetch fails
          sanitized = Array.isArray(guilds)
            ? guilds.map((guild) => ({
              id: guild.id,
              name: guild.name,
              icon: guild.icon,
              permissions: guild.permissions,
            }))
            : [];
        }
      } catch (err) {
        console.error("[discord/guilds] Error filtering guilds:", err);
        // Fallback
        sanitized = Array.isArray(guilds)
          ? guilds.map((guild) => ({
            id: guild.id,
            name: guild.name,
            icon: guild.icon,
            permissions: guild.permissions,
          }))
          : [];
      }
    } else {
      console.warn("[discord/guilds] DISCORD_BOT_TOKEN not configured, returning all guilds");
      sanitized = Array.isArray(guilds)
        ? guilds.map((guild) => ({
          id: guild.id,
          name: guild.name,
          icon: guild.icon,
          permissions: guild.permissions,
        }))
        : [];
    }

    return res.json({ guilds: sanitized });
  } catch (err) {
    console.error("[discord/guilds] failed to fetch guilds", err);
    return res.status(500).json({ error: "server_error" });
  }
});

module.exports = router;

