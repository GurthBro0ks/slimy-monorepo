import { Offer, OfferType, OfferSourceType, OfferMoneyValue } from "../types";

/**
 * Collects official rebate offers from manufacturers and utilities
 * This is a MOCK implementation - returns synthetic data only
 * No network calls are made
 */
export async function collectOfficialRebateOffersMock(): Promise<Offer[]> {
  // Simulate async operation (but no actual network call)
  await new Promise((resolve) => setTimeout(resolve, 10));

  const now = new Date();
  const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const twoMonthsFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  const threeMonthsFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const offers: Offer[] = [
    {
      id: "official-rebate-001",
      title: "Energy-efficient Smart Thermostat Rebate",
      description:
        "Get a $50 rebate when you purchase and install an ENERGY STAR certified smart thermostat. Must be installed by a licensed technician.",
      offerType: "rebate",
      sourceType: "official_manufacturer",
      merchant: "EcoTech Home Solutions",
      productCategory: "Smart Home",
      fixedDiscount: {
        amount: 50,
        currency: "USD",
      },
      url: "https://example.com/thermostat-rebate",
      expiresAt: twoMonthsFromNow,
      verifiedAt: now,
      requiresNewCustomer: false,
      requiresCardOnFile: false,
      metadata: {
        requiresProfessionalInstallation: true,
        certificationRequired: "ENERGY STAR",
        tags: ["energy_efficiency", "rebate", "smart_home"],
      },
      createdAt: now,
    },
    {
      id: "official-cashback-002",
      title: "GPU Manufacturer Promo: Limited-Time Cashback",
      description:
        "Purchase select RTX 4000 series graphics cards and receive up to $100 cashback via manufacturer mail-in rebate. Valid on participating models only.",
      offerType: "cashback",
      sourceType: "official_manufacturer",
      merchant: "TechVision Graphics",
      productCategory: "Computer Hardware",
      fixedDiscount: {
        amount: 100,
        currency: "USD",
      },
      url: "https://example.com/gpu-cashback",
      expiresAt: oneMonthFromNow,
      verifiedAt: now,
      requiresNewCustomer: false,
      requiresCardOnFile: true,
      metadata: {
        rebateMethod: "mail_in",
        processingTime: "6-8 weeks",
        tags: ["cashback", "hardware", "limited_time"],
      },
      createdAt: now,
    },
    {
      id: "official-rebate-003",
      title: "ISP Official Bill Credit for New Fiber Customers",
      description:
        "Sign up for 1Gbps fiber internet and receive a $200 bill credit applied over your first 4 months of service. New customers only.",
      offerType: "rebate",
      sourceType: "retailer",
      merchant: "SpeedNet Internet Services",
      productCategory: "Internet & Telecom",
      fixedDiscount: {
        amount: 200,
        currency: "USD",
      },
      url: "https://example.com/fiber-promotion",
      expiresAt: threeMonthsFromNow,
      verifiedAt: now,
      requiresNewCustomer: true,
      requiresCardOnFile: true,
      metadata: {
        creditDistribution: "monthly",
        contractLength: "12 months",
        tags: ["bill_credit", "new_customer", "internet"],
      },
      createdAt: now,
    },
    {
      id: "official-promo-004",
      title: "Utility Company LED Bulb Discount Program",
      description:
        "Residents can purchase LED bulbs at 50% off retail price through the utility company energy efficiency program. Limit 10 bulbs per household.",
      offerType: "general_promo",
      sourceType: "official_manufacturer",
      merchant: "Metro Power & Light",
      productCategory: "Home Improvement",
      percentOff: 50,
      url: "https://example.com/led-program",
      expiresAt: threeMonthsFromNow,
      verifiedAt: now,
      requiresNewCustomer: false,
      requiresCardOnFile: false,
      metadata: {
        quantityLimit: 10,
        eligibility: "residential_customers_only",
        tags: ["energy_efficiency", "utility_program", "lighting"],
      },
      createdAt: now,
    },
    {
      id: "official-cashback-005",
      title: "Premium Laptop Trade-In Cashback",
      description:
        "Trade in your old laptop and receive up to $300 cashback when purchasing a new premium business laptop. Trade-in value assessed at time of purchase.",
      offerType: "cashback",
      sourceType: "retailer",
      merchant: "TechHub Electronics",
      productCategory: "Computers & Laptops",
      fixedDiscount: {
        amount: 300,
        currency: "USD",
      },
      url: "https://example.com/laptop-tradein",
      expiresAt: twoMonthsFromNow,
      verifiedAt: now,
      requiresNewCustomer: false,
      requiresCardOnFile: false,
      metadata: {
        tradeInRequired: true,
        valueDepends: "condition_and_model",
        tags: ["cashback", "trade_in", "laptops"],
      },
      createdAt: now,
    },
  ];

  return offers;
}
