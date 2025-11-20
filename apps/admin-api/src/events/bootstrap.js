"use strict";

/**
 * Event System Bootstrap
 *
 * Initializes the event bus and registers all event subscribers.
 * This should be called during application startup.
 */

const eventBus = require('../lib/eventBus');
const { registerStatsSubscribers } = require('./statsSubscriber');
const { registerLoggingSubscribers } = require('./loggingSubscriber');
const database = require('../lib/database');
const logger = require('../lib/logger');

/**
 * Initialize the event system
 * @returns {Promise<void>}
 */
async function bootstrapEventSystem() {
  try {
    // Set the database instance for the event bus
    eventBus.setDatabase(database);

    // Register all event subscribers
    registerStatsSubscribers(eventBus);
    registerLoggingSubscribers(eventBus);

    // Log handler counts for debugging
    const handlerCounts = eventBus.getHandlerCounts();
    logger.info({
      handlerCounts,
      totalHandlers: Object.values(handlerCounts).reduce((sum, count) => sum + count, 0)
    }, 'Event system initialized');

  } catch (error) {
    logger.error({
      error: error.message,
      stack: error.stack
    }, 'Failed to bootstrap event system');
    throw error;
  }
}

module.exports = {
  bootstrapEventSystem,
};
