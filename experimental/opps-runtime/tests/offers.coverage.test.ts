import { describe, it } from "node:test";
import assert from "node:assert";
import {
  computeMerchantCoverageScore,
  computeCoverageFromOffers,
  DEFAULT_COVERAGE_WEIGHTS,
} from "../src/offers/coverage.ts";
import type { OfferSourceType } from "../src/offers/types.ts";

describe("Coverage Model", () => {
  describe("computeMerchantCoverageScore", () => {
    it("should compute score for official_manufacturer source", () => {
      const result = computeMerchantCoverageScore("TestMerchant", [
        "official_manufacturer",
      ]);

      assert.strictEqual(result.merchant, "TestMerchant");
      assert.strictEqual(
        result.coverageScore,
        DEFAULT_COVERAGE_WEIGHTS.officialManufacturer
      );
      assert.strictEqual(result.coverageScore, 40);
      assert.deepStrictEqual(result.sources, ["official_manufacturer"]);
    });

    it("should compute higher score for multiple source types", () => {
      const singleSourceResult = computeMerchantCoverageScore("TestMerchant", [
        "official_manufacturer",
      ]);

      const multiSourceResult = computeMerchantCoverageScore("TestMerchant", [
        "official_manufacturer",
        "aggregator",
      ]);

      assert.strictEqual(multiSourceResult.merchant, "TestMerchant");
      assert.strictEqual(
        multiSourceResult.coverageScore,
        DEFAULT_COVERAGE_WEIGHTS.officialManufacturer +
          DEFAULT_COVERAGE_WEIGHTS.aggregator
      );
      assert.strictEqual(multiSourceResult.coverageScore, 60);
      assert.ok(
        multiSourceResult.coverageScore > singleSourceResult.coverageScore
      );
      assert.strictEqual(multiSourceResult.sources.length, 2);
    });

    it("should deduplicate source types", () => {
      const result = computeMerchantCoverageScore("TestMerchant", [
        "official_manufacturer",
        "official_manufacturer",
        "retailer",
        "retailer",
      ]);

      assert.strictEqual(result.merchant, "TestMerchant");
      assert.strictEqual(
        result.coverageScore,
        DEFAULT_COVERAGE_WEIGHTS.officialManufacturer +
          DEFAULT_COVERAGE_WEIGHTS.retailer
      );
      assert.strictEqual(result.coverageScore, 70);
      assert.strictEqual(result.sources.length, 2);
      assert.ok(result.sources.includes("official_manufacturer"));
      assert.ok(result.sources.includes("retailer"));
    });

    it("should clamp score to 100 maximum", () => {
      const allSources: OfferSourceType[] = [
        "official_manufacturer",
        "retailer",
        "aggregator",
        "newsletter",
        "user_submitted",
        "other",
      ];

      const result = computeMerchantCoverageScore("TestMerchant", allSources);

      assert.strictEqual(result.merchant, "TestMerchant");
      assert.ok(result.coverageScore <= 100);
      assert.strictEqual(result.coverageScore, 100);
      assert.strictEqual(result.sources.length, 6);
    });

    it("should handle empty source types", () => {
      const result = computeMerchantCoverageScore("TestMerchant", []);

      assert.strictEqual(result.merchant, "TestMerchant");
      assert.strictEqual(result.coverageScore, 0);
      assert.deepStrictEqual(result.sources, []);
    });

    it("should respect custom weights", () => {
      const customWeights = {
        officialManufacturer: 50,
        retailer: 40,
        aggregator: 30,
        newsletter: 20,
        userSubmitted: 15,
        other: 10,
      };

      const result = computeMerchantCoverageScore(
        "TestMerchant",
        ["official_manufacturer"],
        customWeights
      );

      assert.strictEqual(result.coverageScore, 50);
    });
  });

  describe("computeCoverageFromOffers", () => {
    it("should compute coverage for multiple merchants", () => {
      const offers = [
        { merchant: "MerchantA", sourceType: "official_manufacturer" as const },
        { merchant: "MerchantA", sourceType: "retailer" as const },
        { merchant: "MerchantB", sourceType: "aggregator" as const },
        { merchant: "MerchantB", sourceType: "newsletter" as const },
      ];

      const results = computeCoverageFromOffers(offers);

      assert.strictEqual(results.length, 2);

      const merchantA = results.find((r) => r.merchant === "MerchantA");
      const merchantB = results.find((r) => r.merchant === "MerchantB");

      assert.ok(merchantA);
      assert.ok(merchantB);

      // MerchantA: official_manufacturer (40) + retailer (30) = 70
      assert.strictEqual(merchantA.coverageScore, 70);
      assert.strictEqual(merchantA.sources.length, 2);

      // MerchantB: aggregator (20) + newsletter (10) = 30
      assert.strictEqual(merchantB.coverageScore, 30);
      assert.strictEqual(merchantB.sources.length, 2);
    });

    it("should ignore offers without merchant", () => {
      const offers = [
        { merchant: "MerchantA", sourceType: "official_manufacturer" as const },
        { sourceType: "retailer" as const },
        { merchant: undefined, sourceType: "aggregator" as const },
      ];

      const results = computeCoverageFromOffers(offers);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].merchant, "MerchantA");
      assert.strictEqual(results[0].coverageScore, 40);
    });

    it("should deduplicate source types per merchant", () => {
      const offers = [
        { merchant: "MerchantA", sourceType: "official_manufacturer" as const },
        { merchant: "MerchantA", sourceType: "official_manufacturer" as const },
        { merchant: "MerchantA", sourceType: "retailer" as const },
        { merchant: "MerchantA", sourceType: "retailer" as const },
      ];

      const results = computeCoverageFromOffers(offers);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].merchant, "MerchantA");
      // Should only count each source once: 40 + 30 = 70
      assert.strictEqual(results[0].coverageScore, 70);
      assert.strictEqual(results[0].sources.length, 2);
    });

    it("should handle empty offers array", () => {
      const results = computeCoverageFromOffers([]);

      assert.strictEqual(results.length, 0);
    });

    it("should respect custom weights", () => {
      const customWeights = {
        officialManufacturer: 100,
        retailer: 0,
        aggregator: 0,
        newsletter: 0,
        userSubmitted: 0,
        other: 0,
      };

      const offers = [
        { merchant: "MerchantA", sourceType: "official_manufacturer" as const },
      ];

      const results = computeCoverageFromOffers(offers, customWeights);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].coverageScore, 100);
    });

    it("should handle mixed merchant coverage scenarios", () => {
      const offers = [
        { merchant: "HighCoverage", sourceType: "official_manufacturer" as const },
        { merchant: "HighCoverage", sourceType: "retailer" as const },
        { merchant: "HighCoverage", sourceType: "aggregator" as const },
        { merchant: "LowCoverage", sourceType: "user_submitted" as const },
        { merchant: "LowCoverage", sourceType: "other" as const },
      ];

      const results = computeCoverageFromOffers(offers);

      assert.strictEqual(results.length, 2);

      const highCoverage = results.find((r) => r.merchant === "HighCoverage");
      const lowCoverage = results.find((r) => r.merchant === "LowCoverage");

      assert.ok(highCoverage);
      assert.ok(lowCoverage);

      // HighCoverage: 40 + 30 + 20 = 90
      assert.strictEqual(highCoverage.coverageScore, 90);

      // LowCoverage: 10 + 5 = 15
      assert.strictEqual(lowCoverage.coverageScore, 15);

      assert.ok(highCoverage.coverageScore > lowCoverage.coverageScore);
    });
  });
});
