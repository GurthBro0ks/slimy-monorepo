"use strict";
const express = require("express");
const router = express.Router();

const authRoutes = require("./auth");
const debugRoutes = require("./debug");
const guildRoutes = require("./guilds");
const guildSettingsRoutes = require("./guild-settings");
const guildChannelsRoutes = require("./guild-channels");
const guildConfigRoutes = require("./guild-config");
const personalityRoutes = require("./personality");
const uploadsRoutes = require("./uploads");
const diagRoutes = require("./diag");
const botRoutes = require("./bot");
const statsRoutes = require("./stats");
const snailRoutes = require("./snail");
const chatRoutes = require("./chat");
const reportsRoutes = require("./reports");
const webhooksRoutes = require("./webhooks");
const agentsRoutes = require("./agents");
const tasksRoutes = require("./tasks");
const notificationsRoutes = require("./notifications");
const clubAnalyticsRoutes = require("./club-analytics");
const screenshotRoutes = require("./screenshot");
const profileRoutes = require("./profile");
const seasonsRoutes = require("./seasons");
const slimecraftRoutes = require("./slimecraft-updates");
const savedPromptsRoutes = require("./savedPrompts");
const exportRoutes = require("./export");
const auditLogRoutes = require("./audit-log");

router.get("/api/", (_req, res) => res.json({ ok: true }));
router.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "admin-api",
    env: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

// Core routes
router.use("/api", debugRoutes);
router.use("/api/auth", authRoutes);

// Guild management routes
router.use("/api/guilds", guildRoutes);
router.use("/api/guilds", guildSettingsRoutes);
router.use("/api/guilds", guildChannelsRoutes);
router.use("/api/guilds", guildConfigRoutes);
router.use("/api/guilds", personalityRoutes);
router.use("/api/guilds/:guildId/snail", snailRoutes);

// Feature routes
router.use("/api/uploads", uploadsRoutes);
router.use("/api/diag", diagRoutes);
router.use("/api/bot", botRoutes);
router.use("/api/stats", statsRoutes);
router.use("/api/chat", chatRoutes);
router.use("/api/reports", reportsRoutes);
router.use("/api/webhooks", webhooksRoutes);
router.use("/api/agents", agentsRoutes);
router.use("/api/tasks", tasksRoutes);
router.use("/api/notifications", notificationsRoutes);
router.use("/api/club-analytics", clubAnalyticsRoutes);
router.use("/api/screenshots", screenshotRoutes);
router.use("/api/profile", profileRoutes);
router.use("/api/seasons", seasonsRoutes);
router.use("/api/slimecraft", slimecraftRoutes);
router.use("/api/saved-prompts", savedPromptsRoutes);
router.use("/api/export", exportRoutes);
router.use("/api/audit-log", auditLogRoutes);

module.exports = router;
