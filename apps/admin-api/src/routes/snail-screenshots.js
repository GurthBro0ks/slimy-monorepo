"use strict";

/**
 * Snail Screenshots Routes
 *
 * Handles screenshot analysis viewing endpoints.
 * This is a read-only endpoint that returns the latest analyzed screenshots.
 *
 * Protected: All routes require authentication
 */

const express = require("express");
const { getLatestSnailAnalysisForUser } = require("../services/snail-screenshots");
const { apiHandler } = require("../lib/errors");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Protected: All snail screenshot routes require authentication
router.use(requireAuth);

/**
 * GET /api/snail/screenshots/latest
 *
 * Returns the latest screenshot analysis for the current user/guild.
 *
 * Protected: Requires authentication via requireAuth middleware
 *
 * Query parameters:
 *   - guildId (optional): Override guild ID for testing
 *
 * Response:
 *   - analysis: object
 *     - runId: string | null - Timestamp or ID of the analysis run
 *     - guildId: string | null - Discord guild ID
 *     - userId: string | null - Discord user ID
 *     - results: array - Array of screenshot analysis objects
 *
 * Errors:
 *   - 401: unauthorized - Not authenticated
 *   - 500: server_error - Internal server error
 */
router.get(
  "/snail/screenshots/latest",
  apiHandler(async (req, res) => {
    // User is guaranteed to exist due to requireAuth middleware
    const userId = req.user.id;

    // TODO: Implement guild-specific filtering when guild context is available
    // For now, allow optional guildId from query params for testing
    const guildId = req.query.guildId || req.guild?.id || null;

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
