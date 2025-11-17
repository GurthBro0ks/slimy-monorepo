"use strict";

const express = require("express");
const router = express.Router();
const { chooseTab, readStats } = require("../../lib/sheets");
const { cacheStats } = require("../middleware/cache");
const { stats } = require("../lib/validation/schemas");
const { apiHandler } = require("../lib/errors");
const config = require("../lib/config");
const { requireCsrf } = require("../middleware/csrf");
const { trackEvent, getRecentEvents, getCountsByType, getAggregateStats } = require("../../lib/stats/tracker");
const { createLogger } = require("../lib/logger");

const logger = createLogger({ module: 'stats-routes' });
const SHEET_ID = config.google.statsSheetId;
const PINNED = config.google.statsBaselineTitle;

// New StatEvent tracking endpoints

/**
 * GET /api/stats/events/summary - Get event counts by type
 * Query params:
 *   - since: ISO date string (optional, defaults to 7 days ago)
 */
router.get("/events/summary", async (req, res) => {
  try {
    const since = req.query.since
      ? new Date(req.query.since)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default: 7 days ago

    const counts = await getCountsByType(since);

    res.json({
      success: true,
      since: since.toISOString(),
      counts,
      total: counts.reduce((sum, item) => sum + item.count, 0),
    });
  } catch (error) {
    logger.error({ error, query: req.query }, 'Failed to get event summary');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch event summary',
    });
  }
});

/**
 * GET /api/stats/events/recent - Get recent events
 * Query params:
 *   - type: Event type to filter by (optional)
 *   - limit: Max number of events (optional, default 50, max 1000)
 */
router.get("/events/recent", async (req, res) => {
  try {
    const type = req.query.type || null;
    const limit = req.query.limit ? Math.min(parseInt(req.query.limit), 1000) : 50;

    const events = await getRecentEvents(type, limit);

    res.json({
      success: true,
      type,
      limit,
      count: events.length,
      events,
    });
  } catch (error) {
    logger.error({ error, query: req.query }, 'Failed to get recent events');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent events',
    });
  }
});

/**
 * GET /api/stats/events/aggregate - Get aggregate statistics for an event type
 * Query params:
 *   - type: Event type (required)
 *   - since: ISO date string (optional)
 *   - until: ISO date string (optional)
 *   - guildId: Guild filter (optional)
 *   - userId: User filter (optional)
 */
router.get("/events/aggregate", async (req, res) => {
  try {
    const { type, since, until, guildId, userId } = req.query;

    if (!type) {
      return res.status(400).json({
        success: false,
        error: 'Event type is required',
      });
    }

    const stats = await getAggregateStats({
      type,
      since: since ? new Date(since) : undefined,
      until: until ? new Date(until) : undefined,
      guildId,
      userId,
    });

    res.json({
      success: true,
      type,
      stats,
    });
  } catch (error) {
    logger.error({ error, query: req.query }, 'Failed to get aggregate stats');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch aggregate statistics',
    });
  }
});

/**
 * POST /api/stats/events/track - Track a new event
 * Body:
 *   - type: Event type (required)
 *   - guildId: Guild ID (optional)
 *   - userId: User ID (optional)
 *   - value: Numeric value (optional)
 *   - metadata: Additional data (optional)
 */
router.post("/events/track", requireCsrf, async (req, res) => {
  try {
    const { type, guildId, userId, value, metadata } = req.body;

    if (!type) {
      return res.status(400).json({
        success: false,
        error: 'Event type is required',
      });
    }

    await trackEvent({ type, guildId, userId, value, metadata });

    res.json({
      success: true,
      message: 'Event tracked successfully',
    });
  } catch (error) {
    logger.error({ error, body: req.body }, 'Failed to track event');
    res.status(500).json({
      success: false,
      error: 'Failed to track event',
    });
  }
});

// Legacy Google Sheets stats endpoints
if (!SHEET_ID) {
  // Soft-fail route if not configured
  router.get("/summary", (_req, res) => res.status(500).json({ error: "missing_sheet_id", message: "STATS_SHEET_ID not configured in environment" }));
} else {
  router.get("/summary", stats.summary, cacheStats(600), apiHandler(async (req, res) => {
    // priority: explicit ?title= → ?tab=baseline/latest → pinned → newest baseline → latest
    const qTitle = (req.query.title || "").toString().trim();
    const qTab = (req.query.tab || "").toString().trim().toLowerCase();
    let title = qTitle || null;

    if (!title) {
      if (qTab === "baseline") title = PINNED;
      if (qTab === "latest") title = "Club Latest";
    }

    const selected = await chooseTab(SHEET_ID, title || PINNED);
    if (!selected) {
      res.status(404).json({ error: "no_tabs_found" });
      return;
    }

    const statsData = await readStats(SHEET_ID, selected);
    return { ok: true, selected, pinned: PINNED, stats: statsData };
  }, { routeName: "stats/summary" }));
}

module.exports = router;
