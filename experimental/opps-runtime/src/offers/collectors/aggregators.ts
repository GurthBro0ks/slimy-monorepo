import { Offer } from "../types";

/**
 * Collects offers from deal/coupon aggregator sites
 * This is a MOCK implementation - returns synthetic data only
 * No network calls are made
 */
export async function collectAggregatorOffersMock(): Promise<Offer[]> {
  // Simulate async operation (but no actual network call)
  await new Promise((resolve) => setTimeout(resolve, 10));

  const now = new Date();
  const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const sixWeeksFromNow = new Date(now.getTime() + 42 * 24 * 60 * 60 * 1000);

  const offers: Offer[] = [
    {
      id: "agg-bogo-001",
      title: "BOGO Free on Gaming Accessories",
      description:
        "Buy one gaming mouse, keyboard, or headset and get another of equal or lesser value free. Use code at checkout.",
      offerType: "bogo",
      sourceType: "aggregator",
      merchant: "GameGear Pro",
      productCategory: "Gaming",
      code: "GAMEBOGO24",
      percentOff: 50, // Effectively 50% off when buying two
      url: "https://example.com/aggregator/gamegear-bogo",
      expiresAt: twoWeeksFromNow,
      verifiedAt: now,
      requiresNewCustomer: false,
      requiresCardOnFile: false,
      metadata: {
        tags: ["aggregated", "limited_trust", "bogo", "gaming"],
        aggregatorSource: "DealHunter Pro",
        verificationCount: 15,
      },
      createdAt: now,
    },
    {
      id: "agg-discount-002",
      title: "20% Off Entire Order at TrendyWear",
      description:
        "Get 20% off sitewide at TrendyWear. Exclusions may apply. Code appears to work on most items.",
      offerType: "discount_code",
      sourceType: "aggregator",
      merchant: "TrendyWear Fashion",
      productCategory: "Clothing & Apparel",
      code: "SAVE20NOW",
      percentOff: 20,
      url: "https://example.com/aggregator/trendywear-discount",
      expiresAt: oneMonthFromNow,
      verifiedAt: now,
      requiresNewCustomer: false,
      requiresCardOnFile: false,
      metadata: {
        tags: ["aggregated", "limited_trust", "discount_code", "fashion"],
        aggregatorSource: "CouponKing",
        verificationCount: 42,
        exclusions: "May not work on sale items",
      },
      createdAt: now,
    },
    {
      id: "agg-promo-003",
      title: "Free Shipping on Orders Over $35",
      description:
        "Get free standard shipping on all orders over $35 at HomeEssentials. No code needed, automatically applied.",
      offerType: "general_promo",
      sourceType: "aggregator",
      merchant: "HomeEssentials",
      productCategory: "Home & Garden",
      url: "https://example.com/aggregator/homeessentials-shipping",
      expiresAt: sixWeeksFromNow,
      verifiedAt: now,
      requiresNewCustomer: false,
      requiresCardOnFile: false,
      metadata: {
        tags: ["aggregated", "limited_trust", "free_shipping"],
        aggregatorSource: "DealHunter Pro",
        verificationCount: 128,
        minPurchase: 35,
        minPurchaseCurrency: "USD",
      },
      createdAt: now,
    },
    {
      id: "agg-discount-004",
      title: "$15 Off First Order at MealKit Express",
      description:
        "New customers get $15 off their first meal kit order. Enter code at checkout.",
      offerType: "discount_code",
      sourceType: "aggregator",
      merchant: "MealKit Express",
      productCategory: "Food & Groceries",
      code: "WELCOME15",
      fixedDiscount: {
        amount: 15,
        currency: "USD",
      },
      url: "https://example.com/aggregator/mealkit-welcome",
      expiresAt: oneMonthFromNow,
      verifiedAt: now,
      requiresNewCustomer: true,
      requiresCardOnFile: true,
      metadata: {
        tags: ["aggregated", "limited_trust", "new_customer", "food"],
        aggregatorSource: "CouponKing",
        verificationCount: 8,
      },
      createdAt: now,
    },
    {
      id: "agg-bogo-005",
      title: "Buy 2 Get 1 Free on Books",
      description:
        "Purchase any 2 books and get a third book of equal or lesser value free. Applies to select titles only.",
      offerType: "bogo",
      sourceType: "aggregator",
      merchant: "BookNook Online",
      productCategory: "Books & Media",
      url: "https://example.com/aggregator/booknook-b2g1",
      expiresAt: twoWeeksFromNow,
      verifiedAt: now,
      requiresNewCustomer: false,
      requiresCardOnFile: false,
      metadata: {
        tags: ["aggregated", "limited_trust", "bogo", "books"],
        aggregatorSource: "SaverSpy",
        verificationCount: 24,
        note: "Select titles only - check site for eligible books",
      },
      createdAt: now,
    },
    {
      id: "agg-discount-006",
      title: "30% Off Premium Subscription Plans",
      description:
        "Get 30% off annual premium subscription for CloudStorage Pro. New subscribers only.",
      offerType: "discount_code",
      sourceType: "aggregator",
      merchant: "CloudStorage Pro",
      productCategory: "Software & Services",
      code: "PREMIUM30",
      percentOff: 30,
      url: "https://example.com/aggregator/cloudstorage-sub",
      expiresAt: sixWeeksFromNow,
      verifiedAt: now,
      requiresNewCustomer: true,
      requiresCardOnFile: true,
      metadata: {
        tags: ["aggregated", "limited_trust", "subscription", "software"],
        aggregatorSource: "DealHunter Pro",
        verificationCount: 33,
        planType: "annual_only",
      },
      createdAt: now,
    },
  ];

  return offers;
}
