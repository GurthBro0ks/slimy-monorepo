/**
 * Core Opportunity types for the experimental opps stack.
 * These represent unified opportunities from various sources (offers, tasks, etc.)
 */

export type OpportunityType =
  | "survey"
  | "rebate"
  | "cashback"
  | "referral"
  | "other";

export type OpportunityDomain =
  | "promo"
  | "finance"
  | "health"
  | "education"
  | "misc";

export type RiskLevel = "low" | "medium" | "high";

export type FreshnessTier = "fast_batch" | "slow_batch" | "stale";

/**
 * Core Opportunity interface representing a unified opportunity
 * that can come from various sources (offers, rebates, tasks, etc.)
 */
export interface Opportunity {
  /** Unique identifier for the opportunity */
  id?: string;

  /** Display title */
  title: string;

  /** Detailed description */
  description?: string;

  /** Short summary for quick display */
  shortSummary?: string;

  /** Type of opportunity */
  type: OpportunityType;

  /** Domain/category */
  domain: OpportunityDomain;

  /** Estimated reward value (in dollars or points) */
  expectedRewardEstimate?: number;

  /** Estimated time cost in minutes */
  timeCostMinutesEstimate?: number;

  /** Risk level assessment */
  riskLevel?: RiskLevel;

  /** Freshness tier for batching */
  freshnessTier?: FreshnessTier;

  /** Source URL or reference */
  sourceUrl?: string;

  /** Expiration date if applicable */
  expiresAt?: Date;

  /** Additional metadata (source-specific data) */
  metadata?: Record<string, any>;
}
