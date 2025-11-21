"use strict";

/**
 * Snail Tier Service
 *
 * High-level service for calculating player tiers based on their stats.
 * Uses centralized formula helpers from snail-tier-formulas.js.
 */

const {
  computeScoreFromStats,
  mapScoreToTier,
  getTierDetails,
} = require("./snail-tier-formulas");

/**
 * Calculate snail tier for a player based on their stats.
 *
 * This is the main entry point for tier calculation. It accepts player stats,
 * computes a numeric score, maps it to a tier, and returns a structured result
 * with details and summary information.
 *
 * @param {Object} params - Input parameters
 * @param {number} params.level - Snail level
 * @param {number} params.cityLevel - City level
 * @param {number} [params.relicPower=0] - Total relic power
 * @param {number} [params.clubContribution=0] - Club contribution score
 * @param {number} [params.simPower=0] - Current SIM power
 * @param {number} [params.maxSimPower=0] - Maximum possible SIM power
 * @returns {Object} Tier calculation result
 * @returns {string} returns.tier - Calculated tier (S+, S, A, B, C, D, F)
 * @returns {number} returns.score - Numeric score
 * @returns {string} returns.summary - Human-readable summary
 * @returns {Object} returns.details - Detailed breakdown of the calculation
 */
function calculateSnailTier(params) {
  // Validate required fields
  if (!params || typeof params !== "object") {
    throw new Error("Invalid params: must be an object");
  }

  const { level, cityLevel, relicPower = 0, clubContribution = 0, simPower = 0, maxSimPower = 0 } = params;

  if (typeof level === "undefined" || level === null) {
    throw new Error("Missing required field: level");
  }

  if (typeof cityLevel === "undefined" || cityLevel === null) {
    throw new Error("Missing required field: cityLevel");
  }

  // Build stats object for formula computation
  const stats = {
    level: Number(level),
    cityLevel: Number(cityLevel),
    relicPower: Number(relicPower),
    clubContribution: Number(clubContribution),
    simPower: Number(simPower),
    maxSimPower: Number(maxSimPower),
  };

  // Compute score using centralized formula
  const score = computeScoreFromStats(stats);

  // Map score to tier
  const tier = mapScoreToTier(score);

  // Get tier details
  const tierInfo = getTierDetails(tier);

  // Build response
  return {
    tier,
    score,
    summary: `Player tier: ${tier} (score: ${score}) - ${tierInfo.description}`,
    details: {
      tier: tierInfo.tier,
      description: tierInfo.description,
      minScore: tierInfo.minScore,
      actualScore: score,
      stats: {
        level: stats.level,
        cityLevel: stats.cityLevel,
        relicPower: stats.relicPower,
        clubContribution: stats.clubContribution,
        simPower: stats.simPower,
        maxSimPower: stats.maxSimPower,
      },
      note: "Formula is simplified - real calculations will be more complex",
    },
  };
}

module.exports = {
  calculateSnailTier,
};
