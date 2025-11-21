/**
 * Minimal stub for club corrections.
 * Real implementation lives in future analytics module.
 *
 * This stub provides the basic API shape expected by admin-api
 * but returns empty/no-op results suitable for testing.
 */

/**
 * Get corrections for a specific guild and week
 * @param {string} guildId - The guild ID
 * @param {string} weekId - The week ID
 * @returns {Array} Array of correction objects (empty in stub)
 */
function getCorrectionsForWeek(guildId, weekId) {
  // Return empty corrections so callers can proceed
  return [];
}

/**
 * Apply corrections to an analysis result
 * @param {Object} analysis - The analysis to correct
 * @param {Array} corrections - The corrections to apply
 * @returns {Object} The corrected analysis (no-op in stub)
 */
function applyCorrections(analysis, corrections) {
  // No-op stub - return analysis unchanged
  return analysis || {};
}

/**
 * Save corrections for a guild and week
 * @param {string} guildId - The guild ID
 * @param {string} weekId - The week ID
 * @param {Array} corrections - The corrections to save
 * @returns {Promise<void>}
 */
async function saveCorrections(guildId, weekId, corrections) {
  // No-op stub - does nothing
  return;
}

/**
 * Delete corrections for a guild and week
 * @param {string} guildId - The guild ID
 * @param {string} weekId - The week ID
 * @returns {Promise<void>}
 */
async function deleteCorrections(guildId, weekId) {
  // No-op stub - does nothing
  return;
}

module.exports = {
  getCorrectionsForWeek,
  applyCorrections,
  saveCorrections,
  deleteCorrections,
};
