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
const { requireAuth, requireRole } = require("../middleware/auth");
const { calculateSnailTier } = require("../services/snail-tier");
const { getLatestScreenshotAnalysis } = require("../services/snail-screenshots");

router.get("/api/", (_req, res) => res.json({ ok: true }));
router.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "admin-api",
    env: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});
router.use("/api", debugRoutes);
router.use("/api/auth", authRoutes);
// Legacy snail routes were namespaced under /api/guilds/:guildId/snail.
// Newer frontend clients call /api/snail/:guildId/... directly, so we support both.
const snailCompatRouter = express.Router();
snailCompatRouter.use(requireAuth);
snailCompatRouter.use(requireRole("member"));

snailCompatRouter.post("/tier", express.json(), (req, res) => {
  try {
    const result = calculateSnailTier({
      level: Number(req.body?.level),
      cityLevel: Number(req.body?.cityLevel),
      relicPower: Number(req.body?.relicPower),
      clubContribution: Number(req.body?.clubContribution),
      simPower: req.body?.simPower ? Number(req.body.simPower) : undefined,
      maxSimPower: req.body?.maxSimPower ? Number(req.body.maxSimPower) : undefined,
    });
    res.json(result);
  } catch (err) {
    console.error("[snail/tier compat] failed:", err);
    res.status(500).json({ error: "server_error", message: err.message });
  }
});

snailCompatRouter.get("/screenshots/latest", (req, res) => {
  try {
    const guildId =
      req.query.guildId ||
      process.env.DEFAULT_SNAIL_GUILD_ID ||
      (Array.isArray(req.user?.guilds) && req.user.guilds.length > 0
        ? req.user.guilds[0].id
        : "sandbox-guild");
    const userId = req.user?.id || "compat-user";
    const result = getLatestScreenshotAnalysis({
      guildId: String(guildId),
      userId,
    });
    res.json(result);
  } catch (err) {
    console.error("[snail/screenshots compat] failed:", err);
    res.status(500).json({ error: "server_error", message: err.message });
  }
});

router.use("/api/snail", snailCompatRouter);
router.use("/api/guilds/:guildId/snail", snailRoutes);
router.use("/api/snail/:guildId", snailRoutes);
router.use("/api/guilds", guildRoutes);
router.use("/api/guilds", guildSettingsRoutes);
router.use("/api/guilds", personalityRoutes);
router.use("/api/uploads", uploadsRoutes);
router.use("/api/diag", diagRoutes);
router.use("/api/bot", botRoutes);
router.use("/api/stats", statsRoutes);
router.use("/api/chat", chatRoutes);

module.exports = router;
