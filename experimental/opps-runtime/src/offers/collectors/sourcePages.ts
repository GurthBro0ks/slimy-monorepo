import { Offer } from "../types";

/**
 * Collects "nudge" style offers that point to source pages
 * These don't have specific codes - they suggest checking a page for deals
 * This is a MOCK implementation - returns synthetic data only
 * No network calls are made
 */
export async function collectSourcePageNudgesMock(): Promise<Offer[]> {
  // Simulate async operation (but no actual network call)
  await new Promise((resolve) => setTimeout(resolve, 10));

  const now = new Date();
  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const threeWeeksFromNow = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000);

  const offers: Offer[] = [
    {
      id: "nudge-001",
      title: "Check Weekly Deals for ElectroMart (page updated)",
      description:
        "ElectroMart has refreshed their weekly deals page with new electronics promotions. Check the page for current offers on TVs, laptops, and smart home devices.",
      offerType: "general_promo",
      sourceType: "other",
      merchant: "ElectroMart",
      productCategory: "Electronics",
      url: "https://example.com/electromart/weekly-deals",
      expiresAt: oneWeekFromNow,
      verifiedAt: now,
      requiresNewCustomer: false,
      requiresCardOnFile: false,
      metadata: {
        potentialSavingsHint: "10-50",
        unit: "percent",
        tags: ["nudge", "check_page", "weekly_update"],
        pageUpdateFrequency: "weekly",
      },
      createdAt: now,
    },
    {
      id: "nudge-002",
      title: "Manufacturer Y Just Refreshed Promo Page",
      description:
        "TechCore has updated their promotions page with new offers on computer components. Visit their official promo page to see the latest deals on CPUs, GPUs, and motherboards.",
      offerType: "general_promo",
      sourceType: "other",
      merchant: "TechCore",
      productCategory: "Computer Hardware",
      url: "https://example.com/techcore/promotions",
      expiresAt: twoWeeksFromNow,
      verifiedAt: now,
      requiresNewCustomer: false,
      requiresCardOnFile: false,
      metadata: {
        potentialSavingsHint: "50-200",
        unit: "currency",
        tags: ["nudge", "check_page", "manufacturer"],
        pageUpdateDetected: now.toISOString(),
      },
      createdAt: now,
    },
    {
      id: "nudge-003",
      title: "FreshMart Daily Specials - New Items Added",
      description:
        "FreshMart grocery store has added new daily specials. Check their specials page for discounts on produce, dairy, and pantry items.",
      offerType: "general_promo",
      sourceType: "other",
      merchant: "FreshMart Grocery",
      productCategory: "Food & Groceries",
      url: "https://example.com/freshmart/daily-specials",
      expiresAt: oneWeekFromNow,
      verifiedAt: now,
      requiresNewCustomer: false,
      requiresCardOnFile: false,
      metadata: {
        potentialSavingsHint: "15-30",
        unit: "percent",
        tags: ["nudge", "check_page", "daily_update", "grocery"],
        pageUpdateFrequency: "daily",
      },
      createdAt: now,
    },
    {
      id: "nudge-004",
      title: "SportGear Clearance Section Updated",
      description:
        "SportGear has added new items to their clearance section with deep discounts on athletic wear, footwear, and equipment. Visit the clearance page to browse current markdowns.",
      offerType: "general_promo",
      sourceType: "other",
      merchant: "SportGear",
      productCategory: "Sports & Outdoors",
      url: "https://example.com/sportgear/clearance",
      expiresAt: threeWeeksFromNow,
      verifiedAt: now,
      requiresNewCustomer: false,
      requiresCardOnFile: false,
      metadata: {
        potentialSavingsHint: "30-70",
        unit: "percent",
        tags: ["nudge", "check_page", "clearance"],
        discountType: "clearance",
      },
      createdAt: now,
    },
    {
      id: "nudge-005",
      title: "BeautyBox Flash Sale Page - Limited Time",
      description:
        "BeautyBox is running a flash sale on select beauty and skincare products. Check their flash sale page for time-limited offers that may expire within hours.",
      offerType: "general_promo",
      sourceType: "other",
      merchant: "BeautyBox",
      productCategory: "Beauty & Personal Care",
      url: "https://example.com/beautybox/flash-sale",
      expiresAt: oneWeekFromNow,
      verifiedAt: now,
      requiresNewCustomer: false,
      requiresCardOnFile: false,
      metadata: {
        potentialSavingsHint: "20-60",
        unit: "percent",
        tags: ["nudge", "check_page", "flash_sale", "time_sensitive"],
        urgency: "high",
      },
      createdAt: now,
    },
  ];

  return offers;
}
