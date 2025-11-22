/**
 * club-vision.js - OCR parsing for club/manage members screenshots
 * Classifies page types and parses member metrics
 */

const { parsePower } = require('./numparse');

/**
 * Classify the page type from OCR text or image analysis
 * @param {object} ocrResult - OCR result with text blocks
 * @returns {string} - Page type: 'manage_members', 'unknown'
 */
function classifyPage(ocrResult) {
  if (!ocrResult || !ocrResult.text) {
    return 'unknown';
  }

  const text = ocrResult.text.toLowerCase();

  // Look for "manage members" indicators
  if (text.includes('manage members') ||
      text.includes('member name') ||
      (text.includes('sim power') && text.includes('total power'))) {
    return 'manage_members';
  }

  return 'unknown';
}

/**
 * Parse manage members page from OCR result
 * Returns array of member records with power metrics
 * @param {object} ocrResult - OCR result with text blocks/rows
 * @param {object} options - Parse options
 * @param {number} options.medianHint - Optional median for power validation
 * @returns {array} - Array of {name, simPower, totalPower}
 */
function parseManageMembersImageEnsemble(ocrResult, options = {}) {
  if (!ocrResult || !ocrResult.rows) {
    return [];
  }

  const members = [];
  const { medianHint } = options;

  for (const row of ocrResult.rows) {
    if (!row.name) continue;

    const member = {
      name: row.name.trim(),
      simPower: null,
      totalPower: null
    };

    // Parse SIM power
    if (row.simPower) {
      member.simPower = parsePower(row.simPower, { medianHint });
    }

    // Parse Total power
    if (row.totalPower) {
      member.totalPower = parsePower(row.totalPower, { medianHint });
    }

    // Only include if we parsed at least one power metric
    if (member.simPower !== null || member.totalPower !== null) {
      members.push(member);
    }
  }

  return members;
}

/**
 * Normalize member key for consistent storage
 * Removes special characters, lowercases, trims whitespace
 * @param {string} name - Member name
 * @returns {string} - Normalized key
 */
function normalizeMemberKey(name) {
  if (!name || typeof name !== 'string') {
    return '';
  }

  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '');
}

module.exports = {
  classifyPage,
  parseManageMembersImageEnsemble,
  normalizeMemberKey
};
