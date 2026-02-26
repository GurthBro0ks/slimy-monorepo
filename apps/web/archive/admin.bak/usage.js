"use strict";

const express = require("express");
const router = express.Router();

// Usage thresholds (matching frontend logic)
const THRESHOLDS = {
  FREE_LIMIT: 100,
  PRO_LIMIT: 1000,
};

/**
 * Determines the usage level based on current spend.
 */
function getUsageLevel(currentSpend) {
  if (currentSpend <= THRESHOLDS.FREE_LIMIT) {
    return "free";
  }
  if (currentSpend <= THRESHOLDS.PRO_LIMIT) {
    return "pro";
  }
  return "over_cap";
}

/**
 * Generates usage data object.
 * In the future, this could query actual usage from the database.
 */
function getUsageData(spend) {
  const level = getUsageLevel(spend);
  let limit = THRESHOLDS.FREE_LIMIT;
  let modelProbeStatus = "ok";

  if (level === "pro") {
    limit = THRESHOLDS.PRO_LIMIT;
  } else if (level === "over_cap") {
    limit = THRESHOLDS.PRO_LIMIT;
    modelProbeStatus = "hard_cap";
  }

  // Simulate soft cap near the limit
  if (spend > THRESHOLDS.PRO_LIMIT * 0.9 && spend < THRESHOLDS.PRO_LIMIT) {
    modelProbeStatus = "soft_cap";
  }

  return {
    level,
    currentSpend: spend,
    limit,
    modelProbeStatus,
  };
}

/**
 * GET /api/usage
 * Returns current user usage data
 *
 * For now, returns mock data. In the future, this could:
 * - Query actual usage from database based on req.user
 * - Track model probes, API calls, or other usage metrics
 * - Implement per-user or per-guild usage tracking
 */
router.get("/", (req, res) => {
  try {
    // For demonstration, simulate a "pro" user near the soft cap
    // In production, this would query the database based on req.user
    const mockSpend = 950;
    const usageData = getUsageData(mockSpend);

    return res.json({
      ok: true,
      data: usageData,
    });
  } catch (error) {
    console.error("[usage] Failed to fetch usage data:", error);
    return res.status(500).json({
      ok: false,
      code: "USAGE_FETCH_ERROR",
      message: "Failed to fetch usage data",
    });
  }
});

module.exports = router;
