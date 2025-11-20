/**
 * Official rebate offers collector (mock implementation)
 * Collects rebates from official manufacturer/retailer sources
 */

import { Offer } from "../types";

/**
 * Mock collector for official rebate offers
 * @returns Promise resolving to array of official rebate offers
 */
export async function collectOfficialRebateOffersMock(): Promise<Offer[]> {
  // Mock data representing official rebates
  return [
    {
      id: "off-rebate-001",
      title: "Samsung Galaxy Phone Rebate",
      description: "Get $100 back via mail-in rebate on Galaxy S24 purchase",
      merchant: "Samsung",
      offerType: "rebate",
      sourceType: "official_manufacturer",
      fixedDiscount: { amount: 10000, currency: "USD" }, // $100 in cents
      minSpend: { amount: 79999, currency: "USD" }, // $799.99
      sourceUrl: "https://samsung.com/rebates",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      metadata: {
        requiresPaperwork: true,
        processingTime: "6-8 weeks",
      },
    },
    {
      id: "off-rebate-002",
      title: "LG Appliance Instant Rebate",
      description: "Instant $200 rebate on select LG refrigerators",
      merchant: "LG Electronics",
      offerType: "rebate",
      sourceType: "official_manufacturer",
      fixedDiscount: { amount: 20000, currency: "USD" }, // $200
      minSpend: { amount: 149999, currency: "USD" },
      sourceUrl: "https://lg.com/promotions",
      expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days
      metadata: {
        requiresPaperwork: false,
        instantDiscount: true,
      },
    },
  ];
}
