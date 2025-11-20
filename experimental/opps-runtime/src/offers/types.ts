/**
 * Offer types for the experimental opps-runtime system.
 * Represents promotional offers, rebates, coupons, etc.
 */

export interface OfferMoneyValue {
  /** Amount in the smallest currency unit (e.g., cents for USD) */
  amount: number;
  /** Currency code (e.g., "USD", "EUR") */
  currency: string;
}

export type OfferType =
  | "coupon_code"
  | "rebate"
  | "cashback"
  | "sale"
  | "bundle"
  | "other";

export type OfferSourceType =
  | "official_manufacturer"
  | "official_retailer"
  | "aggregator"
  | "newsletter"
  | "user_submitted";

/**
 * Core Offer interface representing a promotional offer
 */
export interface Offer {
  /** Unique identifier */
  id?: string;

  /** Display title */
  title: string;

  /** Detailed description */
  description?: string;

  /** Merchant/brand name */
  merchant: string;

  /** Type of offer */
  offerType: OfferType;

  /** Source type */
  sourceType: OfferSourceType;

  /** Fixed discount amount */
  fixedDiscount?: OfferMoneyValue;

  /** Percentage discount (0-100) */
  percentOff?: number;

  /** Minimum spend requirement */
  minSpend?: OfferMoneyValue;

  /** Coupon/promo code if applicable */
  code?: string;

  /** Source URL */
  sourceUrl?: string;

  /** Expiration date */
  expiresAt?: Date;

  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * User-provided offer input interface
 */
export interface UserProvidedOfferInput {
  title: string;
  merchant: string;
  description?: string;
  code?: string;
  percentOff?: number;
  fixedDiscount?: OfferMoneyValue;
  minSpend?: OfferMoneyValue;
  sourceUrl?: string;
  expiresAt?: Date;
}
