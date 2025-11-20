/**
 * Offer types and schema for the opportunity radar system.
 *
 * Represents various promotional offers including rebates, free trials,
 * BOGOs, discount codes, cashback, and other promotions.
 */

/**
 * Type of promotional offer
 */
export type OfferType =
  | "rebate"
  | "free_trial"
  | "bogo"
  | "discount_code"
  | "cashback"
  | "general_promo";

/**
 * Source from which the offer was obtained
 */
export type OfferSourceType =
  | "official_manufacturer"
  | "retailer"
  | "aggregator"
  | "newsletter"
  | "user_submitted"
  | "other";

/**
 * Monetary value representation for offers
 */
export interface OfferMoneyValue {
  /** Currency code (e.g. "USD", "EUR") */
  currency: string;
  /** Numeric amount */
  amount: number;
}

/**
 * Core Offer model representing a promotional offer
 */
export interface Offer {
  /** Unique identifier for the offer */
  id: string;

  /** Display title of the offer */
  title: string;

  /** Optional detailed description */
  description?: string;

  /** Type of offer */
  offerType: OfferType;

  /** Source type where offer was found */
  sourceType: OfferSourceType;

  /** Merchant/retailer name (e.g. "BestBuy", "Steam", "Target") */
  merchant?: string;

  /** Free-text product category (e.g. "electronics", "ai-tools") */
  productCategory?: string;

  /** Percentage discount if applicable */
  percentOff?: number | null;

  /** Fixed discount amount if applicable */
  fixedDiscount?: OfferMoneyValue | null;

  /** Minimum spend requirement */
  minSpend?: OfferMoneyValue | null;

  /** Maximum savings cap */
  maxSavings?: OfferMoneyValue | null;

  /** Whether offer requires being a new customer */
  requiresNewCustomer?: boolean;

  /** Whether offer requires card on file */
  requiresCardOnFile?: boolean;

  /** Promo/discount code if applicable */
  code?: string | null;

  /** Landing page URL for the offer */
  url?: string | null;

  /** ISO date string when offer was last verified */
  verifiedAt?: string | null;

  /** ISO date string when offer expires */
  expiresAt?: string | null;

  /** Whether this offer can be combined with others */
  stackableWithOtherOffers?: boolean;

  /** Searchable tags for the offer */
  tags?: string[];

  /** Additional structured metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Helper type for tracking merchant coverage by offer sources
 */
export interface OfferMerchantCoverage {
  /** Merchant name */
  merchant: string;

  /** Coverage quality score (0-100) */
  coverageScore: number;

  /** Sources providing offers for this merchant */
  sources: OfferSourceType[];
}
