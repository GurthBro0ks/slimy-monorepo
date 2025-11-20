/**
 * Offer ingestion types for the opps runtime
 * Defines the structure for offers from various sources
 */

/**
 * Represents a monetary value with currency
 */
export interface OfferMoneyValue {
  amount: number;
  currency: string; // ISO currency code, e.g., "USD"
}

/**
 * Types of offers supported
 */
export type OfferType =
  | "rebate"
  | "cashback"
  | "bogo" // Buy One Get One
  | "discount_code"
  | "general_promo";

/**
 * Source types for offers
 */
export type OfferSourceType =
  | "official_manufacturer"
  | "retailer"
  | "aggregator"
  | "user_submitted"
  | "other";

/**
 * Main Offer interface
 * Represents a promotional offer from any source
 */
export interface Offer {
  /** Unique identifier for the offer */
  id: string;

  /** Human-readable title */
  title: string;

  /** Detailed description of the offer */
  description?: string;

  /** Type of offer */
  offerType: OfferType;

  /** Source type of the offer */
  sourceType: OfferSourceType;

  /** Merchant or retailer name */
  merchant?: string;

  /** Product category this offer applies to */
  productCategory?: string;

  /** Promo or discount code (if applicable) */
  code?: string;

  /** Fixed discount amount */
  fixedDiscount?: OfferMoneyValue;

  /** Percentage off (0-100) */
  percentOff?: number;

  /** URL to the offer page or source */
  url?: string;

  /** When the offer expires */
  expiresAt?: Date;

  /** When the offer was last verified */
  verifiedAt?: Date;

  /** Whether the offer requires being a new customer */
  requiresNewCustomer?: boolean;

  /** Whether the offer requires a card on file */
  requiresCardOnFile?: boolean;

  /** Additional metadata (tags, notes, etc.) */
  metadata?: Record<string, any>;

  /** When this offer was ingested/created */
  createdAt: Date;
}
