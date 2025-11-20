/**
 * Type definitions for the Opportunities API (opps-api).
 * These types correspond to the radar endpoint response.
 */

export type OpportunityDomain =
  | 'stocks'
  | 'crypto'
  | 'video'
  | 'search'
  | 'legal'
  | 'promo';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface Opportunity {
  id: string;
  title: string;
  shortSummary: string;
  domain: OpportunityDomain;
  riskLevel: RiskLevel;
  estimatedReward?: string;
  estimatedTime?: string;
  confidence?: number;
  source?: string;
  timestamp?: string;
}

export interface RadarSnapshot {
  ok: boolean;
  timestamp: string;
  mode: 'quick' | 'daily';
  totalCount: number;
  topByCategory: {
    [key in OpportunityDomain]?: Opportunity[];
  };
  error?: string;
}

export interface RadarApiParams {
  mode: 'quick' | 'daily';
  maxPerDomain?: number;
}
