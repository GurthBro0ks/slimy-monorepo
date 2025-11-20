/**
 * Opportunity Radar - builds snapshots of available opportunities
 */

import type {
  Opportunity,
  UserProfile,
  RadarSnapshot,
  OpportunityDomain,
} from "../../opps-core/src/types";
import {
  collectRebateOpportunitiesNow,
  collectUnclaimedPropertyNudgesNow,
} from "./collectors/foundMoney";

/**
 * Simple in-memory store for opportunities
 */
class OpportunityStore {
  private opportunities: Opportunity[] = [];

  add(opp: Opportunity): void {
    this.opportunities.push(opp);
  }

  addBatch(opps: Opportunity[]): void {
    this.opportunities.push(...opps);
  }

  getAll(): Opportunity[] {
    return [...this.opportunities];
  }

  getByDomain(domain: OpportunityDomain, limit?: number): Opportunity[] {
    const filtered = this.opportunities.filter((opp) => opp.domain === domain);
    return limit ? filtered.slice(0, limit) : filtered;
  }

  getAllDomains(): OpportunityDomain[] {
    const domains = new Set<OpportunityDomain>();
    this.opportunities.forEach((opp) => domains.add(opp.domain));
    return Array.from(domains);
  }
}

/**
 * Builds a radar snapshot for a given user profile
 *
 * @param profile - User profile with preferences
 * @param limitPerDomain - Optional limit on opportunities per domain category
 * @returns RadarSnapshot with categorized opportunities
 */
export async function buildRadarSnapshot(
  profile: UserProfile,
  limitPerDomain: number = 10
): Promise<RadarSnapshot> {
  const store = new OpportunityStore();

  // Collect opportunities from all collectors
  const [rebates, unclaimedNudges] = await Promise.all([
    collectRebateOpportunitiesNow(),
    collectUnclaimedPropertyNudgesNow(),
  ]);

  // Add all opportunities to the store
  store.addBatch(rebates);
  store.addBatch(unclaimedNudges);

  // Build topByCategory mapping
  const topByCategory: RadarSnapshot["topByCategory"] = {};
  const domains = store.getAllDomains();

  for (const domain of domains) {
    topByCategory[domain] = store.getByDomain(domain, limitPerDomain);
  }

  return {
    profileId: profile.userId,
    timestamp: new Date(),
    totalOpportunities: store.getAll().length,
    topByCategory,
  };
}
