"use strict";

/**
 * Snail Tier Calculation Formulas
 *
 * Centralized score computation and tier mapping for Super Snail.
 *
 * TODO: Replace placeholder formulas with real Supersnail spreadsheet logic
 * TODO: Implement dynamic threshold tables based on game meta
 * TODO: Add support for more complex stat interactions (synergies, diminishing returns)
 */

// ============================================================================
// TIER THRESHOLDS
// ============================================================================
// These thresholds map numeric scores to tier rankings.
// TODO: Tune these values based on actual game data and player distribution

const TIER_THRESHOLDS = [
  { tier: "S+", minScore: 1000 },
  { tier: "S",  minScore: 800 },
  { tier: "A",  minScore: 600 },
  { tier: "B",  minScore: 400 },
  { tier: "C",  minScore: 200 },
  { tier: "D",  minScore: 100 },
  { tier: "F",  minScore: 0 },
];

// ============================================================================
// SCORE COMPUTATION
// ============================================================================

/**
 * Compute a numeric score from player stats.
 *
 * This is a simplified placeholder formula. In a real implementation, this
 * would incorporate complex game mechanics like:
 * - Diminishing returns on certain stats
 * - Synergies between different stat categories
 * - Meta-dependent weighting (what's strong this patch?)
 * - Threshold effects (e.g., certain breakpoints matter more)
 *
 * @param {Object} stats - Player statistics
 * @param {number} [stats.level=0] - Snail level
 * @param {number} [stats.cityLevel=0] - City level
 * @param {number} [stats.relicPower=0] - Total relic power
 * @param {number} [stats.clubContribution=0] - Club contribution score
 * @param {number} [stats.simPower=0] - Current SIM power
 * @param {number} [stats.maxSimPower=0] - Maximum possible SIM power
 * @param {number} [stats.snailLevel=0] - Alias for level (for screenshot compatibility)
 * @returns {number} Computed score
 */
function computeScoreFromStats(stats = {}) {
  // Normalize inputs - handle both 'level' and 'snailLevel' field names
  const lvl = Number(stats.level || stats.snailLevel) || 0;
  const city = Number(stats.cityLevel) || 0;
  const relic = Number(stats.relicPower) || 0;
  const club = Number(stats.clubContribution) || 0;
  const sim = Number(stats.simPower) || 0;
  const maxSim = Number(stats.maxSimPower) || 0;

  // Base formula: simple weighted sum
  // TODO: Replace with real Supersnail spreadsheet calculations
  let score =
    lvl * 2 +              // Snail level: moderate weight
    city * 3 +             // City level: higher weight (infrastructure matters)
    relic * 0.001 +        // Relic power: scaled down (often large numbers)
    club * 1.5;            // Club contribution: decent weight

  // SIM power contribution (optional stat)
  // TODO: Incorporate maxSimPower for efficiency rating
  // TODO: Add diminishing returns or threshold effects
  if (sim > 0) {
    score += sim * 0.0005;

    // Future: could use efficiency ratio
    // if (maxSim > 0) {
    //   const efficiency = sim / maxSim;
    //   score += efficiency * 50; // Bonus for high efficiency
    // }
  }

  return Math.round(score * 100) / 100; // Round to 2 decimal places
}

// ============================================================================
// TIER MAPPING
// ============================================================================

/**
 * Map a numeric score to a tier ranking.
 *
 * Uses the TIER_THRESHOLDS table to determine the appropriate tier.
 * Thresholds are checked from highest to lowest.
 *
 * @param {number} score - Numeric score from computeScoreFromStats
 * @returns {string} Tier ranking (S+, S, A, B, C, D, F)
 */
function mapScoreToTier(score) {
  if (typeof score !== "number" || isNaN(score)) {
    return "F";
  }

  for (const { tier, minScore } of TIER_THRESHOLDS) {
    if (score >= minScore) {
      return tier;
    }
  }

  return "F"; // Fallback
}

// ============================================================================
// TIER DETAILS
// ============================================================================

/**
 * Get detailed information about a tier.
 *
 * @param {string} tier - Tier ranking
 * @returns {Object} Tier details including description and threshold info
 */
function getTierDetails(tier) {
  const tierInfo = TIER_THRESHOLDS.find(t => t.tier === tier);

  const descriptions = {
    "S+": "Elite tier - Top 1% of players",
    "S":  "Excellent tier - Top 5% of players",
    "A":  "Strong tier - Top 15% of players",
    "B":  "Above average tier - Top 40% of players",
    "C":  "Average tier - Middle of the pack",
    "D":  "Below average tier - Room for improvement",
    "F":  "Beginner tier - Just getting started",
  };

  return {
    tier,
    description: descriptions[tier] || "Unknown tier",
    minScore: tierInfo ? tierInfo.minScore : 0,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  computeScoreFromStats,
  mapScoreToTier,
  getTierDetails,
  TIER_THRESHOLDS, // Export for testing/debugging
};
