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
    const sanitized = Array.isArray(guilds)
      ? guilds.map((guild) => ({
          id: guild.id,
          name: guild.name,
          icon: guild.icon,
          permissions: guild.permissions,
        }))
      : [];

    return res.json({ guilds: sanitized });
  } catch (err) {
    console.error("[discord/guilds] failed to fetch guilds", err);
    return res.status(500).json({ error: "server_error" });
  }
});

module.exports = router;

