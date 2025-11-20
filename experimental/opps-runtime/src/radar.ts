/**
 * Radar system for collecting and aggregating opportunities
 */

import {
  RadarSnapshot,
  UserProfile,
  createOpportunityStore,
} from "../../opps-core/src";
import {
  collectGigTaskOpportunitiesNow,
  collectMicroServiceOpportunitiesNow,
} from "./collectors/gigs";

/**
 * Build a snapshot of all available opportunities
 * Calls all collectors and aggregates results
 */
export async function buildRadarSnapshot(
  profile?: UserProfile
): Promise<RadarSnapshot> {
  const store = createOpportunityStore();

  // Collect opportunities from all sources
  const collectors = [
    collectGigTaskOpportunitiesNow,
    collectMicroServiceOpportunitiesNow,
  ];

  // Run all collectors in parallel
  const results = await Promise.all(collectors.map((collector) => collector()));

  // Add all opportunities to the store
  for (const opportunities of results) {
    store.addOpportunities(opportunities);
  }

  return {
    timestamp: new Date(),
    opportunities: store.getAll(),
    metadata: {
      collectorCount: collectors.length,
      totalOpportunities: store.getAll().length,
    },
  };
}

/**
 * Get current radar snapshot with all opportunities
 */
export async function getCurrentRadar(
  profile?: UserProfile
): Promise<RadarSnapshot> {
  return buildRadarSnapshot(profile);
}
