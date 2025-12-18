"use strict";

const express = require("express");
const { requireAuth } = require("../middleware/auth");
const prismaDatabase = require("../lib/database");
const { getSharedGuildsForUser } = require("../services/discord-shared-guilds");

const router = express.Router();

router.get("/guilds", requireAuth, async (req, res) => {
  try {
    await prismaDatabase.initialize();

    const lookupId = req.user.discordId || req.user.id;
    const userRecord = await prismaDatabase.findUserByDiscordId(lookupId);
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

    const guilds = await getSharedGuildsForUser({
      discordAccessToken: userRecord.discordAccessToken,
      userDiscordId: String(lookupId),
      concurrency: 4,
    });

    return res.json({ guilds });

  } catch (err) {
    const code = err?.code || err?.message || "server_error";
    if (code === "MISSING_SLIMYAI_BOT_TOKEN") {
      return res.status(500).json({ error: "MISSING_SLIMYAI_BOT_TOKEN" });
    }
    if (String(code).startsWith("discord_user_guilds_failed:") && err?.status) {
      return res.status(err.status).json({ error: "discord_fetch_failed" });
    }
    console.error("[discord/guilds] failed to fetch shared guilds", { code });
    return res.status(500).json({ error: "server_error" });
  }
});

module.exports = router;
