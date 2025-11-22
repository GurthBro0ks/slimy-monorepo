/**
 * src/routes/club.js - Club analytics endpoints
 * Provides member power metrics tracking and leaderboard
 */

"use strict";

const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { requireRole, requireGuildAccess } = require("../middleware/rbac");
const { getLatest } = require("../../lib/club-store");
const { rescanGuildClubMetrics } = require("../../lib/club-ingest");
const logger = require("../../lib/logger");

const router = express.Router({ mergeParams: true });

/**
 * GET /api/guilds/:guildId/club/latest
 * Returns latest club member metrics for a guild
 * Auth: requires authentication + guild access
 */
router.get("/latest", requireAuth, requireGuildAccess, async (req, res, next) => {
  try {
    const { guildId } = req.params;

    logger.info('Fetching latest club metrics', { guildId });

    const members = await getLatest(guildId);

    // Calculate change percentages if we have historical data
    // For now, we'll just return the latest metrics
    const formattedMembers = members.map(member => ({
      memberKey: member.member_key,
      name: member.name,
      simPower: member.sim_power,
      totalPower: member.total_power,
      changePercent: null, // TODO: Calculate from historical data
      lastSeenAt: member.last_seen_at || member.observed_at
    }));

    res.json({
      ok: true,
      guildId,
      members: formattedMembers
    });
  } catch (err) {
    logger.error('Failed to fetch latest club metrics', {
      guildId: req.params.guildId,
      error: err.message,
      stack: err.stack
    });

    next(err);
  }
});

/**
 * POST /api/guilds/:guildId/club/rescan
 * Triggers a rescan of club metrics for a guild
 * Auth: requires authentication + admin role
 */
router.post("/rescan", requireAuth, requireGuildAccess, requireRole("admin"), async (req, res, next) => {
  try {
    const { guildId } = req.params;

    logger.info('Triggering club metrics rescan', { guildId, user: req.user?.id });

    const result = await rescanGuildClubMetrics(guildId);

    res.status(202).json({
      ok: true,
      message: result.message || "Rescan scheduled",
      guildId,
      recomputedAt: result.recomputedAt
    });
  } catch (err) {
    logger.error('Failed to trigger club metrics rescan', {
      guildId: req.params.guildId,
      error: err.message,
      stack: err.stack
    });

    next(err);
  }
});

module.exports = router;
