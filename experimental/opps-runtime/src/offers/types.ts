/**
 * Source type for an offer - indicates where the offer originated from
 */
export type OfferSourceType =
  | "official_manufacturer"
  | "retailer"
  | "aggregator"
  | "newsletter"
  | "user_submitted"
  | "other";

/**
 * Represents a promotional offer (discount, coupon, deal, etc.)
 */
export interface Offer {
  /** Unique identifier for the offer */
  id: string;

  /** Title or headline of the offer */
  title: string;

  /** Optional detailed description */
  description?: string;

  /** Optional coupon/promo code */
  code?: string;

  /** Merchant or brand name */
  merchant?: string;

  /** Source type indicating where this offer came from */
  sourceType: OfferSourceType;

  /** Optional URL to the offer or merchant */
  url?: string;

  /** Optional expiration date */
  expiresAt?: Date;

  /** Optional discount amount or percentage */
  discount?: string;
}

/**
 * Represents an opportunity (generic actionable item)
 * Offers get converted to Opportunities after filtering
 */
export interface Opportunity {
  id: string;
  type: "offer";
  title: string;
  description?: string;
  source: string;
  metadata: Record<string, any>;
  createdAt: Date;
}
