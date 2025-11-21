"use strict";

/**
 * Screenshots Routes
 *
 * Handles screenshot analysis API endpoints including:
 * - Listing recent screenshot analyses
 *
 * No authentication required for now (same as usage/chat endpoints).
 * Can be locked down later if needed.
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
 *   - screenshots: array - Array of screenshot analysis records
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
    next(err);
  }
});

module.exports = router;
