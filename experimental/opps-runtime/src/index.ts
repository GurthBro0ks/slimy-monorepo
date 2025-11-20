import type { Opportunity, RadarSnapshot, OpportunityDomain, RiskLevel } from '@slimy/opps-core';
import { collectMarketSignalsNow } from './collectors/markets';
import { collectTrendSignalsNow } from './collectors/trends';
import { collectClassActionOpportunitiesNow } from './collectors/classActions';
import { collectFreebieOpportunitiesNow } from './collectors/freebies';

export * from './collectors/markets';
export * from './collectors/trends';
export * from './collectors/classActions';
export * from './collectors/freebies';
export * from './collectors/utils';

/**
 * Builds a complete radar snapshot by collecting from all sources
 */
export async function buildRadarSnapshot(): Promise<RadarSnapshot> {
  const snapshotId = `snapshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();

  // Collect from all sources in parallel
  const [markets, trends, classActions, freebies] = await Promise.all([
    collectMarketSignalsNow(),
    collectTrendSignalsNow(),
    collectClassActionOpportunitiesNow(),
    collectFreebieOpportunitiesNow(),
  ]);

  const opportunities = [...markets, ...trends, ...classActions, ...freebies];

  // Calculate statistics
  const byDomain: Record<OpportunityDomain, number> = {
    stocks: 0,
    crypto: 0,
    video: 0,
    search: 0,
    legal: 0,
    promo: 0,
    saas: 0,
  };

  const byRisk: Record<RiskLevel, number> = {
    low: 0,
    medium: 0,
    high: 0,
  };

  opportunities.forEach((opp) => {
    byDomain[opp.domain] = (byDomain[opp.domain] || 0) + 1;
    byRisk[opp.riskLevel] = (byRisk[opp.riskLevel] || 0) + 1;
  });

  return {
    snapshotId,
    timestamp,
    opportunities,
    stats: {
      total: opportunities.length,
      byDomain,
      byRisk,
    },
  };
}

/**
 * Collect all opportunities from all sources
 */
export async function collectAllOpportunities(): Promise<Opportunity[]> {
  const snapshot = await buildRadarSnapshot();
  return snapshot.opportunities;
}
