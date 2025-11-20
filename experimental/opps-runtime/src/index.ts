/**
 * opps-runtime: Runtime components for the opportunity system
 *
 * This package provides:
 * - Offer collection from multiple sources
 * - Offer → Opportunity mapping
 * - Unified offer aggregation for radar consumption
 */

// Export offer types
export type { Offer, OfferMoneyValue, OfferType, OfferSourceType, UserProvidedOfferInput } from "./offers/types";

// Export offer collectors
export {
  collectOfficialRebateOffersMock,
  collectAggregatorOffersMock,
  collectSourcePageNudgesMock,
  normalizeUserProvidedOffers,
} from "./offers/collectors";

// Export opportunity mapper
export {
  offerToOpportunity,
  offersToOpportunities,
  estimateOfferSavings,
  estimateOfferTimeCostMinutes,
} from "./offers/opportunityMapper";

// Export unified collector
export {
  collectAllOfferOpportunitiesMock,
  buildOfferOpportunitiesFromUserProvided,
} from "./offers/unifiedCollector";
