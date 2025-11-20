/**
 * Unified Offer Collector
 *
 * This module provides a single entry point for collecting all offer-based
 * opportunities from multiple lanes (official rebates, aggregators, page nudges, etc.)
 * and converting them into unified Opportunity objects.
 *
 * Key responsibilities:
 * - Aggregate offers from all collection lanes
 * - Convert offers to opportunities using the mapper
 * - Provide separate handling for user-provided offers (requires user input)
 * - Return a unified list ready for radar consumption
 */

import { Opportunity } from "../../opps-core/src/types";
import { UserProvidedOfferInput } from "./types";
import {
  collectOfficialRebateOffersMock,
  collectAggregatorOffersMock,
  collectSourcePageNudgesMock,
  normalizeUserProvidedOffers,
} from "./collectors";
import { offersToOpportunities } from "./opportunityMapper";

/**
 * Collects all offer-based opportunities from automated collection lanes.
 *
 * This function aggregates offers from:
 * - Official manufacturer/retailer rebates
 * - Aggregator sites (RetailMeNot, Slickdeals, etc.)
 * - Source page nudges (detected from browsing)
 *
 * Note: User-provided offers are handled separately via
 * buildOfferOpportunitiesFromUserProvided() since they require user input.
 *
 * @returns Promise resolving to array of Opportunity objects from all offer lanes
 */
export async function collectAllOfferOpportunitiesMock(): Promise<
  Opportunity[]
> {
  // Collect from all automated lanes in parallel
  const [official, aggregators, sourcePageNudges] = await Promise.all([
    collectOfficialRebateOffersMock(),
    collectAggregatorOffersMock(),
    collectSourcePageNudgesMock(),
  ]);

  // Combine all offers into a single array
  const allOffers = [...official, ...aggregators, ...sourcePageNudges];

  // Convert all offers to opportunities
  const opportunities = offersToOpportunities(allOffers);

  return opportunities;
}

/**
 * Builds Opportunity objects from user-provided offer inputs.
 *
 * This function handles user-submitted offers separately from automated
 * collection since it requires explicit user input. User-provided offers
 * can include personal discounts, codes received via email, etc.
 *
 * @param userId User identifier to associate with these offers
 * @param userInputs Array of user-provided offer data
 * @returns Array of Opportunity objects created from user inputs
 */
export function buildOfferOpportunitiesFromUserProvided(
  userId: string,
  userInputs: UserProvidedOfferInput[]
): Opportunity[] {
  // Normalize user inputs into standard Offer objects
  const offers = normalizeUserProvidedOffers(userInputs);

  // Convert to opportunities
  const opportunities = offersToOpportunities(offers);

  // Attach userId to metadata for tracking
  opportunities.forEach((opp) => {
    if (opp.metadata) {
      opp.metadata.userId = userId;
      opp.metadata.userProvided = true;
    }
  });

  return opportunities;
}
