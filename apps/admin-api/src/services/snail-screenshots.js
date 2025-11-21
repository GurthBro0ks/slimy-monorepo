/**
 * Snail Screenshots Analysis Service
 * Handles retrieval of analyzed screenshot data for users/guilds.
 */

/**
 * Returns the latest screenshot analysis for a given user/guild.
 *
 * @param {Object} params
 * @param {string|null} params.guildId - Discord guild ID (if available)
 * @param {string|null} params.userId - Discord user ID (if available)
 * @returns {Promise<Object>} Analysis data with runId, guildId, userId, and results array
 *
 * TODO: Replace with real file/DB-backed loader:
 * - Read from data/snail/<guildId>/<userId>/latest.json
 * - Implement real Discord auth/guild context integration
 * - Add pagination for large result sets
 * - Cache results appropriately
 */
async function getLatestSnailAnalysisForUser({ guildId, userId }) {
  // TODO: Replace stubbed data with real implementation
  // For now, return mock data that matches expected schema

  return {
    runId: "2025-11-21T09:15:00.000Z",
    guildId: guildId || "stub-guild-id",
    userId: userId || "stub-user-id",
    results: [
      {
        fileUrl: "https://example.com/snail/run1-1.png",
        uploadedBy: "GurthBrooks#1234",
        analyzedAt: "2025-11-21T09:15:00.000Z",
        stats: {
          simPower: 1247893,
          cityLevel: 45,
          snailLevel: 80,
          tier: "B",
        },
      },
      {
        fileUrl: "https://example.com/snail/run1-2.png",
        uploadedBy: "GurthBrooks#1234",
        analyzedAt: "2025-11-21T09:16:00.000Z",
        stats: {
          simPower: 980432,
          cityLevel: 38,
          snailLevel: 72,
          tier: "C",
        },
      },
    ],
  };
}

module.exports = { getLatestSnailAnalysisForUser };
