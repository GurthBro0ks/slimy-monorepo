"use strict";

/**
 * Logging Event Subscriber
 *
 * Subscribes to all events and logs them for monitoring and debugging.
 * Uses structured logging to make events searchable and analyzable.
 */

const logger = require('../lib/logger');

/**
 * Log an event with structured data
 * @param {Object} event - Event object
 */
function logEvent(event) {
  const { type, payload } = event;
  const { userId, guildId, messageId, snapshotId, analysisId, source, sourceCount } = payload || {};

  // Create structured log entry
  const logData = {
    eventType: type,
    userId: userId || null,
    guildId: guildId || null,
    timestamp: new Date().toISOString(),
  };

  // Add event-specific fields
  if (messageId) logData.messageId = messageId;
  if (snapshotId) logData.snapshotId = snapshotId;
  if (analysisId) logData.analysisId = analysisId;
  if (source) logData.source = source;
  if (sourceCount !== undefined) logData.sourceCount = sourceCount;

  // Log at appropriate level based on event type
  if (type.includes('ERROR') || type.includes('FAILED')) {
    logger.error(logData, `Event: ${type}`);
  } else if (type.includes('WARNING') || type.includes('WARN')) {
    logger.warn(logData, `Event: ${type}`);
  } else {
    logger.info(logData, `Event: ${type}`);
  }
}

/**
 * Register logging event handlers
 * @param {Object} eventBus - Event bus instance
 */
function registerLoggingSubscribers(eventBus) {
  // Subscribe to all events using wildcard
  eventBus.subscribe('*', logEvent);

  logger.info('Logging event subscribers registered (wildcard mode)');
}

module.exports = {
  registerLoggingSubscribers,
  logEvent,
};
