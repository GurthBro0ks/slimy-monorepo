/**
 * Core types for the opportunities (opps) system
 */

/**
 * Type of opportunity
 */
export type OpportunityType = "other" | "grant" | "challenge" | "bounty";

/**
 * Domain categorization
 */
export type OpportunityDomain = "misc" | "tech" | "creative" | "research" | "business";

/**
 * Risk level assessment
 */
export type RiskLevel = "low" | "medium" | "high";

/**
 * Freshness tier for data updates
 */
export type FreshnessTier = "fast_batch" | "slow_batch" | "real_time";

/**
 * Core opportunity representation
 */
export interface Opportunity {
  /** Unique identifier */
  id: string;

  /** Human-readable title */
  title: string;

  /** Detailed description */
  description: string;

  /** Type of opportunity */
  type: OpportunityType;

  /** Domain classification */
  domain: OpportunityDomain;

  /** Risk level */
  riskLevel: RiskLevel;

  /** Freshness/update frequency tier */
  freshnessTier: FreshnessTier;

  /** Expected reward (monetary or points) */
  expectedRewardEstimate: number;

  /** Estimated time cost in minutes */
  timeCostMinutesEstimate: number;

  /** Additional metadata (extensible) */
  metadata?: Record<string, any>;

  /** When this opportunity was collected/created */
  collectedAt?: Date;

  /** Optional URL for more information */
  url?: string;
}

/**
 * User profile for filtering and scoring opportunities
 */
export interface UserProfile {
  /** Skills the user has */
  skills?: string[];

  /** Domains of interest */
  interests?: OpportunityDomain[];

  /** Maximum acceptable risk level */
  maxRiskLevel?: RiskLevel;

  /** Minimum reward threshold */
  minReward?: number;

  /** Maximum time willing to invest (minutes) */
  maxTimeMinutes?: number;

  /** Additional preferences */
  preferences?: Record<string, any>;
}

/**
 * Scored opportunity with calculated score
 */
export interface ScoredOpportunity extends Opportunity {
  score: number;
  scoreBreakdown?: {
    baseScore: number;
    rewardFactor: number;
    timeFactor: number;
    riskFactor: number;
    metadataBonus?: number;
  };
}

/**
 * Store for managing opportunities
 */
export interface OpportunityStore {
  opportunities: Opportunity[];

  addOpportunity(opp: Opportunity): void;
  addOpportunities(opps: Opportunity[]): void;
  getAll(): Opportunity[];
  filter(predicate: (opp: Opportunity) => boolean): Opportunity[];
  clear(): void;
}

/**
 * Radar snapshot containing all collected opportunities
 */
export interface RadarSnapshot {
  timestamp: Date;
  opportunities: Opportunity[];
  metadata?: {
    collectorCount?: number;
    totalOpportunities?: number;
  };
}
