"use strict";
const express = require("express");
const router = express.Router();

const authRoutes = require("./auth");
const debugRoutes = require("./debug");
const guildRoutes = require("./guilds");
const guildSettingsRoutes = require("./guild-settings");
const personalityRoutes = require("./personality");
const uploadsRoutes = require("./uploads");
const diagRoutes = require("./diag");
const botRoutes = require("./bot");
const statsRoutes = require("./stats");
const snailRoutes = require("./snail");
const chatRoutes = require("./chat");

// Track app start time for uptime calculation
const APP_START_TIME = Date.now();

router.get("/api/", (_req, res) => res.json({ ok: true }));

/**
 * Health check endpoint
 * Returns basic service health information
 */
router.get("/api/health", (_req, res) => {
  const uptime = Math.floor((Date.now() - APP_START_TIME) / 1000); // uptime in seconds

  res.json({
    status: "ok",
    uptime,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
  });
});

/**
 * Status endpoint
 * Returns detailed service status and subsystem information
 */
router.get("/api/status", (_req, res) => {
  const uptime = Math.floor((Date.now() - APP_START_TIME) / 1000);
  const database = require("../lib/database");

  // Get subsystem status (keep checks lightweight)
  const subsystems = {
    database: database.isConfigured() ? "configured" : "not_configured",
    redis: "unknown", // Could add Redis check if needed
  };

  res.json({
    status: "ok",
    uptime,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
    environment: process.env.NODE_ENV || "development",
    subsystems,
  });
});
router.use("/api", debugRoutes);
router.use("/api/auth", authRoutes);
router.use("/api/guilds/:guildId/snail", snailRoutes);
router.use("/api/guilds", guildRoutes);
router.use("/api/guilds", guildSettingsRoutes);
router.use("/api/guilds", personalityRoutes);
router.use("/api/uploads", uploadsRoutes);
router.use("/api/diag", diagRoutes);
router.use("/api/bot", botRoutes);
router.use("/api/stats", statsRoutes);
router.use("/api/chat", chatRoutes);

module.exports = router;
