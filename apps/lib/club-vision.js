/**
 * Minimal stub for club vision analytics.
 * Real implementation lives in future analytics module.
 *
 * This stub provides the basic API shape expected by admin-api
 * but returns a safe "disabled" status suitable for testing.
 */

/**
 * Analyze club vision for a given input
 * @param {Object} input - The analysis input (guild, week, etc.)
 * @returns {Promise<Object>} Analysis result with status
 */
async function analyzeClubVision(input) {
  // Return a safe "disabled" result
  return {
    status: 'disabled',
    notes: 'club vision analytics stubbed in test environment',
    guildId: input?.guildId || null,
    weekId: input?.weekId || null,
  };
}

/**
 * Get club vision results for a guild and week
 * @param {string} guildId - The guild ID
 * @param {string} weekId - The week ID
 * @returns {Promise<Object|null>} Cached vision result or null
 */
async function getClubVision(guildId, weekId) {
  // Return null indicating no cached results
  return null;
}

/**
 * Save club vision results
 * @param {string} guildId - The guild ID
 * @param {string} weekId - The week ID
 * @param {Object} result - The vision result to save
 * @returns {Promise<void>}
 */
async function saveClubVision(guildId, weekId, result) {
  // No-op stub - does nothing
  return;
}

module.exports = {
  analyzeClubVision,
  getClubVision,
  saveClubVision,
};
