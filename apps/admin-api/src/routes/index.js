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
const diagnosticsRoutes = require("./diagnostics");
const botRoutes = require("./bot");
const statsRoutes = require("./stats");
const snailRoutes = require("./snail");
const chatRoutes = require("./chat");
const backupRoutes = require("./backup");
const { guildTaskRouter, taskStreamRouter } = require("./tasks");

// Public routes - no authentication required
router.get("/api/", (_req, res) => res.json({ ok: true }));
router.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "admin-api",
    env: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

// Debug routes (includes ping and protected auth/debug)
router.use("/api", debugRoutes);

// Authentication routes
router.use("/api/auth", authRoutes);

// Protected routes - require authentication and proper authorization
router.use("/api/guilds/:guildId/snail", snailRoutes);
router.use("/api/guilds", guildTaskRouter); // Guild task routes (protected with requireAuth + requireRole("admin"))
router.use("/api/guilds", guildRoutes);
router.use("/api/guilds", guildSettingsRoutes);
router.use("/api/guilds", personalityRoutes);
router.use("/api/uploads", uploadsRoutes);
router.use("/api/diag", diagRoutes);
router.use("/api/diagnostics", diagnosticsRoutes);
router.use("/api/bot", botRoutes);
router.use("/api/stats", statsRoutes);
router.use("/api/chat", chatRoutes);
router.use("/api", taskStreamRouter); // Task stream routes (protected with requireAuth)
router.use("/api/backup", backupRoutes); // Backup routes (protected with requireRole("owner"))

module.exports = router;
