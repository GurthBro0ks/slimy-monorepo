"use strict";

/**
 * Snail Codes Aggregator Routes
 *
 * Provides read-only access to aggregated Super Snail codes from multiple sources.
 * This endpoint does NOT require authentication or guild membership.
 *
 * Routes:
 * - GET /api/snail/codes - List all codes with optional filtering
 */

const express = require("express");
const { listSnailCodes } = require("../services/snail-codes");
const { cacheStats } = require("../middleware/cache");
const { apiHandler } = require("../lib/errors");

const router = express.Router();

/**
 * GET /api/snail/codes
 *
 * Get aggregated Super Snail codes from all sources.
 * No authentication required - this is a public read-only endpoint.
 *
 * Query parameters:
 *   - source: string (optional) - Filter by source: "snelp", "reddit", "discord", "twitter", "other"
 *   - status: string (optional) - Filter by status: "active", "expired", "unknown"
 *
 * Response:
 *   - codes: array - Array of code objects with:
 *     - code: string - The actual code
 *     - source: string - Where the code was found
 *     - status: string - Code status
 *     - notes: string (optional) - Additional notes
 *     - discoveredAt: string (optional) - ISO timestamp
 *     - lastCheckedAt: string (optional) - ISO timestamp
 *
 * Example:
 *   GET /api/snail/codes
 *   GET /api/snail/codes?source=snelp
 *   GET /api/snail/codes?status=active
 *   GET /api/snail/codes?source=reddit&status=active
 */
router.get(
  "/codes",
  cacheStats(1800, 3600), // Cache for 30 minutes, stale-while-revalidate for 1 hour
  apiHandler(
    async (req, res) => {
      const { source, status } = req.query;

      // Validate source if provided
      const validSources = ["snelp", "reddit", "discord", "twitter", "other"];
      if (source && !validSources.includes(source)) {
        res.status(400).json({
          error: "invalid_source",
          message: `Source must be one of: ${validSources.join(", ")}`,
        });
        return;
      }

      // Validate status if provided
      const validStatuses = ["active", "expired", "unknown"];
      if (status && !validStatuses.includes(status)) {
        res.status(400).json({
          error: "invalid_status",
          message: `Status must be one of: ${validStatuses.join(", ")}`,
        });
        return;
      }

      const filters = {};
      if (source) filters.source = source;
      if (status) filters.status = status;

      const codes = await listSnailCodes(filters);

      return {
        codes,
      };
    },
    { routeName: "snail-codes/list" },
  ),
);

module.exports = router;
