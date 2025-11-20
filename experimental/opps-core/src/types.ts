/**
 * Core types for the Opportunities system
 */

/**
 * Domain/category for an opportunity
 */
export type OpportunityDomain =
  | "career"
  | "education"
  | "networking"
  | "finance"
  | "health"
  | "personal"
  | "other";

/**
 * Base Opportunity type
 */
export interface Opportunity {
  id: string;
  userId: string;
  domain: OpportunityDomain;
  title: string;
  description: string;
  source?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
