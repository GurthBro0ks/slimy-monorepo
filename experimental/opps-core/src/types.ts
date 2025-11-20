/**
 * Core types for the opportunity radar engine.
 * These define the structure of opportunities, their metadata, and classification.
 */

/**
 * The type of opportunity, indicating what kind of action or event it represents.
 */
export type OpportunityType =
  | "market_move" // Financial market movements (stocks, crypto, etc.)
  | "trend_narrative" // Emerging trends or narratives to track
  | "class_action" // Legal class action opportunities
  | "freebie" // Free products, services, or promotions
  | "other"; // Catch-all for uncategorized opportunities

/**
 * The domain or category the opportunity belongs to.
 */
export type OpportunityDomain =
  | "stocks" // Stock market opportunities
  | "crypto" // Cryptocurrency opportunities
  | "video" // Video content or streaming opportunities
  | "search" // Search trends or SEO opportunities
  | "legal" // Legal matters (class actions, settlements, etc.)
  | "promo" // Promotions, deals, freebies
  | "misc"; // Miscellaneous

/**
 * The risk level associated with an opportunity.
 */
export type RiskLevel = "low" | "medium" | "high";

/**
 * How fresh/real-time the opportunity data is.
 */
export type FreshnessTier =
  | "realtime" // Data is real-time or near real-time (seconds to minutes old)
  | "fast_batch" // Updated frequently (minutes to hours old)
  | "slow_batch"; // Updated infrequently (hours to days old)

/**
 * Core opportunity interface representing a potential action or event.
 */
export interface Opportunity {
  /** Unique identifier for this opportunity */
  id: string;

  /** Type of opportunity */
  type: OpportunityType;

  /** Domain/category of the opportunity */
  domain: OpportunityDomain;

  /** Short, catchy title for the opportunity */
  title: string;

  /** Brief summary (1-2 sentences) */
  shortSummary: string;

  /** Optional detailed description or context */
  details?: string;

  /** Source identifier (e.g., "collector_crypto_whales", "collector_class_actions") */
  source: string;

  /** Opaque payload containing raw data from the source */
  rawData?: unknown;

  /** Estimated potential reward in base currency (USD). Null if unknown. */
  expectedRewardEstimate: number | null;

  /** Estimated time investment required in minutes. Null if unknown. */
  timeCostMinutesEstimate: number | null;

  /** Estimated capital required to pursue this opportunity. Null if none or unknown. */
  capitalRequiredEstimate: number | null;

  /** Risk level assessment */
  riskLevel: RiskLevel;

  /** How fresh/up-to-date this data is */
  freshnessTier: FreshnessTier;

  /** ISO 8601 timestamp when opportunity was first created */
  createdAt: string;

  /** ISO 8601 timestamp when opportunity was last updated */
  lastUpdatedAt: string;

  /** Optional additional metadata */
  metadata?: Record<string, unknown>;
}
