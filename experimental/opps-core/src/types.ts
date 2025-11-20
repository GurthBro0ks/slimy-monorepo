/**
 * Core types for the Opportunity Radar system
 */

export type OpportunityType = "other" | "financial" | "career" | "education";

export type OpportunityDomain =
  | "promo"
  | "legal"
  | "misc"
  | "finance"
  | "career"
  | "learning";

export type RiskLevel = "low" | "medium" | "high";

export type FreshnessTier = "realtime" | "fast_poll" | "slow_batch";

export interface Opportunity {
  id: string;
  title: string;
  description: string;
  type: OpportunityType;
  domain: OpportunityDomain;
  riskLevel: RiskLevel;
  freshnessTier: FreshnessTier;
  expectedRewardEstimate?: number;
  timeCostMinutesEstimate?: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  expiresAt?: Date;
}

export interface UserProfile {
  userId: string;
  preferences?: {
    domains?: OpportunityDomain[];
    maxRisk?: RiskLevel;
  };
}

export interface RadarSnapshot {
  profileId: string;
  timestamp: Date;
  totalOpportunities: number;
  topByCategory: {
    [domain in OpportunityDomain]?: Opportunity[];
  };
}
