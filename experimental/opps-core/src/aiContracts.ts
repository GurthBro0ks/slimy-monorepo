/**
 * AI-facing contracts and data structures.
 * These pure-data interfaces are designed to be passed into LLMs for analysis,
 * planning, and decision-making.
 */

import type { OpportunityDomain } from "./types";
import type { UserProfile } from "./userProfile";
import type { ScoredOpportunity } from "./scoring";

/**
 * A snapshot of opportunities for a specific moment in time.
 * This can be passed to an LLM to get insights about current opportunities.
 */
export interface RadarSnapshot {
  /** The user this snapshot is for */
  user: UserProfile;

  /** ISO 8601 timestamp when this snapshot was generated */
  generatedAt: string;

  /**
   * Top opportunities organized by category/domain.
   * Each domain contains an array of the best-scoring opportunities in that domain.
   */
  topByCategory: {
    [key in OpportunityDomain]?: ScoredOpportunity[];
  };
}

/**
 * A bucket of opportunities grouped by some criteria (e.g., time horizon, risk, theme).
 */
export interface OpportunityBucket {
  /** Human-readable label for this bucket (e.g., "Quick wins", "Long-term plays") */
  label: string;

  /** Opportunities in this bucket */
  opportunities: ScoredOpportunity[];

  /** Optional commentary or rationale for grouping these together */
  commentary?: string;
}

/**
 * A draft weekly plan with suggested opportunity buckets.
 * This can be passed to an LLM to generate a structured plan for the user.
 */
export interface WeeklyPlanDraft {
  /** The user this plan is for */
  user: UserProfile;

  /** How many days ahead this plan covers */
  horizonDays: number;

  /**
   * Suggested buckets of opportunities organized by theme, time horizon, or priority.
   * For example:
   * - "Quick wins (today)" - Low effort, immediate opportunities
   * - "This week" - Medium-term opportunities requiring more time
   * - "Research & monitor" - Longer-term opportunities to track
   */
  suggestedBuckets: OpportunityBucket[];
}

/**
 * Helper function to create a radar snapshot from scored opportunities.
 *
 * @param user The user profile
 * @param scoredOpportunities Array of scored opportunities
 * @param maxPerCategory Maximum opportunities to include per category
 * @returns A RadarSnapshot ready to pass to an LLM
 */
export function createRadarSnapshot(
  user: UserProfile,
  scoredOpportunities: ScoredOpportunity[],
  maxPerCategory: number = 5
): RadarSnapshot {
  const topByCategory: RadarSnapshot["topByCategory"] = {};

  // Group opportunities by domain
  const byDomain = new Map<OpportunityDomain, ScoredOpportunity[]>();

  for (const scored of scoredOpportunities) {
    const domain = scored.opportunity.domain;
    if (!byDomain.has(domain)) {
      byDomain.set(domain, []);
    }
    byDomain.get(domain)!.push(scored);
  }

  // For each domain, take top N by score
  for (const [domain, opportunities] of byDomain.entries()) {
    // Sort by score descending
    const sorted = [...opportunities].sort((a, b) => b.score - a.score);
    topByCategory[domain] = sorted.slice(0, maxPerCategory);
  }

  return {
    user,
    generatedAt: new Date().toISOString(),
    topByCategory,
  };
}

/**
 * Helper function to create an empty weekly plan draft.
 * This can be populated by an LLM or used as a starting point.
 *
 * @param user The user profile
 * @param horizonDays How many days ahead to plan
 * @returns An empty WeeklyPlanDraft
 */
export function createEmptyWeeklyPlan(
  user: UserProfile,
  horizonDays: number = 7
): WeeklyPlanDraft {
  return {
    user,
    horizonDays,
    suggestedBuckets: [],
  };
}

/**
 * Helper function to create a basic weekly plan with default buckets.
 * This provides a simple categorization by time horizon.
 *
 * @param user The user profile
 * @param scoredOpportunities Array of scored opportunities
 * @param horizonDays How many days ahead to plan
 * @returns A WeeklyPlanDraft with basic time-based buckets
 */
export function createBasicWeeklyPlan(
  user: UserProfile,
  scoredOpportunities: ScoredOpportunity[],
  horizonDays: number = 7
): WeeklyPlanDraft {
  // Sort by score
  const sorted = [...scoredOpportunities].sort((a, b) => b.score - a.score);

  // Create simple time-based buckets
  const quickWins = sorted.filter(
    (s) => (s.opportunity.timeCostMinutesEstimate ?? 0) <= 30
  );

  const mediumTerm = sorted.filter((s) => {
    const time = s.opportunity.timeCostMinutesEstimate ?? 0;
    return time > 30 && time <= 120;
  });

  const longTerm = sorted.filter(
    (s) => (s.opportunity.timeCostMinutesEstimate ?? 0) > 120
  );

  const buckets: OpportunityBucket[] = [];

  if (quickWins.length > 0) {
    buckets.push({
      label: "Quick wins (< 30 min)",
      opportunities: quickWins.slice(0, 10),
      commentary: "Low time investment opportunities you can tackle immediately",
    });
  }

  if (mediumTerm.length > 0) {
    buckets.push({
      label: "This week (30 min - 2 hrs)",
      opportunities: mediumTerm.slice(0, 10),
      commentary: "Medium-effort opportunities to schedule this week",
    });
  }

  if (longTerm.length > 0) {
    buckets.push({
      label: "Research & monitor (> 2 hrs)",
      opportunities: longTerm.slice(0, 5),
      commentary: "Higher-effort opportunities to research and track",
    });
  }

  return {
    user,
    horizonDays,
    suggestedBuckets: buckets,
  };
}
