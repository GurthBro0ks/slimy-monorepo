/**
 * Tests for Offer → Opportunity mapper and unified collector
 */

import { describe, it, expect } from "vitest";
import {
  offerToOpportunity,
  offersToOpportunities,
  estimateOfferSavings,
  estimateOfferTimeCostMinutes,
  collectAllOfferOpportunitiesMock,
  buildOfferOpportunitiesFromUserProvided,
} from "../src";
import type { Offer, UserProvidedOfferInput } from "../src";

describe("Offer Savings Estimation", () => {
  it("should estimate savings from fixedDiscount", () => {
    const offer: Offer = {
      title: "Test Fixed Discount",
      merchant: "TestMerchant",
      offerType: "coupon_code",
      sourceType: "official_retailer",
      fixedDiscount: { amount: 2500, currency: "USD" }, // $25
    };

    const savings = estimateOfferSavings(offer);
    expect(savings).toBe(25); // $25
  });

  it("should estimate savings from percentOff and minSpend", () => {
    const offer: Offer = {
      title: "Test Percent Off",
      merchant: "TestMerchant",
      offerType: "coupon_code",
      sourceType: "aggregator",
      percentOff: 20,
      minSpend: { amount: 10000, currency: "USD" }, // $100 minimum
    };

    const savings = estimateOfferSavings(offer);
    expect(savings).toBe(20); // 20% of $100 = $20
  });

  it("should estimate savings from percentOff only using conservative baseline", () => {
    const offer: Offer = {
      title: "Test Percent Only",
      merchant: "TestMerchant",
      offerType: "sale",
      sourceType: "aggregator",
      percentOff: 30,
    };

    const savings = estimateOfferSavings(offer);
    expect(savings).toBe(15); // 30% of $50 baseline = $15
  });

  it("should use fallback default when no discount info available", () => {
    const offer: Offer = {
      title: "Test No Discount Info",
      merchant: "TestMerchant",
      offerType: "other",
      sourceType: "newsletter",
    };

    const savings = estimateOfferSavings(offer);
    expect(savings).toBe(5); // Default fallback
  });
});

describe("Offer Time Cost Estimation", () => {
  it("should estimate higher time for mail-in rebates", () => {
    const offer: Offer = {
      title: "Mail-in Rebate",
      merchant: "TestMerchant",
      offerType: "rebate",
      sourceType: "official_manufacturer",
      metadata: {
        requiresPaperwork: true,
      },
    };

    const timeCost = estimateOfferTimeCostMinutes(offer);
    expect(timeCost).toBe(30); // Paperwork overhead
  });

  it("should estimate lower time for instant rebates", () => {
    const offer: Offer = {
      title: "Instant Rebate",
      merchant: "TestMerchant",
      offerType: "rebate",
      sourceType: "official_retailer",
      metadata: {
        instantDiscount: true,
      },
    };

    const timeCost = estimateOfferTimeCostMinutes(offer);
    expect(timeCost).toBe(10); // Quick instant discount
  });

  it("should estimate appropriate time for aggregator offers", () => {
    const offer: Offer = {
      title: "Aggregator Code",
      merchant: "TestMerchant",
      offerType: "coupon_code",
      sourceType: "aggregator",
      metadata: {
        verificationStatus: "verified",
      },
    };

    const timeCost = estimateOfferTimeCostMinutes(offer);
    expect(timeCost).toBe(6); // Verified code, quick to use
  });

  it("should estimate time for official retailer coupon codes", () => {
    const offer: Offer = {
      title: "Official Code",
      merchant: "TestMerchant",
      offerType: "coupon_code",
      sourceType: "official_retailer",
    };

    const timeCost = estimateOfferTimeCostMinutes(offer);
    expect(timeCost).toBe(7); // Standard code application
  });
});

describe("Offer to Opportunity Mapping", () => {
  it("should map fixedDiscount offer to opportunity with correct expectedRewardEstimate", () => {
    const offer: Offer = {
      id: "test-001",
      title: "Test Fixed Discount Offer",
      description: "Get $50 off",
      merchant: "TestStore",
      offerType: "coupon_code",
      sourceType: "official_retailer",
      fixedDiscount: { amount: 5000, currency: "USD" }, // $50
      code: "SAVE50",
    };

    const opportunity = offerToOpportunity(offer);

    expect(opportunity.title).toBe(offer.title);
    expect(opportunity.expectedRewardEstimate).toBe(50); // $50
    expect(opportunity.type).toBe("other");
    expect(opportunity.domain).toBe("promo");
    expect(opportunity.riskLevel).toBe("low"); // Official retailer
    expect(opportunity.metadata?.mappedFromOffer).toBe(true);
    expect(opportunity.metadata?.offerType).toBe("coupon_code");
    expect(opportunity.metadata?.merchant).toBe("TestStore");
  });

  it("should map percentOff + minSpend offer to opportunity with calculated reward", () => {
    const offer: Offer = {
      id: "test-002",
      title: "20% Off $100+",
      merchant: "TestMerchant",
      offerType: "sale",
      sourceType: "aggregator",
      percentOff: 20,
      minSpend: { amount: 10000, currency: "USD" }, // $100
    };

    const opportunity = offerToOpportunity(offer);

    expect(opportunity.expectedRewardEstimate).toBe(20); // 20% of $100
    expect(opportunity.riskLevel).toBe("medium"); // Aggregator source
    expect(opportunity.metadata?.mappedFromOffer).toBe(true);
  });

  it("should assign fast_batch freshness for offers expiring soon", () => {
    const soonExpiry = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days

    const offer: Offer = {
      title: "Expiring Soon Offer",
      merchant: "TestMerchant",
      offerType: "sale",
      sourceType: "official_retailer",
      percentOff: 15,
      expiresAt: soonExpiry,
    };

    const opportunity = offerToOpportunity(offer);

    expect(opportunity.freshnessTier).toBe("fast_batch");
  });

  it("should assign slow_batch freshness for offers expiring later", () => {
    const laterExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const offer: Offer = {
      title: "Long-term Offer",
      merchant: "TestMerchant",
      offerType: "rebate",
      sourceType: "official_manufacturer",
      fixedDiscount: { amount: 10000, currency: "USD" },
      expiresAt: laterExpiry,
    };

    const opportunity = offerToOpportunity(offer);

    expect(opportunity.freshnessTier).toBe("slow_batch");
  });

  it("should preserve all offer data in metadata", () => {
    const offer: Offer = {
      id: "test-003",
      title: "Complex Offer",
      description: "Detailed offer description",
      merchant: "TestStore",
      offerType: "rebate",
      sourceType: "official_manufacturer",
      fixedDiscount: { amount: 7500, currency: "USD" },
      code: "REBATE75",
      sourceUrl: "https://example.com/offer",
      metadata: {
        customField: "customValue",
        priority: "high",
      },
    };

    const opportunity = offerToOpportunity(offer);

    // Check that original offer data is preserved
    expect(opportunity.metadata?.id).toBe(offer.id);
    expect(opportunity.metadata?.code).toBe("REBATE75");
    expect(opportunity.metadata?.customField).toBe("customValue");
    expect(opportunity.metadata?.priority).toBe("high");
    expect(opportunity.metadata?.mappedFromOffer).toBe(true);
  });
});

describe("Unified Collector", () => {
  it("should collect all offer opportunities from mock collectors", async () => {
    const opportunities = await collectAllOfferOpportunitiesMock();

    // Should return non-empty array
    expect(opportunities.length).toBeGreaterThan(0);

    // All opportunities should have promo domain
    opportunities.forEach((opp) => {
      expect(opp.domain).toBe("promo");
      expect(opp.metadata?.mappedFromOffer).toBe(true);
    });

    // Should include opportunities from multiple sources
    const sourceTypes = opportunities.map(
      (opp) => opp.metadata?.sourceType
    );
    expect(sourceTypes).toContain("official_manufacturer");
    expect(sourceTypes).toContain("aggregator");
  });

  it("should have expectedRewardEstimate for all collected opportunities", async () => {
    const opportunities = await collectAllOfferOpportunitiesMock();

    opportunities.forEach((opp) => {
      expect(opp.expectedRewardEstimate).toBeDefined();
      expect(opp.expectedRewardEstimate).toBeGreaterThan(0);
    });
  });

  it("should have timeCostMinutesEstimate for all collected opportunities", async () => {
    const opportunities = await collectAllOfferOpportunitiesMock();

    opportunities.forEach((opp) => {
      expect(opp.timeCostMinutesEstimate).toBeDefined();
      expect(opp.timeCostMinutesEstimate).toBeGreaterThan(0);
    });
  });

  it("should build opportunities from user-provided inputs", () => {
    const userId = "user-123";
    const userInputs: UserProvidedOfferInput[] = [
      {
        title: "My Personal Discount",
        merchant: "MyStore",
        code: "PERSONAL20",
        percentOff: 20,
      },
      {
        title: "Email Coupon",
        merchant: "AnotherStore",
        fixedDiscount: { amount: 1500, currency: "USD" },
      },
    ];

    const opportunities = buildOfferOpportunitiesFromUserProvided(
      userId,
      userInputs
    );

    expect(opportunities.length).toBe(2);

    opportunities.forEach((opp) => {
      expect(opp.domain).toBe("promo");
      expect(opp.metadata?.mappedFromOffer).toBe(true);
      expect(opp.metadata?.userId).toBe(userId);
      expect(opp.metadata?.userProvided).toBe(true);
      expect(opp.metadata?.sourceType).toBe("user_submitted");
    });

    // First opportunity should have code
    expect(opportunities[0].metadata?.code).toBe("PERSONAL20");
    expect(opportunities[0].metadata?.offerType).toBe("coupon_code");

    // Second opportunity should have fixed discount
    expect(opportunities[1].expectedRewardEstimate).toBe(15); // $15
  });
});

describe("Batch Mapping", () => {
  it("should map multiple offers to opportunities", () => {
    const offers: Offer[] = [
      {
        title: "Offer 1",
        merchant: "Store 1",
        offerType: "sale",
        sourceType: "official_retailer",
        percentOff: 10,
      },
      {
        title: "Offer 2",
        merchant: "Store 2",
        offerType: "coupon_code",
        sourceType: "aggregator",
        fixedDiscount: { amount: 2000, currency: "USD" },
      },
    ];

    const opportunities = offersToOpportunities(offers);

    expect(opportunities.length).toBe(2);
    expect(opportunities[0].title).toBe("Offer 1");
    expect(opportunities[1].title).toBe("Offer 2");
    expect(opportunities[1].expectedRewardEstimate).toBe(20);
  });
});
