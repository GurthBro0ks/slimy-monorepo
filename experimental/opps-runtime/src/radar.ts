/**
 * Radar module - orchestrates opportunity collection and snapshot generation.
 */

import type {
  Opportunity,
  OpportunityDomain,
  RadarSnapshot,
} from "@slimy/opps-core";
import { OpportunityStore } from "@slimy/opps-core";

// Import collectors
import { collectSkillInvestmentOpportunitiesNow } from "./collectors/skills.js";

/**
 * Build a complete radar snapshot by collecting opportunities from all sources.
 *
 * @returns A RadarSnapshot containing all current opportunities grouped by domain.
 */
export async function buildRadarSnapshot(): Promise<RadarSnapshot> {
  const store = new OpportunityStore();

  // Collect skill investment opportunities
  const skillOpps = await collectSkillInvestmentOpportunitiesNow();
  store.addMany(skillOpps);

  // Future: add other collectors here
  // const gigOpps = await collectGigOpportunities();
  // store.addMany(gigOpps);

  // Group opportunities by domain
  const opportunitiesByDomain: Record<OpportunityDomain, Opportunity[]> = {
    ecommerce: store.getByDomain("ecommerce"),
    freelance: store.getByDomain("freelance"),
    crypto: store.getByDomain("crypto"),
    local: store.getByDomain("local"),
    misc: store.getByDomain("misc"),
  };

  return {
    timestamp: new Date(),
    opportunitiesByDomain,
    totalCount: store.size,
  };
}
