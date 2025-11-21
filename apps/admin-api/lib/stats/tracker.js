/**
 * Minimal stub for stats tracker.
 * Provides a safe no-op interface for testing.
 */

/**
 * Get a stats tracker instance
 * @param {Object} database - Database instance
 * @returns {Object} Stats tracker interface
 */
function getStatsTracker(database) {
  return {
    /**
     * Track an event
     * @param {Object} event - Event data
     * @returns {Promise<void>}
     */
    async trackEvent(event) {
      // No-op stub
      return;
    },

    /**
     * Get summary statistics
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Summary statistics
     */
    async getSummary(options = {}) {
      return {
        totalEvents: 0,
        eventsByType: {},
        eventsByCategory: {},
      };
    },

    /**
     * Get events by type
     * @param {string} eventType - Event type to query
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Events array
     */
    async getEventsByType(eventType, options = {}) {
      return [];
    },

    /**
     * Get events by category
     * @param {string} category - Event category to query
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Events array
     */
    async getEventsByCategory(category, options = {}) {
      return [];
    },

    /**
     * Get events by user
     * @param {string} userId - User ID
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Events array
     */
    async getEventsByUser(userId, options = {}) {
      return [];
    },

    /**
     * Get events by guild
     * @param {string} guildId - Guild ID
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Events array
     */
    async getEventsByGuild(guildId, options = {}) {
      return [];
    },

    /**
     * Delete events
     * @param {Object} filter - Filter criteria
     * @returns {Promise<number>} Number of deleted events
     */
    async deleteEvents(filter) {
      return 0;
    },
  };
}

module.exports = {
  getStatsTracker,
};
