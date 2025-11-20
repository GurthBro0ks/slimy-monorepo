/**
 * Offer → Opportunity Mapper
 *
 * This module provides deterministic mapping logic to convert Offer objects
 * into unified Opportunity objects that can be consumed by the radar system.
 *
 * Key responsibilities:
 * - Estimate savings from offer details (fixed discount, percent off, etc.)
 * - Estimate time cost based on offer type and source
 * - Assign appropriate risk levels and freshness tiers
 * - Preserve all original offer data in metadata
 */

import { Offer, OfferMoneyValue } from "./types";
import {
  Opportunity,
  OpportunityType,
  OpportunityDomain,
  RiskLevel,
  FreshnessTier,
} from "../../opps-core/src/types";

/**
 * Estimates the monetary savings value of an offer in dollars.
 *
 * Heuristic logic:
 * 1. If fixedDiscount exists → use that amount (convert cents to dollars)
 * 2. Else if percentOff and minSpend exist → calculate percentOff * minSpend
 * 3. Else if just percentOff → use conservative estimate (10% of $50 = $5)
 * 4. Else fall back to minimal default ($5)
 *
 * @param offer The offer to estimate savings for
 * @returns Estimated savings in dollars
 */
export function estimateOfferSavings(offer: Offer): number {
  // Priority 1: Fixed discount amount
  if (offer.fixedDiscount) {
    // Convert from cents to dollars (assuming amount is in smallest currency unit)
    return offer.fixedDiscount.amount / 100;
  }

  // Priority 2: Percentage discount with minimum spend
  if (offer.percentOff && offer.minSpend) {
    const baseAmount = offer.minSpend.amount / 100; // Convert to dollars
    return (offer.percentOff / 100) * baseAmount;
  }

  // Priority 3: Percentage discount only (use conservative baseline)
  if (offer.percentOff) {
    // Assume average purchase of $50 for estimation
    const conservativeBaseline = 50;
    return (offer.percentOff / 100) * conservativeBaseline;
  }

  // Fallback: Conservative default
  return 5;
}

/**
 * Estimates the time cost in minutes required to use this offer.
 *
 * Heuristic based on sourceType and offerType:
 * - Official manufacturer/retailer with simple code: 5-10 min (finding, copying, applying)
 * - Rebates with paperwork: 20-40 min (forms, mail-in process, tracking)
 * - Aggregator-derived codes: 5-10 min with small verification overhead
 * - User-submitted: 5-8 min (varies by complexity)
 * - Newsletter/detected offers: 5-10 min
 *
 * @param offer The offer to estimate time cost for
 * @returns Estimated time cost in minutes
 */
export function estimateOfferTimeCostMinutes(offer: Offer): number {
  const { sourceType, offerType, metadata } = offer;

  // Rebates typically require significant paperwork and processing
  if (offerType === "rebate") {
    // Mail-in rebates are more time-consuming
    if (metadata?.requiresPaperwork === true) {
      return 30; // Form filling, envelope, mailing, tracking
    }
    // Instant rebates are quicker
    if (metadata?.instantDiscount === true) {
      return 10;
    }
    // Default rebate time
    return 25;
  }

  // Official sources with coupon codes
  if (
    (sourceType === "official_manufacturer" ||
      sourceType === "official_retailer") &&
    offerType === "coupon_code"
  ) {
    return 7; // Find offer, copy code, apply at checkout
  }

  // Aggregator offers may need verification
  if (sourceType === "aggregator") {
    if (metadata?.verificationStatus === "verified") {
      return 6; // Slightly less risk of invalid codes
    }
    return 8; // May need to try multiple codes
  }

  // User-submitted offers
  if (sourceType === "user_submitted") {
    return 5; // User already has the details
  }

  // Newsletter and other sources
  if (sourceType === "newsletter") {
    return 7;
  }

  // General sales/bundles (passive savings)
  if (offerType === "sale" || offerType === "bundle") {
    return 5; // Just need to recognize and purchase
  }

  // Default fallback
  return 10;
}

/**
 * Determines the risk level for an offer based on its source.
 *
 * Risk assessment:
 * - Low: Official manufacturer/retailer sources (verified, trusted)
 * - Medium: Aggregators, newsletters (may have expired/invalid codes)
 * - Medium: User-submitted (unverified but community-sourced)
 *
 * @param offer The offer to assess risk for
 * @returns Risk level assessment
 */
function determineRiskLevel(offer: Offer): RiskLevel {
  const { sourceType } = offer;

  // Official sources are low risk
  if (
    sourceType === "official_manufacturer" ||
    sourceType === "official_retailer"
  ) {
    return "low";
  }

  // All other sources default to medium risk
  // (aggregator, newsletter, user_submitted)
  return "medium";
}

/**
 * Determines the freshness tier for batching and processing priority.
 *
 * Freshness logic:
 * - "fast_batch": Expires within 7 days (requires urgent action)
 * - "slow_batch": Everything else (standard processing)
 *
 * @param offer The offer to assess freshness for
 * @returns Freshness tier
 */
function determineFreshnessTier(offer: Offer): FreshnessTier {
  if (!offer.expiresAt) {
    return "slow_batch"; // No expiration → not urgent
  }

  const now = new Date();
  const daysUntilExpiration =
    (offer.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

  // Expires within a week → fast batch
  if (daysUntilExpiration <= 7) {
    return "fast_batch";
  }

  return "slow_batch";
}

/**
 * Maps a single Offer to an Opportunity.
 *
 * This is the core mapping function that transforms offer-specific data
 * into the unified Opportunity format for radar consumption.
 *
 * @param offer The offer to map
 * @returns Mapped Opportunity object
 */
export function offerToOpportunity(offer: Offer): Opportunity {
  // Estimate reward value
  const expectedRewardEstimate = estimateOfferSavings(offer);

  // Estimate time cost
  const timeCostMinutesEstimate = estimateOfferTimeCostMinutes(offer);

  // Determine risk level
  const riskLevel = determineRiskLevel(offer);

  // Determine freshness tier
  const freshnessTier = determineFreshnessTier(offer);

  // Build short summary
  const shortSummary = `${offer.merchant} - ${offer.offerType}${
    offer.code ? ` (${offer.code})` : ""
  }`;

  // Build detailed description
  const description = offer.description
    ? `${offer.description} (via ${offer.sourceType})`
    : `${offer.merchant} ${offer.offerType} offer`;

  // Map to Opportunity
  const opportunity: Opportunity = {
    id: offer.id ? `opp-${offer.id}` : undefined,
    title: offer.title,
    description,
    shortSummary,
    type: "other", // Offers map to "other" type for now
    domain: "promo", // Promotional domain
    expectedRewardEstimate,
    timeCostMinutesEstimate,
    riskLevel,
    freshnessTier,
    sourceUrl: offer.sourceUrl,
    expiresAt: offer.expiresAt,
    metadata: {
      // First spread any existing offer metadata
      ...(offer.metadata || {}),
      // Then preserve the entire original offer structure
      ...offer,
      // Add mapper-specific metadata (these will override if there are conflicts)
      mappedFromOffer: true,
      mappedAt: new Date().toISOString(),
      offerType: offer.offerType,
      sourceType: offer.sourceType,
      merchant: offer.merchant,
    },
  };

  return opportunity;
}

/**
 * Maps an array of Offers to an array of Opportunities.
 *
 * Convenience wrapper around offerToOpportunity for batch processing.
 *
 * @param offers Array of offers to map
 * @returns Array of mapped opportunities
 */
export function offersToOpportunities(offers: Offer[]): Opportunity[] {
  return offers.map(offerToOpportunity);
}
