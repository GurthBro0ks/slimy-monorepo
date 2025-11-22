/**
 * numparse.js - Robust OCR-aware number parsing for game metrics
 * Handles K/M/B suffixes, bad grouping, inflated tails from OCR errors
 */

/**
 * Parse power values from OCR text with robust error handling
 * Handles:
 * - K/M/B suffixes (case-insensitive)
 * - Bad grouping (spaces, commas in wrong places)
 * - Inflated tails from OCR errors
 * - Optional median hints for validation
 *
 * @param {string} str - The OCR text to parse
 * @param {object} options - Optional parsing options
 * @param {number} options.medianHint - Optional median value for validation
 * @returns {number|null} - Parsed number or null if unparseable
 */
function parsePower(str, options = {}) {
  if (!str || typeof str !== 'string') {
    return null;
  }

  // Remove whitespace and normalize
  let cleaned = str.trim().toUpperCase();

  // Remove common OCR artifacts and grouping characters
  cleaned = cleaned.replace(/[,\s_]/g, '');

  // Handle empty after cleaning
  if (!cleaned) {
    return null;
  }

  // Extract suffix (K, M, B)
  let multiplier = 1;
  const lastChar = cleaned[cleaned.length - 1];

  if (lastChar === 'K') {
    multiplier = 1000;
    cleaned = cleaned.slice(0, -1);
  } else if (lastChar === 'M') {
    multiplier = 1000000;
    cleaned = cleaned.slice(0, -1);
  } else if (lastChar === 'B') {
    multiplier = 1000000000;
    cleaned = cleaned.slice(0, -1);
  }

  // Parse the numeric part
  const num = parseFloat(cleaned);

  if (isNaN(num) || num < 0) {
    return null;
  }

  const result = num * multiplier;

  // Validate against median hint if provided
  if (options.medianHint && typeof options.medianHint === 'number') {
    const ratio = result / options.medianHint;
    // Reject if result is wildly off from median (>10x or <0.1x)
    if (ratio > 10 || ratio < 0.1) {
      return null;
    }
  }

  return Math.round(result);
}

module.exports = {
  parsePower
};
