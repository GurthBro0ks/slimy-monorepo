"use strict";
const express = require("express");
const router = express.Router();
const { logger } = require("../lib/logger");

/**
 * POST /api/analytics/event
 * Records analytics events
 *
 * Body: { type: string, payload: any }
 */
router.post("/event", async (req, res) => {
  try {
    const { type, payload } = req.body;

    // Validate request body
    if (!type || typeof type !== "string") {
      return res.status(400).json({
        ok: false,
        error: "Missing or invalid 'type' field",
      });
    }

    // Log the analytics event
    logger.info({
      event: {
        type,
        payload: payload || {},
        timestamp: new Date().toISOString(),
        userId: req.user?.id,
        guildId: req.user?.guildId,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      },
    }, `Analytics event: ${type}`);

    // TODO: Send to analytics service (e.g., Segment, Mixpanel, etc.)
    // Example:
    // await analyticsService.track({
    //   event: type,
    //   userId: req.user?.id,
    //   properties: payload,
    // });

    res.json({
      ok: true,
      message: "Event recorded successfully",
      event: {
        type,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error({ error }, "Error recording analytics event");
    res.status(500).json({
      ok: false,
      error: "Failed to record analytics event",
    });
  }
});

/**
 * GET /api/analytics/health
 * Health check endpoint for analytics service
 */
router.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "analytics",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
