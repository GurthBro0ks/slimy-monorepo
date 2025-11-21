/**
 * Minimal stub for number parsing utilities.
 * Real implementation would handle parsing numbers from various formats.
 *
 * This stub provides safe defaults suitable for testing.
 */

/**
 * Parse a number from a string or return default
 * @param {any} value - Value to parse
 * @param {number} defaultValue - Default value if parsing fails
 * @returns {number} Parsed number or default
 */
function toNumber(value, defaultValue = 0) {
  if (value === null || typeof value === 'undefined') {
    return defaultValue;
  }

  if (typeof value === 'number') {
    return value;
  }

  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Parse an integer from a string or return default
 * @param {any} value - Value to parse
 * @param {number} defaultValue - Default value if parsing fails
 * @returns {number} Parsed integer or default
 */
function toInt(value, defaultValue = 0) {
  if (value === null || typeof value === 'undefined') {
    return defaultValue;
  }

  if (typeof value === 'number') {
    return Math.floor(value);
  }

  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Parse a positive integer from a string or return default
 * @param {any} value - Value to parse
 * @param {number} defaultValue - Default value if parsing fails
 * @returns {number} Parsed positive integer or default
 */
function toPositiveInt(value, defaultValue = 1) {
  const parsed = toInt(value, defaultValue);
  return parsed > 0 ? parsed : defaultValue;
}

module.exports = {
  toNumber,
  toInt,
  toPositiveInt,
};
