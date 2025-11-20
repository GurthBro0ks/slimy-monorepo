import { Offer, OfferSourceType } from "./types";

/**
 * Common suspicious keywords that may indicate scam offers
 */
const SUSPICIOUS_KEYWORDS = [
  "free money",
  "guaranteed profit",
  "no risk",
  "get rich quick",
  "binary options",
];

/**
 * Minimum length for a trusted merchant name (to avoid empty/garbage names)
 */
const MIN_TRUSTED_MERCHANT_LENGTH = 2;

/**
 * Checks if an offer exhibits scam-like characteristics
 *
 * @param offer - The offer to check
 * @returns true if the offer appears to be a scam, false otherwise
 */
export function isOfferLikelyScam(offer: Offer): boolean {
  // Check 1: Missing merchant from aggregator or other sources is suspicious
  const hasMissingMerchant = !offer.merchant || offer.merchant.trim().length === 0;
  if (hasMissingMerchant && (offer.sourceType === "aggregator" || offer.sourceType === "other")) {
    return true;
  }

  // Check 2: Check for suspicious keywords in title or description
  const textToCheck = [
    offer.title,
    offer.description || "",
  ].join(" ").toLowerCase();

  const hasSuspiciousKeywords = SUSPICIOUS_KEYWORDS.some(keyword =>
    textToCheck.includes(keyword.toLowerCase())
  );

  if (hasSuspiciousKeywords) {
    return true;
  }

  // Check 3: If code is present but merchant is extremely vague (e.g., one-char), suspicious
  if (offer.code && offer.merchant && offer.merchant.trim().length < MIN_TRUSTED_MERCHANT_LENGTH) {
    return true;
  }

  return false;
}

/**
 * Determines if an offer is safe to present to users
 * Uses conservative rules to filter out potentially unsafe or low-quality offers
 *
 * @param offer - The offer to evaluate
 * @returns true if the offer is considered safe, false otherwise
 */
export function isSafeOffer(offer: Offer): boolean {
  // First check: if it's likely a scam, it's definitely not safe
  if (isOfferLikelyScam(offer)) {
    return false;
  }

  // Conservative rules based on source type:

  // Official manufacturer and retailer sources are generally trusted
  if (offer.sourceType === "official_manufacturer" || offer.sourceType === "retailer") {
    return true;
  }

  // Aggregator and newsletter sources require additional validation
  if (offer.sourceType === "aggregator" || offer.sourceType === "newsletter") {
    const hasTrustedMerchant = !!(offer.merchant &&
                                  offer.merchant.trim().length >= MIN_TRUSTED_MERCHANT_LENGTH);

    // Already checked for suspicious keywords in isOfferLikelyScam, so if we're here,
    // just need to verify merchant quality
    return hasTrustedMerchant;
  }

  // User submitted and other sources: default to false unless merchant is present
  // and no suspicious keywords (which we already checked)
  const hasMerchant = !!(offer.merchant && offer.merchant.trim().length > 0);
  return hasMerchant;
}
