"use strict";

const express = require("express");
const router = express.Router();
const { chooseTab, readStats } = require("../../lib/sheets");
const { cacheStats } = require("../middleware/cache");
const { stats } = require("../lib/validation/schemas");
const { apiHandler } = require("../lib/errors");
const config = require("../lib/config");

const SHEET_ID = config.google.statsSheetId;
const PINNED = config.google.statsBaselineTitle;

if (!SHEET_ID) {
  // Soft-fail route if not configured
  router.get("/summary", (_req, res) => res.status(500).json({ error: "missing_sheet_id", message: "STATS_SHEET_ID not configured in environment" }));
  module.exports = router;
} else {
  router.get("/summary", stats.summary, cacheStats(600), apiHandler(async (req, res) => {
    // priority: explicit ?title= → ?tab=baseline/latest → pinned → newest baseline → latest
    const qTitle = (req.query.title || "").toString().trim();
    const qTab = (req.query.tab || "").toString().trim().toLowerCase();
    let title = qTitle || null;

    if (!title) {
      if (qTab === "baseline") title = PINNED;
      if (qTab === "latest") title = "Club Latest";
    }

    const selected = await chooseTab(SHEET_ID, title || PINNED);
    if (!selected) {
      res.status(404).json({ error: "no_tabs_found" });
      return;
    }

    const stats = await readStats(SHEET_ID, selected);
    return { ok: true, selected, pinned: PINNED, stats };
  }, { routeName: "stats/summary" }));

  // Handle root /api/stats with optional action param
  router.get("/", (req, res) => {
    const action = req.query.action;
    if (action === "system-metrics" || !action) {
      return res.json({
        cpu: 10 + Math.random() * 5,
        memory: 512 + Math.random() * 64,
        uptime: process.uptime(),
        load: [0.5, 0.3, 0.1]
      });
    }
    res.status(400).json({ error: "unknown_action" });
  });

  router.get("/system-metrics", (_req, res) => {
    // Mock system metrics for now
    res.json({
      cpu: 10 + Math.random() * 5, // Mock CPU usage between 10-15%
      memory: 512 + Math.random() * 64, // Mock memory usage
      uptime: process.uptime(),
      load: [0.5, 0.3, 0.1]
    });
  });

  router.get("/events/stream", (req, res) => {
    // Basic SSE setup
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    });

    // Send initial ping
    res.write("event: ping\ndata: \"pong\"\n\n");

    // Keep connection open (optional: add heartbeat)
    const interval = setInterval(() => {
      res.write("event: heartbeat\ndata: \"tick\"\n\n");
    }, 30000);

    req.on("close", () => {
      clearInterval(interval);
    });
  });

  module.exports = router;
}
