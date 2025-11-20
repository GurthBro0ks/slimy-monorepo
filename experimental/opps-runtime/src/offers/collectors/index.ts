/**
 * Collectors index
 * Central export point for all offer collectors
 */

// Official offers collector
export { collectOfficialRebateOffersMock } from "./official";

// Aggregator offers collector
export { collectAggregatorOffersMock } from "./aggregators";

// User-provided offers collector
export {
  normalizeUserProvidedOffers,
  UserProvidedOfferInput,
} from "./userProvided";

// Source page nudges collector
export { collectSourcePageNudgesMock } from "./sourcePages";
