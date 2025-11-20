/**
 * Core types for the opportunities system.
 *
 * An "Opportunity" represents a potential action that could generate value,
 * whether immediate (e.g., selling an item) or long-term (e.g., learning a skill).
 */

/**
 * Opportunity types classify the general category of the opportunity.
 */
export type OpportunityType =
  | "arbitrage"       // Buy low, sell high
  | "gig"             // Short-term service work
  | "sale"            // Selling items
  | "investment"      // Financial investment
  | "other";          // Catch-all for misc opportunities

/**
 * Opportunity domains represent the market or context.
 */
export type OpportunityDomain =
  | "ecommerce"       // Online marketplaces
  | "freelance"       // Freelance platforms
  | "crypto"          // Cryptocurrency
  | "local"           // Local/offline opportunities
  | "misc";           // General/uncategorized

/**
 * Risk levels for opportunities.
 */
export type RiskLevel = "low" | "medium" | "high";

/**
 * Freshness tiers indicate how often the opportunity data should be refreshed.
 */
export type FreshnessTier =
  | "realtime"        // Needs constant refresh (e.g., crypto prices)
  | "hourly"          // Refresh every hour
  | "daily"           // Refresh once per day
  | "slow_batch";     // Refresh infrequently (e.g., skill opportunities)

/**
 * Core Opportunity interface.
 */
export interface Opportunity {
  /** Unique identifier for this opportunity */
  id: string;

  /** Human-readable title */
  title: string;

  /** Optional detailed description */
  description?: string;

  /** Type of opportunity */
  type: OpportunityType;

  /** Domain/market context */
  domain: OpportunityDomain;

  /** Risk assessment */
  riskLevel: RiskLevel;

  /** How often this should be refreshed */
  freshnessTier: FreshnessTier;

  /** Estimated reward in some unit (could be dollars, points, or arbitrary value) */
  expectedRewardEstimate: number;

  /** Estimated time cost in minutes */
  timeCostMinutesEstimate: number;

  /** Timestamp when this opportunity was collected */
  collectedAt: Date;

  /** Optional metadata for extensibility */
  metadata?: Record<string, unknown>;
}

/**
 * Helper type for skill investment opportunities.
 */
export interface SkillInvestmentMetadata {
  category: "skill_investment";
  area: "quant" | "automation" | "ai_tooling" | "frontend" | "infra";
  suggestedResources: string[];
  recommendedSessionLengthMinutes: number;
}

/**
 * RadarSnapshot represents a point-in-time view of all opportunities,
 * organized by domain.
 */
export interface RadarSnapshot {
  /** Timestamp of this snapshot */
  timestamp: Date;

  /** Opportunities grouped by domain */
  opportunitiesByDomain: Record<OpportunityDomain, Opportunity[]>;

  /** Total count of opportunities */
  totalCount: number;
}

/**
 * OpportunityStore manages the collection of opportunities.
 */
export class OpportunityStore {
  private opportunities: Map<string, Opportunity> = new Map();

  /**
   * Add an opportunity to the store.
   */
  add(opportunity: Opportunity): void {
    this.opportunities.set(opportunity.id, opportunity);
  }

  /**
   * Add multiple opportunities to the store.
   */
  addMany(opportunities: Opportunity[]): void {
    for (const opp of opportunities) {
      this.add(opp);
    }
  }

  /**
   * Get an opportunity by ID.
   */
  get(id: string): Opportunity | undefined {
    return this.opportunities.get(id);
  }

  /**
   * Get all opportunities.
   */
  getAll(): Opportunity[] {
    return Array.from(this.opportunities.values());
  }

  /**
   * Get opportunities by domain.
   */
  getByDomain(domain: OpportunityDomain): Opportunity[] {
    return this.getAll().filter(opp => opp.domain === domain);
  }

  /**
   * Clear all opportunities.
   */
  clear(): void {
    this.opportunities.clear();
  }

  /**
   * Get count of all opportunities.
   */
  get size(): number {
    return this.opportunities.size;
  }
}
