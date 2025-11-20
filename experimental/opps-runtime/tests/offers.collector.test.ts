import {
  collectAllOfferOpportunitiesMock,
  buildOfferOpportunitiesFromUserProvided,
} from "../src/offers/unifiedCollector";

describe("Unified Offer Collector", () => {
  describe("collectAllOfferOpportunitiesMock", () => {
    test("should return only safe opportunities", () => {
      const opportunities = collectAllOfferOpportunitiesMock();

      // Should filter out the scam offer from mock data
      expect(opportunities.length).toBeGreaterThan(0);
      expect(opportunities.every(opp => opp.type === "offer")).toBe(true);

      // Should not include the "Get rich quick" scam offer
      const hasSuspiciousOffer = opportunities.some(opp =>
        opp.title.toLowerCase().includes("get rich quick")
      );
      expect(hasSuspiciousOffer).toBe(false);
    });

    test("should convert offers to opportunities with correct structure", () => {
      const opportunities = collectAllOfferOpportunitiesMock();

      opportunities.forEach(opp => {
        expect(opp).toHaveProperty("id");
        expect(opp).toHaveProperty("type", "offer");
        expect(opp).toHaveProperty("title");
        expect(opp).toHaveProperty("source");
        expect(opp).toHaveProperty("metadata");
        expect(opp).toHaveProperty("createdAt");
        expect(opp.createdAt).toBeInstanceOf(Date);
      });
    });
  });

  describe("buildOfferOpportunitiesFromUserProvided", () => {
    test("should filter out unsafe user-submitted offers", () => {
      const userOffers = [
        {
          title: "Legitimate store discount",
          merchant: "MyStore",
          code: "SAVE10",
        },
        {
          title: "guaranteed profit scheme",
          merchant: "ScamCo",
        },
        {
          title: "Nice deal",
          // No merchant - should be filtered
        },
      ];

      const opportunities = buildOfferOpportunitiesFromUserProvided(userOffers);

      // Should only include the first legitimate offer
      expect(opportunities.length).toBe(1);
      expect(opportunities[0].title).toBe("Legitimate store discount");
    });

    test("should normalize user offer data correctly", () => {
      const userOffers = [
        {
          title: "Test Offer",
          description: "Test description",
          merchant: "TestMerchant",
          code: "TEST123",
          url: "https://example.com",
          discount: "20%",
        },
      ];

      const opportunities = buildOfferOpportunitiesFromUserProvided(userOffers);

      expect(opportunities.length).toBe(1);
      const opp = opportunities[0];

      expect(opp.title).toBe("Test Offer");
      expect(opp.description).toBe("Test description");
      expect(opp.metadata.merchant).toBe("TestMerchant");
      expect(opp.metadata.code).toBe("TEST123");
      expect(opp.metadata.url).toBe("https://example.com");
      expect(opp.metadata.discount).toBe("20%");
      expect(opp.metadata.sourceType).toBe("user_submitted");
    });

    test("should generate IDs for offers without them", () => {
      const userOffers = [
        {
          title: "No ID Offer",
          merchant: "Store",
        },
      ];

      const opportunities = buildOfferOpportunitiesFromUserProvided(userOffers);

      expect(opportunities.length).toBe(1);
      expect(opportunities[0].id).toBeDefined();
      expect(opportunities[0].id).toMatch(/^user-/);
    });

    test("should handle empty input array", () => {
      const opportunities = buildOfferOpportunitiesFromUserProvided([]);

      expect(opportunities).toEqual([]);
    });

    test("should filter all unsafe offers", () => {
      const userOffers = [
        {
          title: "free money guaranteed profit",
        },
        {
          title: "binary options no risk",
        },
        {
          title: "get rich quick",
        },
      ];

      const opportunities = buildOfferOpportunitiesFromUserProvided(userOffers);

      // All should be filtered out
      expect(opportunities.length).toBe(0);
    });
  });
});
