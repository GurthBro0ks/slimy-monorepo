"use strict";

const express = require("express");
const router = express.Router();
const usageService = require("../services/usage");

/**
 * GET /api/usage/summary
 *
 * Returns global usage metrics for the Slimy platform.
 * This endpoint powers the Next.js web /usage dashboard.
 *
 * Response format:
 * {
 *   totalTokens: number,    // Sum of all input + output tokens
 *   totalCostUsd: number,   // Total cost in USD
 *   totalImages: number,    // Total images generated
 *   totalRequests: number   // Total API requests
 * }
 *
 * Query parameters:
 * - window: Time window (default: "7d") - e.g., "today", "7d", "30d", "this_month"
 * - startDate: Optional explicit start date (ISO format)
 * - endDate: Optional explicit end date (ISO format)
 */
router.get("/summary", async (req, res, next) => {
  try {
    const window = req.query.window || "7d";
    const startDate = req.query.startDate || null;
    const endDate = req.query.endDate || null;

    const summary = await usageService.getGlobalUsageSummary({
      window,
      startDate,
      endDate,
    });

    res.json(summary);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
