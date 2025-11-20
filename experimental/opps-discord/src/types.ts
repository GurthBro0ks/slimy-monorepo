/**
 * Type definitions for opps-api responses
 * These mirror the types from the opps-api service
 */

export interface ScoredOpportunity {
  id: string;
  domain: string;
  title: string;
  url: string;
  score: number;
  metadata: {
    datePosted?: string;
    category?: string;
    amount?: string;
    deadline?: string;
    status?: string;
    [key: string]: any;
  };
}

export interface RadarSnapshot {
  mode: 'quick' | 'daily';
  timestamp: string;
  userId?: string;
  domains: {
    [domain: string]: ScoredOpportunity[];
  };
  summary: {
    totalOpportunities: number;
    domainCount: number;
    topScore: number;
  };
}

export interface RadarQueryParams {
  mode?: 'quick' | 'daily';
  maxPerDomain?: number;
  discordUserId?: string;
}

export interface OppsApiError {
  error: string;
  details?: string;
}
