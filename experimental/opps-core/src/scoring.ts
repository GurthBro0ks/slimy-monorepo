/**
 * Opportunity scoring and ranking logic.
 * Uses simple heuristics to calculate expected value and prioritize opportunities.
 */

import type { Opportunity, RiskLevel } from "./types";
import type { UserProfile } from "./userProfile";
import { filterOpportunitiesForUser } from "./userProfile";

/**
 * An opportunity with its calculated score and reasoning.
 */
export interface ScoredOpportunity {
  /** The original opportunity */
  opportunity: Opportunity;

  /** Calculated score (higher is better) */
  score: number;

  /** Human-readable reasons for the score */
  reasons: string[];
}

/**
 * Risk level multipliers for scoring.
 * Lower risk = higher multiplier (more favorable).
 */
const RISK_MULTIPLIERS: Record<RiskLevel, number> = {
  low: 1.0, // No penalty for low risk
  medium: 0.7, // 30% penalty for medium risk
  high: 0.4, // 60% penalty for high risk
};

/**
 * Default reward estimate when opportunity has no explicit reward value.
 * This prevents opportunities from being completely ignored.
 */
const DEFAULT_REWARD_ESTIMATE = 10;

/**
 * Cost per minute of time investment.
 * Used to convert time cost into monetary equivalent for scoring.
 * Assumes $30/hour = $0.50/minute as opportunity cost.
 */
const TIME_COST_PER_MINUTE = 0.5;

/**
 * Score a single opportunity based on user profile and heuristics.
 *
 * Scoring logic:
 * 1. Start with expected reward (or default if unknown)
 * 2. Subtract time cost (converted to monetary value)
 * 3. Apply risk multiplier based on user's risk tolerance
 * 4. Penalize heavily if capital requirement exceeds user's limit (should be filtered out)
 * 5. Add small bonus for matching user preferences
 *
 * @param opportunity The opportunity to score
 * @param profile The user profile with preferences and constraints
 * @returns Scored opportunity with score and reasoning
 */
export function scoreOpportunity(
  opportunity: Opportunity,
  profile: UserProfile
): ScoredOpportunity {
  const reasons: string[] = [];
  let score = 0;

  // Step 1: Base reward
  const reward = opportunity.expectedRewardEstimate ?? DEFAULT_REWARD_ESTIMATE;
  score += reward;
  if (opportunity.expectedRewardEstimate !== null) {
    reasons.push(`Expected reward: $${reward}`);
  } else {
    reasons.push(`Default reward estimate: $${reward}`);
  }

  // Step 2: Time cost penalty
  const timeCost = opportunity.timeCostMinutesEstimate ?? 0;
  if (timeCost > 0) {
    const timeCostValue = timeCost * TIME_COST_PER_MINUTE;
    score -= timeCostValue;
    reasons.push(`Time cost: ${timeCost} min (-$${timeCostValue.toFixed(2)})`);
  }

  // Step 3: Risk multiplier
  const riskMultiplier = RISK_MULTIPLIERS[opportunity.riskLevel];
  const preRiskScore = score;
  score *= riskMultiplier;
  if (riskMultiplier < 1.0) {
    reasons.push(
      `Risk penalty: ${opportunity.riskLevel} risk (×${riskMultiplier}, -$${(preRiskScore - score).toFixed(2)})`
    );
  }

  // Step 4: Capital requirement penalty (hard constraint violation)
  // This should rarely happen since filtering should remove these,
  // but we apply a severe penalty just in case.
  if (
    profile.maxCapitalPerOpportunity !== null &&
    opportunity.capitalRequiredEstimate !== null &&
    opportunity.capitalRequiredEstimate > profile.maxCapitalPerOpportunity
  ) {
    score -= 1000; // Severe penalty
    reasons.push(
      `Capital exceeds limit: $${opportunity.capitalRequiredEstimate} > $${profile.maxCapitalPerOpportunity} (-$1000)`
    );
  }

  // Step 5: Preference bonuses (small boost for matching preferences)
  let preferenceBonus = 0;

  // Domain preference bonus
  if (profile.prefersDomains?.includes(opportunity.domain)) {
    preferenceBonus += 5;
    reasons.push(`Domain preference: ${opportunity.domain} (+$5)`);
  }

  // Type preference bonus
  if (profile.prefersTypes?.includes(opportunity.type)) {
    preferenceBonus += 5;
    reasons.push(`Type preference: ${opportunity.type} (+$5)`);
  }

  score += preferenceBonus;

  // Round score to 2 decimal places for readability
  score = Math.round(score * 100) / 100;

  return {
    opportunity,
    score,
    reasons,
  };
}

/**
 * Rank opportunities for a user based on their profile.
 *
 * Process:
 * 1. Filter opportunities using hard constraints (risk, capital, time, avoids)
 * 2. Score each remaining opportunity
 * 3. Sort by score (descending)
 * 4. Return top N opportunities
 *
 * @param profile User profile with preferences and constraints
 * @param opportunities Array of opportunities to rank
 * @param limit Maximum number of opportunities to return
 * @returns Sorted array of scored opportunities (best first)
 */
export function rankOpportunitiesForUser(
  profile: UserProfile,
  opportunities: Opportunity[],
  limit: number
): ScoredOpportunity[] {
  // Step 1: Apply hard filters
  const filtered = filterOpportunitiesForUser(profile, opportunities);

  // Step 2: Score each opportunity
  const scored = filtered.map((opp) => scoreOpportunity(opp, profile));

  // Step 3: Sort by score (descending)
  scored.sort((a, b) => b.score - a.score);

  // Step 4: Return top N
  return scored.slice(0, limit);
}
