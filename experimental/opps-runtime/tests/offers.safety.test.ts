import { Offer } from "../src/offers/types";
import { isSafeOffer, isOfferLikelyScam } from "../src/offers/safety";

describe("Offer Safety Filter", () => {
  describe("isSafeOffer", () => {
    test("should mark official manufacturer offer as safe", () => {
      const offer: Offer = {
        id: "test-1",
        title: "20% off all products",
        description: "Limited time offer",
        merchant: "Apple Inc",
        sourceType: "official_manufacturer",
      };

      expect(isSafeOffer(offer)).toBe(true);
    });

    test("should mark retailer offer with normal title as safe", () => {
      const offer: Offer = {
        id: "test-2",
        title: "Summer sale - 30% off",
        merchant: "BestBuy",
        sourceType: "retailer",
      };

      expect(isSafeOffer(offer)).toBe(true);
    });

    test("should reject offer with suspicious keywords", () => {
      const offer: Offer = {
        id: "test-3",
        title: "guaranteed profit free money scheme",
        description: "Get rich quick with no risk",
        merchant: "ShadyDeals",
        sourceType: "aggregator",
      };

      expect(isOfferLikelyScam(offer)).toBe(true);
      expect(isSafeOffer(offer)).toBe(false);
    });

    test("should reject aggregator offer with missing merchant", () => {
      const offer: Offer = {
        id: "test-4",
        title: "Amazing discount",
        sourceType: "aggregator",
        // No merchant
      };

      expect(isOfferLikelyScam(offer)).toBe(true);
      expect(isSafeOffer(offer)).toBe(false);
    });

    test("should accept aggregator offer with valid merchant and clean title", () => {
      const offer: Offer = {
        id: "test-5",
        title: "50% off electronics",
        merchant: "TechDeals",
        sourceType: "aggregator",
      };

      expect(isOfferLikelyScam(offer)).toBe(false);
      expect(isSafeOffer(offer)).toBe(true);
    });

    test("should reject offer with code but extremely vague merchant", () => {
      const offer: Offer = {
        id: "test-6",
        title: "Use this code for discount",
        code: "SAVE20",
        merchant: "A", // Only one character
        sourceType: "aggregator",
      };

      expect(isOfferLikelyScam(offer)).toBe(true);
      expect(isSafeOffer(offer)).toBe(false);
    });

    test("should handle newsletter offers with proper merchant", () => {
      const offer: Offer = {
        id: "test-7",
        title: "Weekly deals newsletter",
        merchant: "CouponNewsletter",
        sourceType: "newsletter",
      };

      expect(isSafeOffer(offer)).toBe(true);
    });

    test("should reject newsletter offers without merchant", () => {
      const offer: Offer = {
        id: "test-8",
        title: "Amazing deals inside",
        sourceType: "newsletter",
        // No merchant
      };

      expect(isSafeOffer(offer)).toBe(false);
    });

    test("should handle user-submitted offer with clear merchant and normal wording", () => {
      const offer: Offer = {
        id: "test-9",
        title: "Local store discount",
        description: "Found this deal at my local store",
        merchant: "Local Electronics",
        sourceType: "user_submitted",
      };

      // User-submitted with merchant and no suspicious keywords should be safe
      expect(isOfferLikelyScam(offer)).toBe(false);
      expect(isSafeOffer(offer)).toBe(true);
    });

    test("should reject user-submitted offer without merchant", () => {
      const offer: Offer = {
        id: "test-10",
        title: "Great discount",
        sourceType: "user_submitted",
        // No merchant
      };

      // User-submitted without merchant should be rejected
      expect(isSafeOffer(offer)).toBe(false);
    });

    test("should detect binary options scam keyword", () => {
      const offer: Offer = {
        id: "test-11",
        title: "Trade binary options now",
        merchant: "TradingPlatform",
        sourceType: "other",
      };

      expect(isOfferLikelyScam(offer)).toBe(true);
      expect(isSafeOffer(offer)).toBe(false);
    });

    test("should handle offers with suspicious keywords in description", () => {
      const offer: Offer = {
        id: "test-12",
        title: "Investment opportunity",
        description: "This is a guaranteed profit system with absolutely no risk",
        merchant: "InvestCorp",
        sourceType: "other",
      };

      expect(isOfferLikelyScam(offer)).toBe(true);
      expect(isSafeOffer(offer)).toBe(false);
    });

    test("should accept retailer offer even without merchant (trusted source)", () => {
      const offer: Offer = {
        id: "test-13",
        title: "Clearance sale",
        sourceType: "retailer",
        // Retailer source is trusted even without explicit merchant
      };

      // Retailer source type is inherently trusted
      expect(isSafeOffer(offer)).toBe(true);
    });

    test("should reject 'other' source type without merchant", () => {
      const offer: Offer = {
        id: "test-14",
        title: "Random discount",
        sourceType: "other",
        // No merchant
      };

      expect(isOfferLikelyScam(offer)).toBe(true);
      expect(isSafeOffer(offer)).toBe(false);
    });

    test("should accept 'other' source type with merchant and clean content", () => {
      const offer: Offer = {
        id: "test-15",
        title: "Store promotion",
        merchant: "MyStore",
        sourceType: "other",
      };

      expect(isOfferLikelyScam(offer)).toBe(false);
      expect(isSafeOffer(offer)).toBe(true);
    });

    test("should handle case-insensitive keyword matching", () => {
      const offer: Offer = {
        id: "test-16",
        title: "GUARANTEED PROFIT system",
        merchant: "Scammer",
        sourceType: "aggregator",
      };

      expect(isOfferLikelyScam(offer)).toBe(true);
      expect(isSafeOffer(offer)).toBe(false);
    });

    test("should accept offers with partial keyword matches that are not suspicious", () => {
      const offer: Offer = {
        id: "test-17",
        title: "Free delivery on orders", // "free" alone is not suspicious
        merchant: "OnlineStore",
        sourceType: "retailer",
      };

      // "free" alone shouldn't trigger "free money" keyword
      expect(isOfferLikelyScam(offer)).toBe(false);
      expect(isSafeOffer(offer)).toBe(true);
    });
  });

  describe("isOfferLikelyScam", () => {
    test("should detect missing merchant from aggregator", () => {
      const offer: Offer = {
        id: "test-18",
        title: "Deal",
        sourceType: "aggregator",
      };

      expect(isOfferLikelyScam(offer)).toBe(true);
    });

    test("should not flag official manufacturer with missing merchant", () => {
      const offer: Offer = {
        id: "test-19",
        title: "Official sale",
        sourceType: "official_manufacturer",
      };

      // Only aggregator/other are flagged for missing merchant
      expect(isOfferLikelyScam(offer)).toBe(false);
    });

    test("should detect merchant with only whitespace", () => {
      const offer: Offer = {
        id: "test-20",
        title: "Sale",
        merchant: "   ",
        sourceType: "aggregator",
      };

      expect(isOfferLikelyScam(offer)).toBe(true);
    });
  });
});
