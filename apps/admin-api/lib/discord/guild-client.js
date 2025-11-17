"use strict";

const fetch = require("node-fetch");
const logger = require("../logger");
const cacheManager = require("../cache/cache-manager");

const DISCORD_API_BASE = "https://discord.com/api/v10";
const CACHE_TTL = 300; // 5 minutes

class GuildClient {
  /**
   * Fetch guilds from Discord API using bot token
   * @param {string} botToken - Discord bot token
   * @param {Object} options - Fetch options
   * @param {boolean} options.useCache - Use cached results if available (default: true)
   * @param {string} options.userId - User ID for logging ownership (optional)
   * @returns {Promise<Array>} Array of guild objects
   */
  async fetchGuilds(botToken, options = {}) {
    const { useCache = true, userId = null } = options;

    if (!botToken) {
      throw new Error("Bot token is required");
    }

    // Sanitize token for logging (show only first/last 4 chars)
    const tokenPreview = botToken.length > 8
      ? `${botToken.slice(0, 4)}...${botToken.slice(-4)}`
      : "****";

    const cacheKey = `discord:guilds:${botToken.slice(-8)}`;

    // Try cache first
    if (useCache) {
      const cached = await cacheManager.get(cacheKey);
      if (cached) {
        logger.info(`[guild-client] Retrieved ${cached.length} guilds from cache`, {
          userId,
          tokenPreview,
        });
        return cached;
      }
    }

    try {
      logger.info("[guild-client] Fetching guilds from Discord API", {
        userId,
        tokenPreview,
      });

      const response = await fetch(`${DISCORD_API_BASE}/users/@me/guilds`, {
        method: "GET",
        headers: {
          Authorization: `Bot ${botToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error("[guild-client] Discord API request failed", {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          userId,
        });

        if (response.status === 401) {
          throw new Error("Invalid bot token");
        } else if (response.status === 429) {
          throw new Error("Rate limited by Discord API");
        } else {
          throw new Error(`Discord API error: ${response.status} ${response.statusText}`);
        }
      }

      const guilds = await response.json();

      if (!Array.isArray(guilds)) {
        logger.error("[guild-client] Unexpected response format from Discord", {
          type: typeof guilds,
          userId,
        });
        throw new Error("Unexpected response format from Discord API");
      }

      // Log guild ownership per user
      logger.info(`[guild-client] Fetched ${guilds.length} guilds from Discord`, {
        userId,
        guildCount: guilds.length,
        guildIds: guilds.map(g => g.id),
        guildNames: guilds.map(g => g.name),
        tokenPreview,
      });

      // Cache for per-user ownership tracking
      if (userId) {
        const userGuildCacheKey = `discord:user:${userId}:guilds`;
        await cacheManager.set(userGuildCacheKey, guilds, CACHE_TTL);
        logger.info("[guild-client] Cached guilds for user", {
          userId,
          guildCount: guilds.length,
        });
      }

      // Cache the result
      await cacheManager.set(cacheKey, guilds, CACHE_TTL);

      return guilds;
    } catch (error) {
      if (error.message.includes("Invalid bot token") ||
          error.message.includes("Rate limited") ||
          error.message.includes("Discord API error")) {
        throw error;
      }

      logger.error("[guild-client] Failed to fetch guilds", {
        error: error.message,
        stack: error.stack,
        userId,
      });
      throw new Error(`Failed to fetch guilds from Discord: ${error.message}`);
    }
  }

  /**
   * Fetch a single guild by ID
   * @param {string} botToken - Discord bot token
   * @param {string} guildId - Discord guild ID
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} Guild object
   */
  async fetchGuild(botToken, guildId, options = {}) {
    const { userId = null } = options;

    if (!botToken) {
      throw new Error("Bot token is required");
    }

    if (!guildId) {
      throw new Error("Guild ID is required");
    }

    try {
      logger.info("[guild-client] Fetching guild from Discord API", {
        guildId,
        userId,
      });

      const response = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}`, {
        method: "GET",
        headers: {
          Authorization: `Bot ${botToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Guild not found or bot is not a member");
        } else if (response.status === 401) {
          throw new Error("Invalid bot token");
        } else if (response.status === 403) {
          throw new Error("Bot does not have access to this guild");
        }
        throw new Error(`Discord API error: ${response.status}`);
      }

      const guild = await response.json();

      logger.info("[guild-client] Fetched guild from Discord", {
        guildId: guild.id,
        guildName: guild.name,
        userId,
      });

      return guild;
    } catch (error) {
      logger.error("[guild-client] Failed to fetch guild", {
        guildId,
        error: error.message,
        userId,
      });
      throw error;
    }
  }

  /**
   * Clear cache for guilds
   * @param {string} botToken - Discord bot token (optional)
   * @param {string} userId - User ID (optional)
   */
  async clearCache(botToken = null, userId = null) {
    const keys = [];

    if (botToken) {
      keys.push(`discord:guilds:${botToken.slice(-8)}`);
    }

    if (userId) {
      keys.push(`discord:user:${userId}:guilds`);
    }

    for (const key of keys) {
      await cacheManager.del(key);
    }

    logger.info("[guild-client] Cleared guild cache", {
      keys: keys.length,
      userId,
    });
  }
}

module.exports = new GuildClient();
