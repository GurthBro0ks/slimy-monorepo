"use strict";

/**
 * Snail Screenshots Routes
 *
 * Handles screenshot analysis viewing endpoints.
 * This is a read-only endpoint that returns the latest analyzed screenshots.
 *
 * TODO: Add authentication and guild-specific access control once auth is wired.
 */

const express = require("express");
const { getLatestSnailAnalysisForUser } = require("../services/snail-screenshots");
const { apiHandler } = require("../lib/errors");

const router = express.Router();

/**
 * GET /api/snail/screenshots/latest
 *
 * Returns the latest screenshot analysis for the current user/guild.
 *
 * TODO: Add authentication when ready:
 *   - requireAuth middleware
 *   - requireRole("member") middleware
 *   - requireGuildMember middleware (if guild-specific)
 *
 * Query parameters:
 *   None (user/guild context will come from auth/session later)
 *
 * Response:
 *   - analysis: object
 *     - runId: string | null - Timestamp or ID of the analysis run
 *     - guildId: string | null - Discord guild ID
 *     - userId: string | null - Discord user ID
 *     - results: array - Array of screenshot analysis objects
 *
 * Errors:
 *   - 500: server_error - Internal server error
 */
router.get(
  "/snail/screenshots/latest",
  apiHandler(async (req, res) => {
    // TODO: derive real guildId/userId from auth/session once wired
    // For now, accept them from query params for testing, or use null
    const guildId = req.query.guildId || req.guildId || null;
    const userId = req.query.userId || req.userId || null;

    const analysis = await getLatestSnailAnalysisForUser({ guildId, userId });

    // Always return a stable envelope with analysis data
    // If no data exists, return empty results array instead of error
    return {
      analysis: analysis || {
        runId: null,
        guildId,
        userId,
        results: [],
      },
    };
  }, { routeName: "snail/screenshots/latest" })
);

module.exports = router;
