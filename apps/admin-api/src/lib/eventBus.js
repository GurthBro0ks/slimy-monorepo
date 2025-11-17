"use strict";

/**
 * Internal Event Bus
 *
 * A simple in-process pub/sub pattern for event-driven architecture.
 *
 * This is v1 foundation for future microservices / job queues.
 * Events are persisted to the AuditLog table for compliance and debugging.
 * Subscribers can hook into events for stats tracking, monitoring, notifications, etc.
 *
 * Design principles:
 * - Best-effort event handling (failures are logged, not thrown)
 * - Async by default (handlers can be sync or async)
 * - Type-safe events via naming conventions
 * - Audit trail for all events
 *
 * Future enhancements:
 * - Message queue integration (RabbitMQ, Redis, SQS)
 * - Cross-service event broadcasting
 * - Event replay and sourcing
 * - Dead letter queue for failed handlers
 */

const logger = require('./logger');

// Type definitions (JSDoc for better IDE support)
/**
 * @typedef {Object} Event
 * @property {string} type - Event type (e.g., 'CHAT_MESSAGE_CREATED')
 * @property {any} payload - Event payload data
 */

/**
 * @callback Handler
 * @param {Event} event - The event object
 * @returns {void|Promise<void>}
 */

// In-memory handler registry
// Map of event type to array of handlers
/** @type {Record<string, Handler[]>} */
const handlers = {};

// Database instance (injected via setDatabase)
let db = null;

/**
 * Set the database instance for audit logging
 * @param {any} database - Database instance with Prisma client
 */
function setDatabase(database) {
  db = database;
}

/**
 * Subscribe to an event type
 *
 * @param {string} type - Event type to subscribe to (or '*' for all events)
 * @param {Handler} handler - Handler function to call when event is published
 * @returns {void}
 *
 * @example
 * subscribe('CHAT_MESSAGE_CREATED', async (event) => {
 *   console.log('Chat message created:', event.payload);
 * });
 */
function subscribe(type, handler) {
  if (typeof type !== 'string' || !type) {
    throw new Error('Event type must be a non-empty string');
  }
  if (typeof handler !== 'function') {
    throw new Error('Handler must be a function');
  }

  if (!handlers[type]) {
    handlers[type] = [];
  }

  handlers[type].push(handler);
  logger.debug({ eventType: type, handlerCount: handlers[type].length }, 'Event handler registered');
}

/**
 * Publish an event to the event bus
 *
 * This function:
 * 1. Saves the event to the AuditLog table
 * 2. Calls all registered handlers for the event type
 * 3. Calls all wildcard ('*') handlers
 *
 * Error handling:
 * - Audit log failures are logged but don't block event processing
 * - Handler failures are logged but don't affect other handlers
 * - All failures are best-effort to ensure system reliability
 *
 * @param {Event} event - Event to publish
 * @returns {Promise<void>}
 *
 * @example
 * await publish({
 *   type: 'CHAT_MESSAGE_CREATED',
 *   payload: {
 *     messageId: '123',
 *     userId: 'user_456',
 *     guildId: 'guild_789',
 *     text: 'Hello world'
 *   }
 * });
 */
async function publish(event) {
  if (!event || typeof event !== 'object') {
    throw new Error('Event must be an object');
  }
  if (!event.type || typeof event.type !== 'string') {
    throw new Error('Event must have a type property');
  }

  const startTime = Date.now();

  // Step 1: Save to AuditLog (best-effort)
  try {
    if (db && db.isInitialized) {
      const prisma = db.getClient();
      await prisma.auditLog.create({
        data: {
          eventType: event.type,
          action: event.type.toLowerCase().replace(/_/g, '-'),
          userId: event.payload?.userId || null,
          guildId: event.payload?.guildId || null,
          payload: event.payload || {},
          timestamp: new Date(),
          createdAt: new Date(),
          success: true,
        },
      });
    } else {
      logger.warn({ eventType: event.type }, 'Database not initialized, skipping audit log');
    }
  } catch (error) {
    // Log but continue - audit log failures shouldn't break the app
    logger.error({
      error: error.message,
      eventType: event.type,
      stack: error.stack
    }, 'Failed to save event to audit log');
  }

  // Step 2: Call all handlers for this event type
  const eventHandlers = handlers[event.type] || [];
  const wildcardHandlers = handlers['*'] || [];
  const allHandlers = [...eventHandlers, ...wildcardHandlers];

  if (allHandlers.length === 0) {
    logger.debug({ eventType: event.type }, 'No handlers registered for event');
  }

  // Execute handlers in parallel (best-effort)
  const handlerPromises = allHandlers.map(async (handler, index) => {
    try {
      await handler(event);
    } catch (error) {
      // Log but continue - handler failures shouldn't affect other handlers
      logger.error({
        error: error.message,
        eventType: event.type,
        handlerIndex: index,
        stack: error.stack
      }, 'Event handler failed');
    }
  });

  await Promise.allSettled(handlerPromises);

  const duration = Date.now() - startTime;
  logger.debug({
    eventType: event.type,
    handlerCount: allHandlers.length,
    duration
  }, 'Event published');
}

/**
 * Get current handler counts (for debugging/monitoring)
 * @returns {Record<string, number>}
 */
function getHandlerCounts() {
  const counts = {};
  for (const [type, handlerList] of Object.entries(handlers)) {
    counts[type] = handlerList.length;
  }
  return counts;
}

/**
 * Clear all handlers (useful for testing)
 * @returns {void}
 */
function clearHandlers() {
  for (const type of Object.keys(handlers)) {
    delete handlers[type];
  }
}

module.exports = {
  subscribe,
  publish,
  setDatabase,
  getHandlerCounts,
  clearHandlers,
};
