/**
 * Source page nudges collector (mock implementation)
 * Collects offers discovered from browsing behavior/page content
 */

import { Offer } from "../types";

/**
 * Mock collector for source page nudges (offers detected from web browsing)
 * @returns Promise resolving to array of nudge-based offers
 */
export async function collectSourcePageNudgesMock(): Promise<Offer[]> {
  // Mock data representing offers detected from user's browsing
  return [
    {
      id: "nudge-001",
      title: "First Order Discount at HelloFresh",
      description: "Get 50% off your first box plus free shipping",
      merchant: "HelloFresh",
      offerType: "coupon_code",
      sourceType: "newsletter",
      percentOff: 50,
      code: "FRESH50",
      sourceUrl: "https://hellofresh.com/welcome",
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
      metadata: {
        detectedFrom: "email_newsletter",
        newCustomerOnly: true,
      },
    },
    {
      id: "nudge-002",
      title: "Free Shipping at Best Buy",
      description: "Free shipping on all orders over $35",
      merchant: "Best Buy",
      offerType: "other",
      sourceType: "official_retailer",
      minSpend: { amount: 3500, currency: "USD" },
      sourceUrl: "https://bestbuy.com/shipping",
      metadata: {
        detectedFrom: "product_page",
        alwaysActive: true,
      },
    },
  ];
}
