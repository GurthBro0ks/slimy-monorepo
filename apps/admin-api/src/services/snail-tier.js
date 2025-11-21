"use strict";

/**
 * Snail Tier Calculator Service
 *
 * Calculates snail tier based on level, city level, relic power, and club contribution.
 *
 * TODO: Replace the simple scoring formula with the real Supersnail spreadsheet logic
 * when the detailed tier calculation requirements are available.
 */

/**
 * Calculate snail tier based on input stats
 *
 * Input stats for tier calculation.
 * Numbers are assumed to be non-negative; validation happens in route layer.
 *
 * @param {Object} stats - Snail statistics
 * @param {number} stats.level - Snail level
 * @param {number} stats.cityLevel - City level
 * @param {number} stats.relicPower - Relic power (can be large)
 * @param {number} stats.clubContribution - Club contribution
 * @returns {Object} Tier calculation result
 */
function calculateSnailTier({ level, cityLevel, relicPower, clubContribution }) {
  const lvl = Number(level) || 0;
  const city = Number(cityLevel) || 0;
  const relic = Number(relicPower) || 0;
  const club = Number(clubContribution) || 0;

  // Simple weighted score; TODO: replace with real formula / spreadsheet mapping.
  const score =
    lvl * 2 +
    city * 3 +
    relic * 0.001 + // assume relicPower can be large
    club * 1.5;

  let tier = "F";

  if (score >= 2000) tier = "S+";
  else if (score >= 1500) tier = "S";
  else if (score >= 1100) tier = "A";
  else if (score >= 800) tier = "B";
  else if (score >= 500) tier = "C";
  else if (score >= 250) tier = "D";
  else tier = "F";

  const summary = `Estimated tier: ${tier} (score ${Math.round(score)})`;

  const details = [
    `Level: ${lvl}`,
    `City level: ${city}`,
    `Relic power: ${relic}`,
    `Club contribution: ${club}`,
    `Score formula: level*2 + cityLevel*3 + relicPower*0.001 + clubContribution*1.5`,
  ];

  return {
    tier,
    score,
    summary,
    details,
  };
}

module.exports = { calculateSnailTier };
