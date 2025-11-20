"use strict";

const { dispatchEventToWebhooks } = require("./sender");

/**
 * Webhook Subscriber Module
 * Provides helper functions to dispatch events to webhooks
 *
 * TODO: When a centralized event bus is implemented, convert this to
 * subscribe to bus events rather than using direct function calls.
 */

/**
 * Event type constants
 */
const EventTypes = {
  // Club and snapshot events
  CLUB_SNAPSHOT_CREATED: "CLUB_SNAPSHOT_CREATED",
  CLUB_SNAPSHOT_UPDATED: "CLUB_SNAPSHOT_UPDATED",
  CLUB_ANALYSIS_COMPLETED: "CLUB_ANALYSIS_COMPLETED",

  // Season events
  SEASON_CREATED: "SEASON_CREATED",
  SEASON_UPDATED: "SEASON_UPDATED",
  SEASON_CLOSED: "SEASON_CLOSED",

  // Codes events
  CODES_UPDATED: "CODES_UPDATED",
  CODES_REFRESH_STARTED: "CODES_REFRESH_STARTED",
  CODES_REFRESH_COMPLETED: "CODES_REFRESH_COMPLETED",

  // Guild events
  GUILD_SETTINGS_UPDATED: "GUILD_SETTINGS_UPDATED",
  GUILD_MEMBER_JOINED: "GUILD_MEMBER_JOINED",
  GUILD_MEMBER_LEFT: "GUILD_MEMBER_LEFT",

  // Screenshot events
  SCREENSHOT_ANALYZED: "SCREENSHOT_ANALYZED",
  SCREENSHOT_COMPARISON_CREATED: "SCREENSHOT_COMPARISON_CREATED",

  // Chat events
  CHAT_MESSAGE_CREATED: "CHAT_MESSAGE_CREATED",
  CONVERSATION_CREATED: "CONVERSATION_CREATED",

  // Stats events
  STATS_GENERATED: "STATS_GENERATED",
  LEADERBOARD_UPDATED: "LEADERBOARD_UPDATED",
};

/**
 * Dispatch a club snapshot created event
 * @param {object} params - Event parameters
 * @param {string} params.snapshotId - Snapshot ID
 * @param {string} params.guildId - Guild ID
 * @param {object} [params.metadata] - Additional metadata
 */
async function notifyClubSnapshotCreated({ snapshotId, guildId, metadata = {} }) {
  await dispatchEventToWebhooks(
    EventTypes.CLUB_SNAPSHOT_CREATED,
    {
      snapshotId,
      ...metadata,
    },
    guildId
  );
}

/**
 * Dispatch a club analysis completed event
 * @param {object} params - Event parameters
 * @param {string} params.analysisId - Analysis ID
 * @param {string} params.guildId - Guild ID
 * @param {object} [params.summary] - Analysis summary
 */
async function notifyClubAnalysisCompleted({ analysisId, guildId, summary = {} }) {
  await dispatchEventToWebhooks(
    EventTypes.CLUB_ANALYSIS_COMPLETED,
    {
      analysisId,
      summary,
    },
    guildId
  );
}

/**
 * Dispatch a season event
 * @param {string} eventType - One of SEASON_CREATED, SEASON_UPDATED, SEASON_CLOSED
 * @param {object} params - Event parameters
 * @param {string} params.seasonId - Season ID
 * @param {string} params.guildId - Guild ID
 * @param {object} [params.metadata] - Additional metadata
 */
async function notifySeasonEvent(eventType, { seasonId, guildId, metadata = {} }) {
  await dispatchEventToWebhooks(
    eventType,
    {
      seasonId,
      ...metadata,
    },
    guildId
  );
}

/**
 * Dispatch a codes updated event
 * @param {object} params - Event parameters
 * @param {string} [params.guildId] - Guild ID (optional, can be global)
 * @param {object} params.codesData - Codes data
 */
async function notifyCodesUpdated({ guildId = null, codesData = {} }) {
  await dispatchEventToWebhooks(
    EventTypes.CODES_UPDATED,
    {
      ...codesData,
      updatedAt: new Date().toISOString(),
    },
    guildId
  );
}

/**
 * Dispatch a guild settings updated event
 * @param {object} params - Event parameters
 * @param {string} params.guildId - Guild ID
 * @param {object} params.settings - Updated settings
 */
async function notifyGuildSettingsUpdated({ guildId, settings = {} }) {
  await dispatchEventToWebhooks(
    EventTypes.GUILD_SETTINGS_UPDATED,
    {
      settings,
    },
    guildId
  );
}

/**
 * Dispatch a screenshot analyzed event
 * @param {object} params - Event parameters
 * @param {string} params.analysisId - Analysis ID
 * @param {string} params.userId - User ID
 * @param {string} [params.guildId] - Guild ID (optional)
 * @param {object} [params.summary] - Analysis summary
 */
async function notifyScreenshotAnalyzed({ analysisId, userId, guildId = null, summary = {} }) {
  await dispatchEventToWebhooks(
    EventTypes.SCREENSHOT_ANALYZED,
    {
      analysisId,
      userId,
      summary,
    },
    guildId
  );
}

/**
 * Dispatch a chat message created event
 * @param {object} params - Event parameters
 * @param {string} params.messageId - Message ID
 * @param {string} params.userId - User ID
 * @param {string} [params.guildId] - Guild ID (optional)
 * @param {boolean} [params.adminOnly] - Whether message is admin only
 */
async function notifyChatMessageCreated({ messageId, userId, guildId = null, adminOnly = false }) {
  await dispatchEventToWebhooks(
    EventTypes.CHAT_MESSAGE_CREATED,
    {
      messageId,
      userId,
      adminOnly,
    },
    guildId
  );
}

/**
 * Generic event dispatcher for custom events
 * @param {string} eventType - Custom event type
 * @param {object} payload - Event payload
 * @param {string} [guildId] - Guild ID (optional)
 */
async function notifyCustomEvent(eventType, payload, guildId = null) {
  await dispatchEventToWebhooks(eventType, payload, guildId);
}

module.exports = {
  EventTypes,
  notifyClubSnapshotCreated,
  notifyClubAnalysisCompleted,
  notifySeasonEvent,
  notifyCodesUpdated,
  notifyGuildSettingsUpdated,
  notifyScreenshotAnalyzed,
  notifyChatMessageCreated,
  notifyCustomEvent,
};
