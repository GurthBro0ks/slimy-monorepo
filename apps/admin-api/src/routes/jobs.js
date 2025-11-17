"use strict";

const express = require("express");
const router = express.Router();
const { requireRole } = require("../middleware/auth");
const { runWeeklyDigestJob } = require("../jobs/weeklyDigest");

// All job routes require admin role
router.use(requireRole("admin"));

/**
 * POST /api/jobs/run-weekly-digest
 * Manually trigger the weekly digest job
 * Admin-only route
 */
router.post("/run-weekly-digest", async (req, res) => {
  try {
    console.log("[jobs] Manually triggering weekly digest job...");

    const result = await runWeeklyDigestJob();

    res.json({
      ok: true,
      message: "Weekly digest job completed successfully",
      result,
    });
  } catch (error) {
    console.error("[jobs] Error running weekly digest job:", error);
    res.status(500).json({
      ok: false,
      code: "JOB_ERROR",
      message: "Failed to run weekly digest job",
      error: error.message,
    });
  }
});

module.exports = router;
