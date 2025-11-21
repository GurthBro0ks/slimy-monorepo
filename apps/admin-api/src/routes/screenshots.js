"use strict";

/**
 * Screenshot Analysis Routes
 *
 * Handles screenshot analysis endpoints including:
 * - Listing recent analyses
 * - (Future) Upload and analyze new screenshots
 * - (Future) Retrieve analysis details
 */

const express = require("express");
const router = express.Router();
const { listScreenshotAnalyses } = require("../services/screenshots");

/**
 * GET /api/screenshots
 *
 * Returns recent screenshot analyses.
 *
 * Response:
 *   - ok: boolean
 *   - screenshots: array - Array of screenshot analysis objects
 *
 * Each screenshot object contains:
 *   - id: string - Unique identifier
 *   - type: string - Type of screenshot (e.g., "snail_city", "club_power")
 *   - status: string - Status ("parsed" | "pending" | "error")
 *   - description: string - Human-readable description
 *   - source: string - Source of screenshot ("upload" | "discord" | "manual")
 *   - fileName: string - Original filename
 *   - createdAt: string - ISO timestamp when created
 *   - updatedAt: string - ISO timestamp when last updated
 *   - details: object|null - Parsed data or error details
 *
 * Errors:
 *   - 500: server_error - Internal server error
 */
router.get("/screenshots", async (req, res, next) => {
  try {
    const items = await listScreenshotAnalyses();

    res.json({
      ok: true,
      screenshots: items,
    });
  } catch (err) {
    console.error("[screenshots] Failed to list analyses:", err);
    next(err);
  }
});

module.exports = router;
