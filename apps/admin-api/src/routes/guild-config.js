"use strict";

const express = require("express");
const { requireRole, requireGuildMember } = require("../middleware/auth");
const { requireCsrf } = require("../middleware/csrf");
const {
  getGuildConfig,
  updateGuildConfig,
} = require("../services/guildConfig");

const router = express.Router();

/**
 * GET /api/guild-config/:guildId
 * Get configuration for a guild
 *
 * TODO: Enable auth when ready
 * - requireRole("admin") or requireRole("club")
 * - requireGuildMember("guildId")
 */
router.get("/:guildId", /* requireRole("admin"), requireGuildMember("guildId"), */ async (req, res) => {
  try {
    const { guildId } = req.params;

    if (!guildId) {
      return res.status(400).json({ error: "guildId is required" });
    }

    const config = await getGuildConfig(guildId);
    res.json({ config });
  } catch (err) {
    console.error("[guild-config:get] error", err);
    res.status(500).json({ error: "Failed to load guild config" });
  }
});

/**
 * PATCH /api/guild-config/:guildId
 * Update configuration for a guild
 *
 * TODO: Enable auth when ready
 * - requireCsrf
 * - requireRole("admin")
 * - requireGuildMember("guildId")
 */
router.patch(
  "/:guildId",
  /* requireCsrf, requireRole("admin"), requireGuildMember("guildId"), */
  express.json(),
  async (req, res) => {
    try {
      const { guildId } = req.params;
      const patch = req.body || {};

      if (!guildId) {
        return res.status(400).json({ error: "guildId is required" });
      }

      const config = await updateGuildConfig(guildId, patch);
      res.json({ config });
    } catch (err) {
      console.error("[guild-config:patch] error", err);
      res.status(500).json({ error: "Failed to update guild config" });
    }
  }
);

module.exports = router;
