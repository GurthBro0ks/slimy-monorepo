"use strict";

/**
 * Stats Tracker
 *
 * Simple stats tracking system that records events to the database.
 * Used by the event bus to track important application events.
 */

const logger = require('../../src/lib/logger');

class StatsTracker {
  constructor(database) {
    this.db = database;
  }

  /**
   * Track an event
   * @param {string} eventType - Type of event (e.g., 'chat_message', 'club_snapshot')
   * @param {Object} options - Event options
   * @param {string} [options.userId] - User ID
   * @param {string} [options.guildId] - Guild ID
   * @param {any} [options.metadata] - Additional metadata
   * @returns {Promise<void>}
   */
  async trackEvent(eventType, { userId, guildId, metadata } = {}) {
    try {
      if (!this.db || !this.db.isInitialized) {
        logger.warn({ eventType }, 'Database not initialized, skipping stats tracking');
        return;
      }

      const prisma = this.db.getClient();
      await prisma.stat.create({
        data: {
          type: eventType,
          userId: userId || null,
          guildId: guildId || null,
          value: metadata || {},
          timestamp: new Date(),
        },
      });

      logger.debug({ eventType, userId, guildId }, 'Stats event tracked');
    } catch (error) {
      // Best-effort - don't throw
      logger.error({
        error: error.message,
        eventType,
        userId,
        guildId,
        stack: error.stack
      }, 'Failed to track stats event');
    }
  }

  /**
   * Query events from stats table
   * @param {Object} query - Query parameters
   * @returns {Promise<Array>}
   */
  async queryEvents(query = {}) {
    const prisma = this.db.getClient();
    const where = {};

    if (query.eventType) where.type = query.eventType;
    if (query.userId) where.userId = query.userId;
    if (query.guildId) where.guildId = query.guildId;
    if (query.startDate || query.endDate) {
      where.timestamp = {};
      if (query.startDate) where.timestamp.gte = new Date(query.startDate);
      if (query.endDate) where.timestamp.lte = new Date(query.endDate);
    }

    return await prisma.stat.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: query.limit || 1000,
      skip: query.offset || 0,
    });
  }

  /**
   * Get aggregated stats
   * @param {Object} query - Query parameters
   * @returns {Promise<Object>}
   */
  async getAggregates(query = {}) {
    const events = await this.queryEvents(query);

    // Simple aggregation by type
    const aggregates = {};
    for (const event of events) {
      if (!aggregates[event.type]) {
        aggregates[event.type] = 0;
      }
      aggregates[event.type]++;
    }

    return aggregates;
  }

  /**
   * Get user activity
   * @param {string} userId - User ID
   * @param {number} days - Number of days to look back
   * @returns {Promise<Array>}
   */
  async getUserActivity(userId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await this.queryEvents({
      userId,
      startDate: startDate.toISOString(),
    });
  }

  /**
   * Get system metrics
   * @param {number} days - Number of days to look back
   * @returns {Promise<Object>}
   */
  async getSystemMetrics(days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const events = await this.queryEvents({
      startDate: startDate.toISOString(),
    });

    return {
      totalEvents: events.length,
      eventsByType: await this.getAggregates({ startDate: startDate.toISOString() }),
      timeRange: { start: startDate, end: new Date() },
    };
  }

  /**
   * Get summary stats
   * @param {Object} query - Query parameters
   * @returns {Promise<Object>}
   */
  async getSummary(query = {}) {
    const events = await this.queryEvents(query);
    const aggregates = {};

    for (const event of events) {
      if (!aggregates[event.type]) {
        aggregates[event.type] = 0;
      }
      aggregates[event.type]++;
    }

    return {
      totalEvents: events.length,
      eventTypes: Object.keys(aggregates).length,
      aggregates,
    };
  }
}

// Singleton instance
let instance = null;

/**
 * Get or create stats tracker instance
 * @param {any} database - Database instance
 * @returns {StatsTracker}
 */
function getStatsTracker(database) {
  if (!instance) {
    instance = new StatsTracker(database);
  }
  return instance;
}

module.exports = {
  StatsTracker,
  getStatsTracker,
};
