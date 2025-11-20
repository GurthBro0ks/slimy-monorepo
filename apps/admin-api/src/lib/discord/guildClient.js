"use strict";

/**
 * Discord Guild Client - v1
 *
 * This is the first version of the guild sync system. It provides basic functionality
 * to fetch guilds from Discord's API and sync them to the database.
 *
 * Future enhancements can include:
 * - Member syncing
 * - Role syncing
 * - Channel information
 * - Real-time Discord events via Gateway
 */

const { logger } = require("../logger");
const database = require("../database");

// Discord API base URL
const DISCORD_API_BASE = "https://discord.com/api/v10";

/**
 * Get guilds that the bot is a member of
 * @returns {Promise<Array<{ id: string; name: string; iconUrl?: string; ownerId?: string }>>}
 */
async function getBotGuilds() {
  const token = process.env.DISCORD_BOT_TOKEN;

  if (!token) {
    logger.warn("DISCORD_BOT_TOKEN not configured - guild sync unavailable");
    return [];
  }

  try {
    // TODO: Add pagination support for bots in 100+ guilds
    // Discord returns up to 200 guilds per request
    // Use ?after=<guild_id> query parameter for pagination
    const response = await fetch(`${DISCORD_API_BASE}/users/@me/guilds`, {
      method: "GET",
      headers: {
        "Authorization": `Bot ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error({
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      }, "Failed to fetch guilds from Discord API");
      throw new Error(`Discord API error: ${response.status} ${response.statusText}`);
    }

    const guilds = await response.json();

    logger.info(`Fetched ${guilds.length} guilds from Discord API`);

    // Map Discord guild data to our simplified format
    return guilds.map(guild => ({
      id: guild.id,
      name: guild.name,
      iconUrl: guild.icon
        ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
        : null,
      ownerId: guild.owner_id || null,
    }));
  } catch (error) {
    logger.error({ error: error.message }, "Error fetching guilds from Discord");
    throw error;
  }
}

/**
 * Sync guilds from Discord to the database
 * This performs an upsert operation - creating new guilds or updating existing ones
 * @returns {Promise<{ syncedCount: number; total: number; errors: Array }>}
 */
async function syncGuildsToDb() {
  const log = logger.child({ operation: "syncGuildsToDb" });

  try {
    log.info("Starting guild sync from Discord");

    const botGuilds = await getBotGuilds();

    if (botGuilds.length === 0) {
      log.warn("No guilds to sync");
      return { syncedCount: 0, total: 0, errors: [] };
    }

    const db = database.getClient();
    let syncedCount = 0;
    const errors = [];

    // Sync each guild to the database
    for (const guild of botGuilds) {
      try {
        await db.guild.upsert({
          where: { discordId: guild.id },
          update: {
            name: guild.name,
            iconUrl: guild.iconUrl,
            ownerId: guild.ownerId,
            updatedAt: new Date(),
          },
          create: {
            discordId: guild.id,
            name: guild.name,
            iconUrl: guild.iconUrl,
            ownerId: guild.ownerId,
            settings: {},
          },
        });

        syncedCount++;
        log.debug({ guildId: guild.id, guildName: guild.name }, "Synced guild");
      } catch (error) {
        log.error({
          guildId: guild.id,
          guildName: guild.name,
          error: error.message,
        }, "Failed to sync guild");

        errors.push({
          guildId: guild.id,
          guildName: guild.name,
          error: error.message,
        });
      }
    }

    log.info({
      syncedCount,
      total: botGuilds.length,
      errorCount: errors.length,
    }, "Guild sync completed");

    return {
      syncedCount,
      total: botGuilds.length,
      errors,
    };
  } catch (error) {
    log.error({ error: error.message }, "Guild sync failed");
    throw error;
  }
}

module.exports = {
  getBotGuilds,
  syncGuildsToDb,
};
