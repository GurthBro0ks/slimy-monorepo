/**
 * Core type definitions for the Opportunities system
 */

export type OpportunityType =
  | 'market-signal'
  | 'trend-signal'
  | 'class-action'
  | 'freebie'
  | 'promo';

export type OpportunityDomain =
  | 'stocks'
  | 'crypto'
  | 'video'
  | 'search'
  | 'legal'
  | 'promo'
  | 'saas';

export type FreshnessTier =
  | 'realtime'
  | 'fast_batch'
  | 'slow_batch';

export type RiskLevel =
  | 'low'
  | 'medium'
  | 'high';

export interface Opportunity {
  id: string;
  title: string;
  description: string;
  type: OpportunityType;
  domain: OpportunityDomain;

  // Time and freshness
  detectedAt: string; // ISO timestamp
  expiresAt?: string; // ISO timestamp
  freshnessTier: FreshnessTier;

  // Estimates
  timeCostMinutesEstimate: number;
  expectedRewardEstimate: number; // In USD
  riskLevel: RiskLevel;

  // Additional metadata (flexible, collector-specific)
  metadata: Record<string, any>;
}

export interface RadarSnapshot {
  snapshotId: string;
  timestamp: string;
  opportunities: Opportunity[];
  stats: {
    total: number;
    byDomain: Record<OpportunityDomain, number>;
    byRisk: Record<RiskLevel, number>;
  };
}
