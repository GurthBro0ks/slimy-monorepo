/**
 * TypeScript interfaces for the Opportunity Radar API
 * Mirrors the opps-api response structures for UI consumption
 */

export interface Opportunity {
  id: string;
  title: string;
  shortSummary?: string;
  url?: string;
  domain?: string;
  estimatedReward?: number;
  estimatedTimeMinutes?: number;
  riskLevel?: 'low' | 'medium' | 'high';
  tags?: string[];
  detectedAt?: string;
  expiresAt?: string;
}

export interface ScoredOpportunity {
  opportunity: Opportunity;
  score: number;
  reason?: string;
}

export interface RadarSnapshot {
  generatedAt: string;
  mode: 'quick' | 'full';
  totalScanned: number;
  totalOpportunities: number;
  byDomain: {
    [domain: string]: ScoredOpportunity[];
  };
}

export interface RadarApiError {
  error: string;
  details?: string;
}
