/**
 * Minimal stub for week-anchor utilities.
 * Real implementation lives in future analytics module.
 *
 * This stub provides the basic API shape expected by admin-api
 * but returns safe defaults suitable for testing.
 */

/**
 * Get the current week anchor for a given date
 * @param {Date} date - The date to get week anchor for (defaults to now)
 * @returns {Object} Week anchor object with weekId, start, and end
 */
function getCurrentWeekAnchor(date = new Date()) {
  // Return a consistent test anchor to avoid date-dependent test failures
  return {
    weekId: '1970-W01',
    start: new Date(0),
    end: new Date(0),
  };
}

/**
 * Get week anchor for a specific week ID
 * @param {string} weekId - The week ID (e.g., '2024-W01')
 * @returns {Object} Week anchor object
 */
function getWeekAnchor(weekId) {
  return {
    weekId: weekId || '1970-W01',
    start: new Date(0),
    end: new Date(0),
  };
}

/**
 * Format a date as a week ID
 * @param {Date} date - The date to format
 * @returns {string} Week ID string
 */
function formatWeekId(date = new Date()) {
  return '1970-W01';
}

module.exports = {
  getCurrentWeekAnchor,
  getWeekAnchor,
  formatWeekId,
};
