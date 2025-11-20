/**
 * @slimy/opps-core
 *
 * Core library for the opportunity radar engine.
 * Provides types, scoring, and AI-facing interfaces for managing and ranking opportunities.
 *
 * @module opps-core
 */

// ============================================================================
// Core Types
// ============================================================================
export type {
  OpportunityType,
  OpportunityDomain,
  RiskLevel,
  FreshnessTier,
  Opportunity,
} from "./types";

// ============================================================================
// User Profile & Filtering
// ============================================================================
export type { UserProfile } from "./userProfile";
export { filterOpportunitiesForUser } from "./userProfile";

// ============================================================================
// Scoring & Ranking
// ============================================================================
export type { ScoredOpportunity } from "./scoring";
export { scoreOpportunity, rankOpportunitiesForUser } from "./scoring";

// ============================================================================
// AI Contracts
// ============================================================================
export type {
  RadarSnapshot,
  OpportunityBucket,
  WeeklyPlanDraft,
} from "./aiContracts";
export {
  createRadarSnapshot,
  createEmptyWeeklyPlan,
  createBasicWeeklyPlan,
} from "./aiContracts";
