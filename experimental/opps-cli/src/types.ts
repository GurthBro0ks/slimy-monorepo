/**
 * Types for opps-api radar responses
 */

export interface RadarApiResponse {
  ok: boolean;
  mode?: string;
  profile?: any;    // keep loose for CLI
  snapshot?: any;
  error?: string;
}

export interface RadarCommandOptions {
  mode?: "quick" | "daily";
  maxPerDomain?: number;
  userId?: string;
}

export interface OpportunitySnapshot {
  opportunityId: string;
  domain: string;
  url: string;
  title: string;
  shortSummary: string;
  risk: string;
  estimatedReward?: number;
  estimatedTime?: number;
  lastChecked?: string;
}

export interface DomainGroup {
  domain: string;
  opportunities: OpportunitySnapshot[];
}
