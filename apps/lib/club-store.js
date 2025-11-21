/**
 * Minimal stub for club store utilities.
 * Real implementation would handle club data storage and retrieval.
 *
 * This stub provides safe defaults suitable for testing.
 */

/**
 * Canonicalize a member key for consistent storage
 * @param {string} memberKey - Raw member key
 * @returns {string} Canonicalized member key
 */
function canonicalize(memberKey) {
  if (!memberKey || typeof memberKey !== 'string') {
    return '';
  }
  // Simple normalization: lowercase and trim
  return memberKey.toLowerCase().trim();
}

/**
 * Store club data
 * @param {string} guildId - Guild ID
 * @param {Object} data - Club data to store
 * @returns {Promise<void>}
 */
async function storeClubData(guildId, data) {
  // No-op stub
  return;
}

/**
 * Retrieve club data
 * @param {string} guildId - Guild ID
 * @returns {Promise<Object|null>} Club data or null
 */
async function getClubData(guildId) {
  return null;
}

module.exports = {
  canonicalize,
  storeClubData,
  getClubData,
};
