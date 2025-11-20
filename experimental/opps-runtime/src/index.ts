/**
 * Experimental opportunities runtime
 * For offer scoring, coverage analysis, and future recommendation features
 */

// Export types
export type { OfferSourceType, OfferMerchantCoverage } from "./offers/types.ts";

// Export coverage functionality
export {
  DEFAULT_COVERAGE_WEIGHTS,
  computeMerchantCoverageScore,
  computeCoverageFromOffers,
} from "./offers/coverage.ts";

export type { CoverageWeights } from "./offers/coverage.ts";
