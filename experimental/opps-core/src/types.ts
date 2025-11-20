/**
 * Core types for the Opportunity Radar system.
 */

/**
 * Domain categories for opportunities
 */
export type OpportunityDomain =
  | "crypto"
  | "stocks"
  | "real-estate"
  | "business"
  | "career"
  | "education"
  | "other";

/**
 * Type of opportunity
 */
export type OpportunityType =
  | "investment"
  | "trade"
  | "learning"
  | "networking"
  | "job"
  | "side-hustle"
  | "other";

/**
 * Risk level assessment
 */
export type RiskLevel = "low" | "medium" | "high";

/**
 * Core opportunity interface
 */
export interface Opportunity {
  id: string;
  title: string;
  description: string;
  domain: OpportunityDomain;
  type: OpportunityType;
  riskLevel: RiskLevel;
  createdAt: string;
  metadata?: Record<string, unknown>;
}
