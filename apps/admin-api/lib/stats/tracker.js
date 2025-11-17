/**
 * Stats Tracking System v1
 *
 * This module provides event tracking functionality for Slimy.ai analytics.
 * It tracks granular events across the system for metrics and dashboards.
 *
 * Standard Event Types:
 * - "chat_message"           : User chat messages
 * - "club_snapshot_created"  : Club analysis/snapshot generated
 * - "codes_lookup"          : Code/reputation lookup
 * - "command_used"          : Discord bot command usage
 * - "api_call"              : External API calls (OpenAI, etc.)
 * - "image_generated"       : AI image generation
 * - "memory_updated"        : Memory system updates
 * - "screenshot_analyzed"   : Screenshot analysis completed
 * - "user_login"            : User authentication
 * - "guild_joined"          : Bot joined a guild
 *
 * Usage:
 *   const { trackEvent } = require('./lib/stats/tracker');
 *
 *   await trackEvent({
 *     type: 'chat_message',
 *     userId: 'user123',
 *     guildId: 'guild456',
 *     value: 1,
 *     metadata: { model: 'gpt-4', tokens: 150 }
 *   });
 */

const { createLogger } = require('../src/lib/logger');
const db = require('../src/lib/database');

const logger = createLogger({ module: 'stats-tracker' });

/**
 * Track an event in the StatEvent table
 *
 * @param {Object} options - Event tracking options
 * @param {string} options.type - Event type (required)
 * @param {string} [options.guildId] - Optional guild ID
 * @param {string} [options.userId] - Optional user ID
 * @param {number} [options.value] - Optional numeric value for aggregation
 * @param {Object} [options.metadata] - Optional additional data
 * @returns {Promise<void>} - Resolves when event is tracked (errors are caught and logged)
 */
async function trackEvent({ type, guildId, userId, value, metadata }) {
  try {
    // Validate required fields
    if (!type || typeof type !== 'string') {
      throw new Error('Event type is required and must be a string');
    }

    const prisma = db.getClient();

    await prisma.statEvent.create({
      data: {
        type,
        guildId: guildId || null,
        userId: userId || null,
        value: value !== undefined && value !== null ? Number(value) : null,
        metadata: metadata || null,
      },
    });

    logger.debug({ type, guildId, userId, value }, 'Event tracked');
  } catch (error) {
    // Catch and log errors without throwing to prevent disrupting callers
    logger.error({ error, type, guildId, userId }, 'Failed to track event');
  }
}

/**
 * Get recent events of a specific type
 *
 * @param {string} type - Event type to filter by
 * @param {number} [limit=100] - Maximum number of events to return
 * @returns {Promise<Array>} - Array of StatEvent records
 */
async function getRecentEvents(type, limit = 100) {
  try {
    const prisma = db.getClient();

    const where = {};
    if (type) {
      where.type = type;
    }

    const events = await prisma.statEvent.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: Math.min(limit, 1000), // Max 1000 events
    });

    return events;
  } catch (error) {
    logger.error({ error, type, limit }, 'Failed to get recent events');
    return [];
  }
}

/**
 * Get event counts grouped by type since a specific date
 *
 * @param {Date} since - Start date for filtering events
 * @returns {Promise<Array>} - Array of { type: string, count: number } objects
 */
async function getCountsByType(since) {
  try {
    const prisma = db.getClient();

    const where = {};
    if (since) {
      where.createdAt = {
        gte: new Date(since),
      };
    }

    const results = await prisma.statEvent.groupBy({
      by: ['type'],
      where,
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    return results.map(result => ({
      type: result.type,
      count: result._count.id,
    }));
  } catch (error) {
    logger.error({ error, since }, 'Failed to get counts by type');
    return [];
  }
}

/**
 * Get aggregate statistics for a specific event type
 *
 * @param {Object} options - Query options
 * @param {string} options.type - Event type to filter by
 * @param {Date} [options.since] - Start date for filtering
 * @param {Date} [options.until] - End date for filtering
 * @param {string} [options.guildId] - Optional guild filter
 * @param {string} [options.userId] - Optional user filter
 * @returns {Promise<Object>} - Aggregate stats (count, sum, avg, min, max)
 */
async function getAggregateStats({ type, since, until, guildId, userId }) {
  try {
    const prisma = db.getClient();

    const where = {};
    if (type) where.type = type;
    if (guildId) where.guildId = guildId;
    if (userId) where.userId = userId;

    if (since || until) {
      where.createdAt = {};
      if (since) where.createdAt.gte = new Date(since);
      if (until) where.createdAt.lte = new Date(until);
    }

    const [count, aggregates] = await Promise.all([
      prisma.statEvent.count({ where }),
      prisma.statEvent.aggregate({
        where,
        _sum: { value: true },
        _avg: { value: true },
        _min: { value: true },
        _max: { value: true },
      }),
    ]);

    return {
      count,
      sum: aggregates._sum.value || 0,
      avg: aggregates._avg.value || 0,
      min: aggregates._min.value || 0,
      max: aggregates._max.value || 0,
    };
  } catch (error) {
    logger.error({ error, type, since, until }, 'Failed to get aggregate stats');
    return {
      count: 0,
      sum: 0,
      avg: 0,
      min: 0,
      max: 0,
    };
  }
}

/**
 * Get time-series data for charting
 * Groups events by time intervals (hour, day, week, month)
 *
 * @param {Object} options - Query options
 * @param {string} options.type - Event type to filter by
 * @param {string} [options.interval='day'] - Time interval (hour, day, week, month)
 * @param {Date} options.since - Start date
 * @param {Date} [options.until] - End date (defaults to now)
 * @returns {Promise<Array>} - Array of { timestamp: string, count: number, value: number }
 */
async function getTimeSeries({ type, interval = 'day', since, until }) {
  try {
    const prisma = db.getClient();

    // PostgreSQL date_trunc function mapping
    const truncMap = {
      hour: 'hour',
      day: 'day',
      week: 'week',
      month: 'month',
    };

    const truncInterval = truncMap[interval] || 'day';

    const where = {};
    if (type) where.type = type;

    where.createdAt = {
      gte: new Date(since),
      lte: until ? new Date(until) : new Date(),
    };

    // Use raw query for date_trunc grouping
    const results = await prisma.$queryRaw`
      SELECT
        DATE_TRUNC(${truncInterval}, created_at) as timestamp,
        COUNT(*)::int as count,
        COALESCE(SUM(value), 0)::float as total_value,
        COALESCE(AVG(value), 0)::float as avg_value
      FROM stat_events
      WHERE
        ${type ? prisma.Prisma.sql`type = ${type}` : prisma.Prisma.sql`1=1`}
        AND created_at >= ${new Date(since)}
        AND created_at <= ${until ? new Date(until) : new Date()}
      GROUP BY DATE_TRUNC(${truncInterval}, created_at)
      ORDER BY timestamp ASC
    `;

    return results.map(row => ({
      timestamp: row.timestamp.toISOString(),
      count: row.count,
      totalValue: row.total_value,
      avgValue: row.avg_value,
    }));
  } catch (error) {
    logger.error({ error, type, interval, since }, 'Failed to get time series data');
    return [];
  }
}

module.exports = {
  trackEvent,
  getRecentEvents,
  getCountsByType,
  getAggregateStats,
  getTimeSeries,
};
