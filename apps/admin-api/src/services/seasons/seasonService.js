"use strict";

const database = require("../../lib/database");

class SeasonService {
  /**
   * Get the currently active season for a guild
   * @param {string} guildId - The guild ID
   * @returns {Promise<Object|null>} Active season or null if none exists
   */
  async getCurrentSeason(guildId) {
    const season = await database.getClient().season.findFirst({
      where: {
        guildId,
        isActive: true,
      },
      include: {
        memberStats: {
          orderBy: {
            totalPowerGain: 'desc',
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    return season;
  }

  /**
   * List all seasons for a guild
   * @param {string} guildId - The guild ID
   * @returns {Promise<Array>} List of seasons
   */
  async listSeasonsForGuild(guildId) {
    const seasons = await database.getClient().season.findMany({
      where: {
        guildId,
      },
      orderBy: {
        startDate: 'desc',
      },
      include: {
        _count: {
          select: {
            memberStats: true,
          },
        },
      },
    });

    return seasons;
  }

  /**
   * Get a season by ID
   * @param {number} seasonId - The season ID
   * @returns {Promise<Object>} Season data
   */
  async getSeasonById(seasonId) {
    const season = await database.getClient().season.findUnique({
      where: { id: seasonId },
      include: {
        memberStats: {
          orderBy: {
            totalPowerGain: 'desc',
          },
        },
      },
    });

    if (!season) {
      throw new Error("Season not found");
    }

    return season;
  }

  /**
   * Create a new season
   * @param {string} guildId - The guild ID
   * @param {string} name - Season name (e.g., "Winter 2025")
   * @param {Date} startDate - Season start date
   * @param {Date} endDate - Season end date
   * @returns {Promise<Object>} Created season
   */
  async createSeason(guildId, name, startDate, endDate) {
    if (!guildId || !name || !startDate || !endDate) {
      throw new Error("Missing required fields: guildId, name, startDate, and endDate");
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error("Invalid date format");
    }

    if (start >= end) {
      throw new Error("Start date must be before end date");
    }

    try {
      const season = await database.getClient().season.create({
        data: {
          guildId,
          name,
          startDate: start,
          endDate: end,
          isActive: true,
        },
      });

      return season;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update a season
   * @param {number} seasonId - The season ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated season
   */
  async updateSeason(seasonId, updates) {
    const { name, startDate, endDate, isActive } = updates;

    if (!name && !startDate && !endDate && isActive === undefined) {
      throw new Error("No valid fields to update");
    }

    const data = {};
    if (name) data.name = name;
    if (startDate) data.startDate = new Date(startDate);
    if (endDate) data.endDate = new Date(endDate);
    if (isActive !== undefined) data.isActive = isActive;

    try {
      const season = await database.getClient().season.update({
        where: { id: seasonId },
        data,
      });

      return season;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error("Season not found");
      }
      throw error;
    }
  }

  /**
   * Close a season (set isActive to false)
   * @param {number} seasonId - The season ID
   * @returns {Promise<void>}
   */
  async closeSeason(seasonId) {
    try {
      await database.getClient().season.update({
        where: { id: seasonId },
        data: {
          isActive: false,
        },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error("Season not found");
      }
      throw error;
    }
  }

  /**
   * Delete a season
   * @param {number} seasonId - The season ID
   * @returns {Promise<Object>} Success response
   */
  async deleteSeason(seasonId) {
    try {
      // This will cascade delete member stats due to schema relations
      await database.getClient().season.delete({
        where: { id: seasonId },
      });

      return { success: true };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error("Season not found");
      }
      throw error;
    }
  }
}

module.exports = new SeasonService();
