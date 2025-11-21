"use strict";

/**
 * Snail Screenshots Service
 *
 * Service for analyzing Super Snail screenshots and computing tier suggestions.
 * This is currently a stubbed implementation that returns placeholder data.
 *
 * TODO: Integrate with actual screenshot analysis pipeline
 * TODO: Extract real stats from screenshot images using OCR/Vision AI
 * TODO: Implement confidence scoring for extracted data
 */

const { computeScoreFromStats, mapScoreToTier } = require("./snail-tier-formulas");

/**
 * Get latest screenshot analysis for a user.
 *
 * Currently returns stubbed data with computed tier suggestions.
 * In a real implementation, this would:
 * - Fetch actual screenshot analysis results from storage
 * - Use Vision AI to extract stats from images
 * - Compute tier suggestions based on extracted stats
 *
 * @param {Object} params - Input parameters
 * @param {string} params.guildId - Guild ID
 * @param {string} params.userId - User ID
 * @returns {Object} Screenshot analysis results
 */
function getLatestScreenshotAnalysis({ guildId, userId }) {
  // TODO: Replace with actual data fetching logic
  // For now, return stubbed data with tier calculation

  const stubbedResults = [
    {
      imageUrl: `/api/uploads/files/snail/${guildId}/screenshot1.png`,
      timestamp: new Date().toISOString(),
      stats: {
        snailLevel: 45,
        cityLevel: 38,
        simPower: 125000,
        relicPower: 8500,
        clubContribution: 250,
        // These will be computed below
        suggestedTier: null,
        suggestedScore: null,
      },
      confidence: {
        snailLevel: 0.95,
        cityLevel: 0.92,
        simPower: 0.88,
        relicPower: 0.85,
        clubContribution: 0.90,
      },
      note: "Stubbed screenshot analysis - replace with real Vision AI extraction",
    },
    {
      imageUrl: `/api/uploads/files/snail/${guildId}/screenshot2.png`,
      timestamp: new Date().toISOString(),
      stats: {
        snailLevel: 52,
        cityLevel: 42,
        simPower: 185000,
        relicPower: 12300,
        clubContribution: 380,
        suggestedTier: null,
        suggestedScore: null,
      },
      confidence: {
        snailLevel: 0.96,
        cityLevel: 0.94,
        simPower: 0.91,
        relicPower: 0.87,
        clubContribution: 0.93,
      },
      note: "Stubbed screenshot analysis - replace with real Vision AI extraction",
    },
  ];

  // Compute suggested tier and score for each result
  for (const result of stubbedResults) {
    const score = computeScoreFromStats({
      level: result.stats.snailLevel,
      cityLevel: result.stats.cityLevel,
      relicPower: result.stats.relicPower,
      clubContribution: result.stats.clubContribution,
      simPower: result.stats.simPower,
    });

    const tier = mapScoreToTier(score);

    result.stats.suggestedTier = tier;
    result.stats.suggestedScore = score;
  }

  return {
    guildId,
    userId,
    analysis: {
      results: stubbedResults,
      summary: `Analyzed ${stubbedResults.length} screenshots with tier suggestions`,
      note: "This is stubbed data - integrate with real screenshot processing pipeline",
    },
  };
}

module.exports = {
  getLatestScreenshotAnalysis,
};
