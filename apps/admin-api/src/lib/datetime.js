/**
 * Date/Time Utility Module
 *
 * Policy: All APIs use UTC in ISO 8601 format internally and for responses.
 * UI/clients are responsible for converting to user's local time for display.
 *
 * ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ (e.g., "2025-11-19T03:21:18.000Z")
 */

/**
 * Get current timestamp in ISO 8601 UTC format
 * @returns {string} ISO 8601 timestamp (e.g., "2025-11-19T03:21:18.000Z")
 */
function nowISO() {
  return new Date().toISOString();
}

/**
 * Convert a Date object to ISO 8601 UTC string
 * @param {Date|string|number} date - Date object, ISO string, or timestamp
 * @returns {string} ISO 8601 timestamp
 */
function toISO(date) {
  if (!date) return null;
  return new Date(date).toISOString();
}

/**
 * Parse a date value into a Date object
 * Handles ISO strings, timestamps, and Date objects
 * @param {Date|string|number} value - Value to parse
 * @returns {Date|null} Date object or null if invalid
 */
function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;

  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Get current timestamp in milliseconds (for performance metrics)
 * @returns {number} Timestamp in milliseconds
 */
function nowMs() {
  return Date.now();
}

/**
 * Format a date for file system paths (YYYY-MM-DD)
 * Note: Uses UTC to ensure consistent date boundaries across timezones
 * @param {Date|string|number} date - Date to format
 * @returns {string} Date slug (e.g., "2025-11-19")
 */
function formatDateSlug(date = new Date()) {
  const d = parseDate(date);
  if (!d) return null;

  // Use UTC to ensure consistent date boundaries
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Calculate duration in milliseconds between two dates
 * @param {Date|string|number} start - Start date
 * @param {Date|string|number} end - End date (defaults to now)
 * @returns {number} Duration in milliseconds
 */
function durationMs(start, end = new Date()) {
  const startDate = parseDate(start);
  const endDate = parseDate(end);

  if (!startDate || !endDate) return 0;

  return endDate.getTime() - startDate.getTime();
}

/**
 * Normalize API response timestamps to ISO 8601 UTC
 * Recursively processes objects/arrays to ensure all date fields are ISO strings
 * @param {*} obj - Object to normalize
 * @param {string[]} dateFields - Field names to treat as dates (default: common timestamp fields)
 * @returns {*} Normalized object
 */
function normalizeTimestamps(obj, dateFields = ['createdAt', 'updatedAt', 'timestamp', 'expiresAt', 'uploadedAt', 'deletedAt', 'savedAt', 'loggedAt', 'generatedAt', 'processedAt', 'validatedAt']) {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => normalizeTimestamps(item, dateFields));
  }

  const normalized = { ...obj };

  for (const [key, value] of Object.entries(normalized)) {
    // Convert date fields to ISO strings
    if (dateFields.includes(key) && value) {
      const date = parseDate(value);
      if (date) {
        normalized[key] = date.toISOString();
      }
    }
    // Recursively process nested objects
    else if (value && typeof value === 'object') {
      normalized[key] = normalizeTimestamps(value, dateFields);
    }
  }

  return normalized;
}

module.exports = {
  nowISO,
  toISO,
  parseDate,
  nowMs,
  formatDateSlug,
  durationMs,
  normalizeTimestamps,
};
