import type { Opportunity, OpportunityType, OpportunityDomain, FreshnessTier, RiskLevel } from '@slimy/opps-core';

/**
 * Helper function to create an Opportunity with sensible defaults
 */
export function createOpportunity(
  partial: Partial<Opportunity> & {
    id: string;
    title: string;
    type: OpportunityType;
    domain: OpportunityDomain;
  }
): Opportunity {
  const now = new Date().toISOString();

  return {
    id: partial.id,
    title: partial.title,
    description: partial.description || '',
    type: partial.type,
    domain: partial.domain,
    detectedAt: partial.detectedAt || now,
    expiresAt: partial.expiresAt,
    freshnessTier: partial.freshnessTier || 'fast_batch',
    timeCostMinutesEstimate: partial.timeCostMinutesEstimate || 5,
    expectedRewardEstimate: partial.expectedRewardEstimate || 0,
    riskLevel: partial.riskLevel || 'medium',
    metadata: partial.metadata || {},
  };
}

/**
 * Generate a random date offset from now
 */
export function getRelativeDate(minutesOffset: number): string {
  const date = new Date();
  date.setMinutes(date.getMinutes() + minutesOffset);
  return date.toISOString();
}

/**
 * Get a future expiration date (in hours)
 */
export function getExpirationDate(hoursFromNow: number): string {
  const date = new Date();
  date.setHours(date.getHours() + hoursFromNow);
  return date.toISOString();
}
