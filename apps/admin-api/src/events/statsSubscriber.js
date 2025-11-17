"use strict";

/**
 * Stats Event Subscriber
 *
 * Subscribes to important events and tracks them in the stats system.
 * This allows us to monitor application usage and generate analytics.
 */

const { getStatsTracker } = require('../../lib/stats/tracker');
const logger = require('../lib/logger');

// Map event types to stats event names
const EVENT_TYPE_MAP = {
  'CHAT_MESSAGE_CREATED': 'chat_message',
  'CLUB_SNAPSHOT_CREATED': 'club_snapshot',
  'CODES_LOOKUP_PERFORMED': 'codes_lookup',
};

/**
 * Handle chat message created event
 * @param {Object} event - Event object
 */
async function handleChatMessageEvent(event) {
  const tracker = getStatsTracker(require('../lib/database'));
  const { messageId, userId, guildId, conversationId } = event.payload || {};

  await tracker.trackEvent('chat_message', {
    userId,
    guildId,
    metadata: {
      messageId,
      conversationId,
      eventType: event.type,
      timestamp: new Date().toISOString(),
    },
  });

  logger.debug({
    eventType: event.type,
    messageId,
    userId,
    guildId
  }, 'Tracked chat message stats');
}

/**
 * Handle club snapshot created event
 * @param {Object} event - Event object
 */
async function handleClubSnapshotEvent(event) {
  const tracker = getStatsTracker(require('../lib/database'));
  const { snapshotId, analysisId, guildId, userId } = event.payload || {};

  await tracker.trackEvent('club_snapshot', {
    userId,
    guildId,
    metadata: {
      snapshotId,
      analysisId,
      eventType: event.type,
      timestamp: new Date().toISOString(),
    },
  });

  logger.debug({
    eventType: event.type,
    snapshotId,
    analysisId,
    guildId
  }, 'Tracked club snapshot stats');
}

/**
 * Handle codes lookup performed event
 * @param {Object} event - Event object
 */
async function handleCodesLookupEvent(event) {
  const tracker = getStatsTracker(require('../lib/database'));
  const { guildId, userId, source, sourceCount, scope } = event.payload || {};

  await tracker.trackEvent('codes_lookup', {
    userId,
    guildId,
    metadata: {
      source,
      sourceCount,
      scope,
      eventType: event.type,
      timestamp: new Date().toISOString(),
    },
  });

  logger.debug({
    eventType: event.type,
    guildId,
    source,
    sourceCount
  }, 'Tracked codes lookup stats');
}

/**
 * Generic event handler that routes to specific handlers
 * @param {Object} event - Event object
 */
async function handleStatsEvent(event) {
  try {
    switch (event.type) {
      case 'CHAT_MESSAGE_CREATED':
        await handleChatMessageEvent(event);
        break;
      case 'CLUB_SNAPSHOT_CREATED':
        await handleClubSnapshotEvent(event);
        break;
      case 'CODES_LOOKUP_PERFORMED':
        await handleCodesLookupEvent(event);
        break;
      default:
        // Ignore other event types
        logger.debug({ eventType: event.type }, 'Ignoring event for stats tracking');
    }
  } catch (error) {
    // Log but don't throw - stats tracking is best-effort
    logger.error({
      error: error.message,
      eventType: event.type,
      stack: error.stack
    }, 'Failed to track stats for event');
  }
}

/**
 * Register stats event handlers
 * @param {Object} eventBus - Event bus instance
 */
function registerStatsSubscribers(eventBus) {
  // Subscribe to specific events
  eventBus.subscribe('CHAT_MESSAGE_CREATED', handleStatsEvent);
  eventBus.subscribe('CLUB_SNAPSHOT_CREATED', handleStatsEvent);
  eventBus.subscribe('CODES_LOOKUP_PERFORMED', handleStatsEvent);

  logger.info('Stats event subscribers registered');
}

module.exports = {
  registerStatsSubscribers,
  handleStatsEvent,
  handleChatMessageEvent,
  handleClubSnapshotEvent,
  handleCodesLookupEvent,
};
