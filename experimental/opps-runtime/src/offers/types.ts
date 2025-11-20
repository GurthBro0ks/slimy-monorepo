/**
 * Offer source types representing different channels for offers
 */
export type OfferSourceType =
  | "official_manufacturer"
  | "retailer"
  | "aggregator"
  | "newsletter"
  | "user_submitted"
  | "other";

/**
 * Merchant coverage information
 */
export type OfferMerchantCoverage = {
  merchant: string;
  coverageScore: number;
  sources: OfferSourceType[];
};
