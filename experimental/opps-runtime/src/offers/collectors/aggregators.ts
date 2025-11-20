/**
 * Aggregator offers collector (mock implementation)
 * Collects offers from coupon/deal aggregator sites
 */

import { Offer } from "../types";

/**
 * Mock collector for aggregator-sourced offers
 * @returns Promise resolving to array of aggregator offers
 */
export async function collectAggregatorOffersMock(): Promise<Offer[]> {
  // Mock data representing aggregator-sourced offers
  return [
    {
      id: "agg-001",
      title: "20% Off Nike Shoes",
      description: "Use code SAVE20 for 20% off Nike footwear",
      merchant: "Nike",
      offerType: "coupon_code",
      sourceType: "aggregator",
      percentOff: 20,
      code: "SAVE20",
      sourceUrl: "https://retailmenot.com/nike",
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      metadata: {
        aggregatorSite: "RetailMeNot",
        verificationStatus: "verified",
      },
    },
    {
      id: "agg-002",
      title: "$15 Off $75+ at Target",
      description: "Save $15 on orders over $75 with code",
      merchant: "Target",
      offerType: "coupon_code",
      sourceType: "aggregator",
      fixedDiscount: { amount: 1500, currency: "USD" },
      minSpend: { amount: 7500, currency: "USD" },
      code: "TARGET15",
      sourceUrl: "https://coupons.com/target",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      metadata: {
        aggregatorSite: "Coupons.com",
        verificationStatus: "unverified",
      },
    },
    {
      id: "agg-003",
      title: "25% Off Sitewide at Gap",
      description: "Enjoy 25% off everything at Gap.com",
      merchant: "Gap",
      offerType: "sale",
      sourceType: "aggregator",
      percentOff: 25,
      code: "SAVE25",
      sourceUrl: "https://slickdeals.net/gap",
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
      metadata: {
        aggregatorSite: "Slickdeals",
        upvotes: 127,
      },
    },
  ];
}
