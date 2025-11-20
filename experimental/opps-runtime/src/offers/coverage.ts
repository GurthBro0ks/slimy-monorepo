import type { OfferSourceType, OfferMerchantCoverage } from "./types.ts";

/**
 * Weights assigned to each source type for coverage scoring.
 * Higher weights indicate more valuable coverage sources.
 */
export type CoverageWeights = {
  officialManufacturer: number;
  retailer: number;
  aggregator: number;
  newsletter: number;
  userSubmitted: number;
  other: number;
};

/**
 * Default coverage weights for different offer source types.
 * These values reflect the relative importance/reliability of each source.
 */
export const DEFAULT_COVERAGE_WEIGHTS: CoverageWeights = {
  officialManufacturer: 40,
  retailer: 30,
  aggregator: 20,
  newsletter: 10,
  userSubmitted: 10,
  other: 5,
};

/**
 * Maps OfferSourceType to the corresponding CoverageWeights key.
 */
function getWeightKey(sourceType: OfferSourceType): keyof CoverageWeights {
  switch (sourceType) {
    case "official_manufacturer":
      return "officialManufacturer";
    case "retailer":
      return "retailer";
    case "aggregator":
      return "aggregator";
    case "newsletter":
      return "newsletter";
    case "user_submitted":
      return "userSubmitted";
    case "other":
      return "other";
  }
}

/**
 * Computes a coverage score for a merchant based on the source types available.
 *
 * The score is calculated by summing the weights of unique source types,
 * then clamping the result to the range [0, 100].
 *
 * @param merchant - The merchant identifier
 * @param sourceTypes - Array of source types (may contain duplicates)
 * @param weights - Coverage weights to use (defaults to DEFAULT_COVERAGE_WEIGHTS)
 * @returns OfferMerchantCoverage with merchant, score, and unique sources
 */
export function computeMerchantCoverageScore(
  merchant: string,
  sourceTypes: OfferSourceType[],
  weights: CoverageWeights = DEFAULT_COVERAGE_WEIGHTS
): OfferMerchantCoverage {
  // 1) Deduplicate sourceTypes
  const uniqueSourceTypes = Array.from(new Set(sourceTypes));

  // 2) Sum weights of unique types
  const rawScore = uniqueSourceTypes.reduce((sum, sourceType) => {
    const weightKey = getWeightKey(sourceType);
    return sum + weights[weightKey];
  }, 0);

  // 3) Clamp to 0–100
  const coverageScore = Math.max(0, Math.min(100, rawScore));

  // 4) Return coverage object
  return {
    merchant,
    coverageScore,
    sources: uniqueSourceTypes,
  };
}

/**
 * Computes coverage scores for all merchants from a collection of offers.
 *
 * Groups offers by merchant, collects unique source types for each,
 * and computes coverage scores.
 *
 * @param offers - Array of offers with optional merchant and sourceType
 * @param weights - Coverage weights to use (defaults to DEFAULT_COVERAGE_WEIGHTS)
 * @returns Array of OfferMerchantCoverage, one per merchant
 */
export function computeCoverageFromOffers(
  offers: { merchant?: string; sourceType: OfferSourceType }[],
  weights: CoverageWeights = DEFAULT_COVERAGE_WEIGHTS
): OfferMerchantCoverage[] {
  // Group offers by merchant (ignore offers without merchant)
  const merchantMap = new Map<string, Set<OfferSourceType>>();

  for (const offer of offers) {
    if (!offer.merchant) {
      continue; // Skip offers without merchant
    }

    if (!merchantMap.has(offer.merchant)) {
      merchantMap.set(offer.merchant, new Set());
    }

    merchantMap.get(offer.merchant)!.add(offer.sourceType);
  }

  // For each merchant, compute coverage score
  const coverageResults: OfferMerchantCoverage[] = [];

  for (const [merchant, sourceTypesSet] of merchantMap) {
    const sourceTypes = Array.from(sourceTypesSet);
    const coverage = computeMerchantCoverageScore(merchant, sourceTypes, weights);
    coverageResults.push(coverage);
  }

  return coverageResults;
}
