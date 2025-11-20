"use strict";

const notifyService = require("./notifyService");
const dmService = require("./dmService");

/**
 * Create a notification when a ClubAnalysis is created
 * Call this function after creating a ClubAnalysis
 * @param {Object} analysis - The ClubAnalysis object
 * @param {string} analysis.id - Analysis ID
 * @param {string} analysis.guildId - Guild ID
 * @param {string} analysis.userId - User ID who initiated the analysis
 * @param {string} analysis.title - Analysis title
 * @returns {Promise<void>}
 */
async function notifyClubAnalysisCreated(analysis) {
  try {
    const { userId, guildId, title } = analysis;

    // Create notification
    await notifyService.createNotification({
      userId,
      type: "club_update",
      title: "New club analysis available",
      body: title
        ? `Your club analysis "${title}" is ready to view.`
        : "We captured your club's latest stats.",
      meta: {
        analysisId: analysis.id,
        guildId,
      },
    });

    // Optionally send Discord DM if user has opted in
    await dmService.sendDiscordDMIfOptedIn(
      userId,
      `Your club analysis is ready! ${title || "Check out the latest stats."}`
    );
  } catch (error) {
    console.error("[hooks] Error in notifyClubAnalysisCreated:", error);
    // Don't throw - we don't want to fail the main operation if notification fails
  }
}

/**
 * Create a notification for a screenshot analysis completion
 * Call this function after creating a ScreenshotAnalysis
 * @param {Object} analysis - The ScreenshotAnalysis object
 * @param {string} analysis.id - Analysis ID
 * @param {string} analysis.userId - User ID
 * @param {string} analysis.title - Analysis title
 * @returns {Promise<void>}
 */
async function notifyScreenshotAnalysisCreated(analysis) {
  try {
    const { userId, title } = analysis;

    // Create notification
    await notifyService.createNotification({
      userId,
      type: "screenshot_analysis",
      title: "Screenshot analysis complete",
      body: title || "Your screenshot has been analyzed.",
      meta: {
        analysisId: analysis.id,
      },
    });
  } catch (error) {
    console.error("[hooks] Error in notifyScreenshotAnalysisCreated:", error);
    // Don't throw - we don't want to fail the main operation if notification fails
  }
}

/**
 * Create a system notification for a user
 * @param {string} userId - User ID
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} [meta] - Optional metadata
 * @returns {Promise<void>}
 */
async function notifySystem(userId, title, body, meta = null) {
  try {
    await notifyService.createNotification({
      userId,
      type: "system",
      title,
      body,
      meta,
    });
  } catch (error) {
    console.error("[hooks] Error in notifySystem:", error);
    // Don't throw - we don't want to fail the main operation if notification fails
  }
}

module.exports = {
  notifyClubAnalysisCreated,
  notifyScreenshotAnalysisCreated,
  notifySystem,
};
