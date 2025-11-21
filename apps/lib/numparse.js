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

/**
 * Parse power value from string (handles K, M suffixes)
 * @param {string|number} value - Value to parse
 * @returns {number} Parsed power value
 */
function parsePower(value) {
  if (typeof value === 'number') {
    return value;
  }

  if (!value || typeof value !== 'string') {
    return 0;
  }

  const str = value.trim().toUpperCase();
  const num = parseFloat(str);

  if (str.endsWith('K')) {
    return num * 1000;
  } else if (str.endsWith('M')) {
    return num * 1000000;
  }

  return isNaN(num) ? 0 : num;
}

module.exports = {
  toNumber,
  toInt,
  toPositiveInt,
  parsePower,
};
