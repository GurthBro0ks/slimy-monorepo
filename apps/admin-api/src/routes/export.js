"use strict";

const express = require("express");
const router = express.Router();
const { requireAuth, requireGuildMember } = require("../middleware/auth");
const { exportGuildData } = require("../services/export/guildExport");
const { exportUserData } = require("../services/export/userExport");

/**
 * GET /api/export/guild/:guildId
 *
 * Export all data for a specific guild.
 * Requires authenticated user who is a member of the guild (or admin).
 * Returns JSON export with Content-Disposition header to trigger download.
 */
router.get("/guild/:guildId", requireAuth, requireGuildMember("guildId"), async (req, res) => {
  try {
    const { guildId } = req.params;
    const {
      maxChatMessages,
      maxStats,
      maxAuditLogs,
    } = req.query;

    console.log(`[export] Exporting guild data for guild ${guildId}`);

    const options = {};
    if (maxChatMessages) options.maxChatMessages = parseInt(maxChatMessages, 10);
    if (maxStats) options.maxStats = parseInt(maxStats, 10);
    if (maxAuditLogs) options.maxAuditLogs = parseInt(maxAuditLogs, 10);

    const exportData = await exportGuildData(guildId, options);

    // Set headers to trigger download
    const filename = `guild-${exportData.guild.discordId || guildId}-export-${Date.now()}.json`;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    return res.json(exportData);
  } catch (error) {
    console.error("[export] Error exporting guild data:", error);

    if (error.message && error.message.includes("not found")) {
      return res.status(404).json({
        ok: false,
        code: "NOT_FOUND",
        message: error.message,
      });
    }

    return res.status(500).json({
      ok: false,
      code: "EXPORT_ERROR",
      message: "Failed to export guild data",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * GET /api/export/user/me
 *
 * Export all data for the currently authenticated user.
 * Requires authentication.
 * Returns JSON export with Content-Disposition header to trigger download.
 */
router.get("/user/me", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      maxChatMessages,
      maxStats,
      maxAuditLogs,
    } = req.query;

    console.log(`[export] Exporting user data for user ${userId}`);

    const options = {};
    if (maxChatMessages) options.maxChatMessages = parseInt(maxChatMessages, 10);
    if (maxStats) options.maxStats = parseInt(maxStats, 10);
    if (maxAuditLogs) options.maxAuditLogs = parseInt(maxAuditLogs, 10);

    const exportData = await exportUserData(userId, options);

    // Set headers to trigger download
    const filename = `user-${exportData.user.discordId || userId}-export-${Date.now()}.json`;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    return res.json(exportData);
  } catch (error) {
    console.error("[export] Error exporting user data:", error);

    if (error.message && error.message.includes("not found")) {
      return res.status(404).json({
        ok: false,
        code: "NOT_FOUND",
        message: error.message,
      });
    }

    return res.status(500).json({
      ok: false,
      code: "EXPORT_ERROR",
      message: "Failed to export user data",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;
