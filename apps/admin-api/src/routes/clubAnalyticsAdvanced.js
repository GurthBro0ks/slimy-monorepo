"use strict";

/**
 * Club Analytics v2 Advanced Routes
 *
 * Provides endpoints for weekly analytics, deltas, tiers, and badges.
 */

const express = require("express");
const router = express.Router();
const database = require("../lib/database");
const {
  computeWeeklyDeltasForGuild,
  getWeeklyDeltasForGuild,
  getWeekStart,
  getWeekEnd,
} = require("../services/clubAnalytics/deltas");
const { getAllBadgeMetadata, getBadgeMetadata } = require("../services/clubAnalytics/badges");

/**
 * GET /api/club-analytics/advanced/weekly
 *
 * Get weekly analytics for a guild, including member deltas, tiers, and badges
 *
 * Query params:
 * - guildId (required): Guild ID (internal database ID)
 * - weekStart (optional): ISO date string for the week to analyze
 * - compute (optional): If "true", recompute deltas instead of using cached data
 */
router.get("/weekly", async (req, res) => {
  try {
    const { guildId, weekStart: weekStartParam, compute } = req.query;

    if (!guildId) {
      return res.status(400).json({
        error: "Missing required parameter: guildId",
      });
    }

    // Validate that guild exists
    const guild = await database.findGuildById(guildId);
    if (!guild) {
      return res.status(404).json({
        error: "Guild not found",
      });
    }

    const weekStartDate = weekStartParam ? new Date(weekStartParam) : null;
    const weekStart = weekStartDate ? getWeekStart(weekStartDate) : getWeekStart(new Date());
    const weekEnd = getWeekEnd(weekStart);

    let members;
    let snapshotIds = [];

    if (compute === "true") {
      // Recompute deltas
      const computedDeltas = await computeWeeklyDeltasForGuild(guildId, {
        weekStart,
        saveToDb: true,
      });

      members = computedDeltas.map(delta => ({
        memberKey: delta.memberKey,
        displayName: delta.displayName,
        rank: delta.rank,
        totalPower: delta.currentPower?.toString() || "0",
        powerDelta: delta.powerDelta?.toString() || "0",
        simBalance: delta.currentSimBalance?.toString() || null,
        simDelta: delta.simDelta?.toString() || null,
        tier: delta.tier,
        badges: delta.badges || [],
      }));

      // Get snapshot IDs for reference
      const prisma = database.getClient();
      const snapshots = await prisma.clubSnapshot.findMany({
        where: {
          guildId,
          snapshotDate: {
            lte: weekEnd,
          },
        },
        orderBy: {
          snapshotDate: 'desc',
        },
        take: 2,
        select: {
          id: true,
          snapshotDate: true,
        },
      });
      snapshotIds = snapshots.map(s => ({ id: s.id, date: s.snapshotDate }));
    } else {
      // Use cached data
      const cachedDeltas = await getWeeklyDeltasForGuild(guildId, {
        weekStart: weekStartDate,
      });

      if (cachedDeltas.length === 0) {
        return res.status(200).json({
          guildId,
          weekStart: weekStart.toISOString(),
          weekEnd: weekEnd.toISOString(),
          members: [],
          snapshotIds: [],
          message: "No data available for this week. Try adding ?compute=true to generate analytics.",
        });
      }

      members = cachedDeltas.map(delta => ({
        memberKey: delta.memberKey,
        displayName: delta.displayName,
        rank: delta.rank,
        totalPower: delta.currentPower,
        powerDelta: delta.powerDelta,
        simBalance: delta.currentSimBalance,
        simDelta: delta.simDelta,
        tier: delta.tier,
        badges: delta.badges || [],
      }));
    }

    return res.status(200).json({
      guildId,
      guildName: guild.name,
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      members,
      snapshotIds,
      totalMembers: members.length,
    });
  } catch (error) {
    console.error("[clubAnalyticsAdvanced] Error in /weekly:", error);
    return res.status(500).json({
      error: "Failed to fetch weekly analytics",
      message: error.message,
    });
  }
});

/**
 * GET /api/club-analytics/advanced/badges
 *
 * Get metadata for all available badges
 */
router.get("/badges", async (req, res) => {
  try {
    const badges = getAllBadgeMetadata();
    return res.status(200).json({
      badges,
    });
  } catch (error) {
    console.error("[clubAnalyticsAdvanced] Error in /badges:", error);
    return res.status(500).json({
      error: "Failed to fetch badge metadata",
      message: error.message,
    });
  }
});

/**
 * GET /api/club-analytics/advanced/badges/:badgeId
 *
 * Get metadata for a specific badge
 */
router.get("/badges/:badgeId", async (req, res) => {
  try {
    const { badgeId } = req.params;
    const badge = getBadgeMetadata(badgeId);
    return res.status(200).json({
      badge,
    });
  } catch (error) {
    console.error("[clubAnalyticsAdvanced] Error in /badges/:badgeId:", error);
    return res.status(500).json({
      error: "Failed to fetch badge metadata",
      message: error.message,
    });
  }
});

/**
 * POST /api/club-analytics/advanced/compute
 *
 * Manually trigger computation of weekly deltas for a guild
 *
 * Body:
 * - guildId (required): Guild ID
 * - weekStart (optional): ISO date string
 */
router.post("/compute", async (req, res) => {
  try {
    const { guildId, weekStart: weekStartParam } = req.body;

    if (!guildId) {
      return res.status(400).json({
        error: "Missing required field: guildId",
      });
    }

    // Validate that guild exists
    const guild = await database.findGuildById(guildId);
    if (!guild) {
      return res.status(404).json({
        error: "Guild not found",
      });
    }

    const weekStartDate = weekStartParam ? new Date(weekStartParam) : null;
    const computedDeltas = await computeWeeklyDeltasForGuild(guildId, {
      weekStart: weekStartDate,
      saveToDb: true,
    });

    return res.status(200).json({
      success: true,
      guildId,
      computed: computedDeltas.length,
      message: `Successfully computed ${computedDeltas.length} member deltas`,
    });
  } catch (error) {
    console.error("[clubAnalyticsAdvanced] Error in /compute:", error);
    return res.status(500).json({
      error: "Failed to compute weekly deltas",
      message: error.message,
    });
  }
});

/**
 * GET /api/club-analytics/advanced/weeks
 *
 * Get available weeks with analytics data for a guild
 *
 * Query params:
 * - guildId (required): Guild ID
 */
router.get("/weeks", async (req, res) => {
  try {
    const { guildId } = req.query;

    if (!guildId) {
      return res.status(400).json({
        error: "Missing required parameter: guildId",
      });
    }

    const prisma = database.getClient();
    const weeks = await prisma.clubWeeklyDelta.findMany({
      where: { guildId },
      select: {
        weekStart: true,
        weekEnd: true,
      },
      distinct: ['weekStart'],
      orderBy: {
        weekStart: 'desc',
      },
    });

    return res.status(200).json({
      guildId,
      weeks: weeks.map(w => ({
        weekStart: w.weekStart.toISOString(),
        weekEnd: w.weekEnd.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[clubAnalyticsAdvanced] Error in /weeks:", error);
    return res.status(500).json({
      error: "Failed to fetch available weeks",
      message: error.message,
    });
  }
});

module.exports = router;
