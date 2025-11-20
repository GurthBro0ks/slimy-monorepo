/**
 * @slimy/opps-ai - AI Integration Contracts for Opportunity Radar
 *
 * This package provides interfaces and mock implementations for AI-powered
 * features in the opportunity radar system. No external LLM APIs are called.
 */

// Export all types
export type {
  // Domain types
  Opportunity,
  ScoredOpportunity,
  RadarSnapshot,
  UserProfile,
  PlanBucket,
  WeeklyPlanDraft,
  FreshnessTier,
  RiskLevel,

  // AI contracts
  LLMProvider,
  RadarSummarizer,
  PlanGenerator,
} from './types';

// Export mock implementations
export { MockRadarSummarizer } from './mockSummarizer';
export { MockPlanGenerator } from './mockPlanGenerator';
