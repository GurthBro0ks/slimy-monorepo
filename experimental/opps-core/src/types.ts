/**
 * Core types for the Opportunities (Opps) system.
 * An "Opportunity" represents an actionable item that could benefit the user.
 */

export type OpportunityType = "other" | "reward" | "optimization" | "engagement";

export type OpportunityDomain = "misc" | "finance" | "productivity" | "social";

export type RiskLevel = "low" | "medium" | "high";

export type FreshnessTier = "realtime" | "fast_batch" | "slow_batch" | "static";

/**
 * Represents an actionable opportunity for a user.
 */
export interface Opportunity {
  /** Unique identifier for this opportunity */
  id: string;

  /** Type of opportunity */
  type: OpportunityType;

  /** Domain/category */
  domain: OpportunityDomain;

  /** Short title describing the opportunity */
  title: string;

  /** Brief summary explaining the opportunity */
  shortSummary: string;

  /** Estimated reward/benefit (e.g., in dollars, points, etc.) */
  expectedRewardEstimate?: number;

  /** Estimated time cost in minutes to complete this opportunity */
  timeCostMinutesEstimate?: number;

  /** Risk level associated with this opportunity */
  riskLevel: RiskLevel;

  /** How fresh/time-sensitive this data is */
  freshnessTier: FreshnessTier;

  /** Additional metadata specific to the opportunity type */
  metadata?: Record<string, any>;
}
