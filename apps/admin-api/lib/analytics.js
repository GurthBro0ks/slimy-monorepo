"use strict";

const logger = require("./logger");

/**
 * Record an analytics event
 *
 * @param {string} type - The event type (e.g., "page_view", "login_success")
 * @param {any} data - Additional event data/payload
 * @param {Object} options - Additional options
 * @param {string} options.userId - User ID associated with the event
 * @param {string} options.guildId - Guild ID associated with the event
 * @returns {void}
 */
function recordEvent(type, data = {}, options = {}) {
  if (!type || typeof type !== "string") {
    logger.error({ type, data }, "Invalid analytics event: type must be a non-empty string");
    return;
  }

  const event = {
    type,
    payload: data,
    timestamp: new Date().toISOString(),
    userId: options.userId,
    guildId: options.guildId,
  };

  // Log the event
  logger.info({ event }, `Analytics: ${type}`);

  // TODO: Send to external analytics service
  // Example integrations:
  // - Segment: analytics.track(type, data)
  // - Mixpanel: mixpanel.track(type, data)
  // - Google Analytics: gtag('event', type, data)
  // - Custom analytics service: await fetch('/analytics', { method: 'POST', body: JSON.stringify(event) })

  return event;
}

/**
 * Record a page view event
 *
 * @param {string} page - Page path or name
 * @param {Object} data - Additional page data
 * @param {Object} options - Additional options
 */
function recordPageView(page, data = {}, options = {}) {
  return recordEvent("page_view", {
    page,
    ...data,
  }, options);
}

/**
 * Record a user action event
 *
 * @param {string} action - Action name
 * @param {Object} data - Additional action data
 * @param {Object} options - Additional options
 */
function recordAction(action, data = {}, options = {}) {
  return recordEvent("user_action", {
    action,
    ...data,
  }, options);
}

/**
 * Record an error event
 *
 * @param {Error|string} error - Error object or message
 * @param {Object} data - Additional error data
 * @param {Object} options - Additional options
 */
function recordError(error, data = {}, options = {}) {
  const errorData = {
    message: error?.message || error,
    stack: error?.stack,
    code: error?.code,
    ...data,
  };

  return recordEvent("error", errorData, options);
}

module.exports = {
  recordEvent,
  recordPageView,
  recordAction,
  recordError,
};
