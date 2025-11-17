/**
 * Reports API Routes
 *
 * Handles generation and retrieval of various club reports
 */

"use strict";

const express = require("express");
const { z } = require("zod");
const { requireAuth } = require("../middleware/auth.js");
const { requireGuildAccess } = require("../middleware/rbac.js");
const { validateQuery, validateBody } = require("../middleware/validate.js");
const { buildWeeklyClubReport } = require("../services/reports/weeklyClubReport.js");

const router = express.Router();

// Apply authentication to all routes
router.use(requireAuth);

// Validation schemas
const weeklyReportQuerySchema = z.object({
  guildId: z.string().min(1, "Guild ID is required"),
  weekStart: z.string().datetime().optional(),
});

const sendDiscordReportSchema = z.object({
  guildId: z.string().min(1, "Guild ID is required"),
  channelId: z.string().min(1, "Channel ID is required"),
  weekStart: z.string().datetime().optional(),
});

/**
 * GET /api/reports/weekly
 *
 * Generate and retrieve a weekly club report
 *
 * Query Parameters:
 * - guildId: Guild ID (required)
 * - weekStart: ISO date string for week start (optional, defaults to current week)
 *
 * Returns:
 * - Complete weekly report with summary, Discord embeds, and HTML
 */
router.get(
  "/weekly",
  validateQuery(weeklyReportQuerySchema),
  async (req, res, next) => {
    try {
      const { guildId, weekStart } = req.query;

      // Check guild access
      // TODO: Implement guild access check when RBAC is fully wired
      // For now, authenticated users can access any guild report

      const options = weekStart
        ? { weekStart: new Date(weekStart) }
        : {};

      const report = await buildWeeklyClubReport(guildId, options);

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      console.error("Error generating weekly report:", error);
      next(error);
    }
  }
);

/**
 * POST /api/reports/weekly/send-discord
 *
 * Generate a weekly report and send it to a Discord channel
 *
 * Body:
 * - guildId: Guild ID (required)
 * - channelId: Discord channel ID (required)
 * - weekStart: ISO date string for week start (optional)
 *
 * Returns:
 * - Success status and message ID if sent
 */
router.post(
  "/weekly/send-discord",
  validateBody(sendDiscordReportSchema),
  async (req, res, next) => {
    try {
      const { guildId, channelId, weekStart } = req.body;

      // TODO: Implement guild access check when RBAC is fully wired

      const options = weekStart ? { weekStart: new Date(weekStart) } : {};

      const report = await buildWeeklyClubReport(guildId, options);

      // TODO: Integrate with Discord bot to actually send the embeds
      // This is a placeholder implementation that just logs the action
      // When the Discord bot is available, use it to send report.discordEmbeds to channelId

      console.log(`[STUB] Would send weekly report to Discord channel ${channelId} for guild ${guildId}`);
      console.log(`[STUB] Embeds to send:`, JSON.stringify(report.discordEmbeds, null, 2));

      /*
      // Future implementation example:
      const discordClient = getDiscordClient();
      const channel = await discordClient.channels.fetch(channelId);
      if (channel?.isTextBased()) {
        const message = await channel.send({ embeds: report.discordEmbeds });
        return res.json({
          success: true,
          data: {
            messageId: message.id,
            channelId: channel.id,
            guildId,
          },
        });
      }
      */

      res.json({
        success: true,
        data: {
          message: "Discord integration not yet implemented. Report generated successfully.",
          guildId,
          channelId,
          reportGenerated: true,
          embedCount: report.discordEmbeds.length,
        },
      });
    } catch (error) {
      console.error("Error sending Discord report:", error);
      next(error);
    }
  }
);

/**
 * GET /api/reports/weekly/html
 *
 * Get just the HTML portion of the weekly report (for embedding in iframe or external display)
 *
 * Query Parameters:
 * - guildId: Guild ID (required)
 * - weekStart: ISO date string for week start (optional)
 *
 * Returns:
 * - HTML content with text/html content type
 */
router.get(
  "/weekly/html",
  validateQuery(weeklyReportQuerySchema),
  async (req, res, next) => {
    try {
      const { guildId, weekStart } = req.query;

      const options = weekStart
        ? { weekStart: new Date(weekStart) }
        : {};

      const report = await buildWeeklyClubReport(guildId, options);

      res.setHeader("Content-Type", "text/html");
      res.send(report.html);
    } catch (error) {
      console.error("Error generating weekly report HTML:", error);
      next(error);
    }
  }
);

module.exports = router;
