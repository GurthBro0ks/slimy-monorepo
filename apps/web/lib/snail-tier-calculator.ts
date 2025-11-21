/**
 * Snail Tier Calculator
 *
 * Pure frontend deterministic tier calculation for Super Snail players.
 * Maps numeric inputs (snail level, city level, relic power, club contribution)
 * to a tier letter with explanations and suggestions.
 */

export type TierLetter = "F" | "D" | "C" | "B" | "A" | "S" | "S+";

export type TierInputs = {
  snailLevel: number;        // e.g. 1–200
  cityLevel: number;         // e.g. 1–50
  relicPower: number;        // arbitrary scale, e.g. 0–100000
  clubContribution: number;  // weekly contribution or similar
};

export type TierResult = {
  tier: TierLetter;
  score: number;
  reasons: string[];
  suggestions: string[];
};

/**
 * Calculates the tier for a given set of snail stats.
 *
 * This is a deterministic, heuristic-based calculation that provides
 * consistent results for the same inputs. The exact thresholds and weights
 * are balanced for gameplay guidance but are not official game mechanics.
 *
 * @param inputs - The snail stats to evaluate
 * @returns A tier result with letter grade, score, reasons, and suggestions
 */
export function calculateTier(inputs: TierInputs): TierResult {
  const { snailLevel, cityLevel, relicPower, clubContribution } = inputs;

  // Basic normalized contributions:
  // - Snail level: fundamental progression (weight: 2)
  const snailScore = snailLevel * 2;

  // - City level: chunky progression milestone (weight: 3)
  const cityScore = cityLevel * 3;

  // - Relic power: logarithmic scaling for large numbers (weight: ~20 at 10k)
  const relicScore = Math.log10(Math.max(relicPower, 1)) * 20;

  // - Club contribution: capped to prevent dominance (max impact: 40)
  const clubScore = Math.min(clubContribution / 100, 40);

  // Calculate raw score
  const rawScore = snailScore + cityScore + relicScore + clubScore;

  // Determine tier based on score thresholds
  let tier: TierLetter = "F";
  if (rawScore >= 200 && rawScore < 300) tier = "D";
  if (rawScore >= 300 && rawScore < 400) tier = "C";
  if (rawScore >= 400 && rawScore < 500) tier = "B";
  if (rawScore >= 500 && rawScore < 600) tier = "A";
  if (rawScore >= 600 && rawScore < 700) tier = "S";
  if (rawScore >= 700) tier = "S+";

  // Generate reasons and suggestions
  const reasons: string[] = [];
  const suggestions: string[] = [];

  // Snail level analysis
  if (snailLevel < 100) {
    reasons.push("Snail level is below 100, limiting overall tier.");
    suggestions.push("Focus on leveling your snail past 100.");
  } else if (snailLevel < 150) {
    reasons.push("Snail level is in a solid mid-range.");
    suggestions.push("Continue leveling to unlock advanced content.");
  } else {
    reasons.push("Snail level is excellent for your tier.");
  }

  // City level analysis
  if (cityLevel < 30) {
    reasons.push("City level is below 30.");
    suggestions.push("Invest in city upgrades to at least 30+.");
  } else if (cityLevel < 40) {
    reasons.push("City level is strong for your tier.");
  } else {
    reasons.push("City level is maximized or near-maximum.");
  }

  // Relic power analysis
  if (relicPower < 20000) {
    reasons.push("Relic power is relatively low.");
    suggestions.push("Upgrade key relics and prioritize power-boosting sets.");
  } else if (relicPower < 50000) {
    reasons.push("Relic power is in a good range.");
    suggestions.push("Focus on optimizing relic synergies and sets.");
  } else {
    reasons.push("Relic power is exceptional.");
  }

  // Club contribution analysis
  if (clubContribution < 500) {
    reasons.push("Club contribution appears low.");
    suggestions.push("Participate in weekly club activities to boost contribution.");
  } else if (clubContribution < 2000) {
    reasons.push("Club contribution is moderate.");
    suggestions.push("Consider increasing club activity for better rewards.");
  } else {
    reasons.push("Club contribution is strong.");
  }

  return {
    tier,
    score: Math.round(rawScore),
    reasons,
    suggestions,
  };
}

/**
 * Get a color class for a tier letter (Tailwind CSS classes).
 */
export function getTierColor(tier: TierLetter): string {
  switch (tier) {
    case "S+":
      return "text-purple-400";
    case "S":
      return "text-yellow-400";
    case "A":
      return "text-emerald-400";
    case "B":
      return "text-blue-400";
    case "C":
      return "text-slate-400";
    case "D":
      return "text-orange-400";
    case "F":
      return "text-red-400";
    default:
      return "text-slate-400";
  }
}

/**
 * Get a description for a tier letter.
 */
export function getTierDescription(tier: TierLetter): string {
  switch (tier) {
    case "S+":
      return "Elite player - top tier in all aspects";
    case "S":
      return "Excellent player - very strong overall";
    case "A":
      return "Strong player - well-developed progression";
    case "B":
      return "Good player - solid mid-game progress";
    case "C":
      return "Developing player - making steady progress";
    case "D":
      return "Early player - focus on fundamentals";
    case "F":
      return "New player - just getting started";
    default:
      return "Unknown tier";
  }
}
