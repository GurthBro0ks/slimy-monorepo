import { writeFile, unlink } from "fs/promises";
import { resolve } from "path";
import { fileURLToPath } from "url";

import { Client, GatewayIntentBits } from "discord.js";

import { resolveAdminApiBaseUrl } from "@slimy/admin-api-client";

import { settingsCommand, handleSettingsCommand } from "./commands/settings.js";
import { memoryCommand, handleMemoryCommand } from "./commands/memory.js";

const READY_FILE = '/tmp/slimy-bot.ready';

async function markReady() {
  try {
    await writeFile(READY_FILE, 'ready\n', 'utf8');
  } catch (error) {
    console.error('[bot] Failed to write ready file:', error);
  }
}

async function clearReady() {
  try {
    await unlink(READY_FILE);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.error('[bot] Failed to remove ready file:', error);
    }
  }
}

async function main() {
  console.log("[bot] Starting Slimy Discord Bot (v0.1 settings sync)...");

  const token = String(process.env.DISCORD_BOT_TOKEN || "").trim();
  if (!token) {
    console.error("[bot] ERROR: DISCORD_BOT_TOKEN is required");
    return;
  }

  // Fail fast on admin-api connectivity config (no localhost defaults; env must be set)
  resolveAdminApiBaseUrl(process.env);
  const internalBotToken = String(process.env.ADMIN_API_INTERNAL_BOT_TOKEN || "").trim();
  if (!internalBotToken) {
    console.error("[bot] ERROR: ADMIN_API_INTERNAL_BOT_TOKEN is required for bot -> admin-api auth");
    return;
  }

  const devGuildId = String(process.env.DISCORD_DEV_GUILD_ID || "").trim();

  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
  });

  client.once("ready", async () => {
    try {
      console.log("[bot] Logged in:", client.user?.tag || client.user?.id || "unknown");

      const commands = [settingsCommand.toJSON(), memoryCommand.toJSON()];

      if (devGuildId) {
        const guild = await client.guilds.fetch(devGuildId);
        await guild.commands.set(commands);
        console.log("[bot] Registered commands in dev guild:", devGuildId);
      } else if (client.application) {
        await client.application.commands.set(commands);
        console.log("[bot] Registered global commands");
      } else {
        console.error("[bot] client.application unavailable; cannot register commands");
      }

      await markReady();
    } catch (err) {
      console.error("[bot] Failed during ready/init:", err);
    }
  });

  client.on("interactionCreate", async (interaction) => {
    try {
      if (!interaction.isChatInputCommand()) return;

      if (interaction.commandName === "settings") {
        await handleSettingsCommand(interaction);
        return;
      }

      if (interaction.commandName === "memory") {
        await handleMemoryCommand(interaction);
        return;
      }

      await interaction.reply({ ephemeral: true, content: "Unknown command." });
    } catch (err) {
      try {
        const message = err instanceof Error ? err.message : String(err);
        if (interaction.isRepliable()) {
          if (interaction.deferred || interaction.replied) {
            await interaction.followUp({ ephemeral: true, content: `Error: ${message}` });
          } else {
            await interaction.reply({ ephemeral: true, content: `Error: ${message}` });
          }
        }
      } catch {
        /* ignore */
      }
      console.error("[bot] interaction handler failed:", err);
    }
  });

  await client.login(token);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[bot] Received SIGINT, shutting down gracefully...');
  void clearReady().finally(() => process.exit(0));
});

process.on('SIGTERM', () => {
  console.log('\n[bot] Received SIGTERM, shutting down gracefully...');
  void clearReady().finally(() => process.exit(0));
});

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

// Run if this is the main module
if (isMain) {
  main().catch(error => {
    console.error('[bot] Fatal error:', error);
    process.exit(1);
  });
}

export {};
