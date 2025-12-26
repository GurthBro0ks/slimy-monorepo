"use strict";

function internalBotAuth(req, _res, next) {
  try {
    if (req.user) return next();

    const expected = String(process.env.ADMIN_API_INTERNAL_BOT_TOKEN || "").trim();
    if (!expected) return next();

    const provided =
      String(req.headers["x-slimy-internal-bot-token"] || req.headers["x-slimy-bot-token"] || "").trim();
    if (!provided || provided !== expected) return next();

    const actorDiscordId = String(req.headers["x-slimy-bot-actor-discord-id"] || "").trim();
    if (!actorDiscordId) return next();

    const interactionGuildId = String(req.headers["x-slimy-bot-interaction-guild-id"] || "").trim();
    const interactionPermissions = String(req.headers["x-slimy-bot-interaction-permissions"] || "").trim();

    req.user = {
      id: actorDiscordId,
      discordId: actorDiscordId,
      username: "bot-user",
      globalName: "bot-user",
      avatar: null,
      role: "member",
      csrfToken: expected,
      authType: "internal_bot",
      interaction: {
        guildId: interactionGuildId,
        permissions: interactionPermissions,
      },
    };

    return next();
  } catch {
    return next();
  }
}

module.exports = { internalBotAuth };

