/**
 * @slimy/opps-runtime
 *
 * Experimental opportunities runtime for collecting, filtering, and managing
 * promotional offers and opportunities.
 */

// Export types
export type { Offer, OfferSourceType, Opportunity } from "./offers/types";

// Export offer collection functions
export {
  collectAllOfferOpportunitiesMock,
  buildOfferOpportunitiesFromUserProvided,
} from "./offers/unifiedCollector";

// Export safety filtering functions
export { isSafeOffer, isOfferLikelyScam } from "./offers/safety";
