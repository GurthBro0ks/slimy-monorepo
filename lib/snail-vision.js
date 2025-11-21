/**
 * Minimal stub for snail vision analytics.
 * Real implementation lives in future analytics module.
 *
 * This stub provides the basic API shape expected by admin-api
 * but returns a safe "disabled" status suitable for testing.
 */

/**
 * Analyze snail data from a URL
 * @param {string} dataUrl - The data URL containing snail image data
 * @returns {Promise<Object>} Analysis result
 */
async function analyzeSnailDataUrl(dataUrl) {
  return {
    status: 'disabled',
    notes: 'snail vision analytics stubbed in test environment',
    data: null,
  };
}

/**
 * Analyze snail data from a buffer
 * @param {Buffer} buffer - The image buffer
 * @returns {Promise<Object>} Analysis result
 */
async function analyzeSnailBuffer(buffer) {
  return {
    status: 'disabled',
    notes: 'snail vision analytics stubbed in test environment',
    data: null,
  };
}

module.exports = {
  analyzeSnailDataUrl,
  analyzeSnailBuffer,
};
