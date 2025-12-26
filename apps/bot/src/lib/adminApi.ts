import type { ChatInputCommandInteraction } from "discord.js";

import { createAdminApiClient, resolveAdminApiBaseUrl } from "@slimy/admin-api-client";

type BotAdminApiEnv = {
  adminApiBaseUrl: string;
  internalBotToken: string;
};

function requireBotAdminApiEnv(): BotAdminApiEnv {
  const adminApiBaseUrl = resolveAdminApiBaseUrl(process.env);
  const internalBotToken = String(process.env.ADMIN_API_INTERNAL_BOT_TOKEN || "").trim();
  if (!internalBotToken) {
    throw new Error("ADMIN_API_INTERNAL_BOT_TOKEN missing (required for bot -> admin-api auth)");
  }
  return { adminApiBaseUrl, internalBotToken };
}

export function createAdminApiClientForInteraction(interaction: ChatInputCommandInteraction) {
  const env = requireBotAdminApiEnv();
  const actorDiscordId = interaction.user.id;
  const interactionGuildId = interaction.guildId || "";
  const interactionPermissions = interaction.memberPermissions?.bitfield
    ? interaction.memberPermissions.bitfield.toString()
    : "";

  return createAdminApiClient({
    baseUrl: env.adminApiBaseUrl,
    defaultHeaders: {
      "x-slimy-internal-bot-token": env.internalBotToken,
      "x-slimy-bot-actor-discord-id": actorDiscordId,
      "x-slimy-bot-interaction-guild-id": interactionGuildId,
      ...(interactionPermissions
        ? { "x-slimy-bot-interaction-permissions": interactionPermissions }
        : null),
      "x-csrf-token": env.internalBotToken,
    },
  });
}

