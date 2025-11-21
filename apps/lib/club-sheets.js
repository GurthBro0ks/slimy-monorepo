/**
 * Minimal stub for club Google Sheets integration.
 * Real implementation would interact with Google Sheets API.
 *
 * This stub provides safe defaults suitable for testing.
 */

/**
 * Push latest club data to Google Sheets
 * @param {string} guildId - Guild ID
 * @returns {Promise<Object>} Result of push operation
 */
async function pushLatest(guildId) {
  return {
    status: 'disabled',
    message: 'Google Sheets integration stubbed in test environment',
    guildId,
  };
}

/**
 * Test access to Google Sheets
 * @param {string} spreadsheetId - Spreadsheet ID
 * @returns {Promise<boolean>} True if accessible, false otherwise
 */
async function testSheetAccess(spreadsheetId) {
  return false; // Return false in test environment
}

/**
 * Read data from Google Sheets
 * @param {string} spreadsheetId - Spreadsheet ID
 * @param {string} range - Range to read
 * @returns {Promise<Array>} Sheet data
 */
async function readSheet(spreadsheetId, range) {
  return [];
}

/**
 * Write data to Google Sheets
 * @param {string} spreadsheetId - Spreadsheet ID
 * @param {string} range - Range to write to
 * @param {Array} data - Data to write
 * @returns {Promise<void>}
 */
async function writeSheet(spreadsheetId, range, data) {
  // No-op stub
  return;
}

module.exports = {
  pushLatest,
  testSheetAccess,
  readSheet,
  writeSheet,
};
