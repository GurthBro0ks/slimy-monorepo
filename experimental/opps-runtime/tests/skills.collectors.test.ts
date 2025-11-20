/**
 * Tests for skill investment opportunities collector.
 */

import { describe, it, expect } from "vitest";
import { collectSkillInvestmentOpportunitiesNow } from "../src/collectors/skills.js";
import { groupSkillOpportunitiesForHorizon } from "../src/collectors/skillsBuckets.js";
import type { SkillInvestmentMetadata } from "@slimy/opps-core";

describe("collectSkillInvestmentOpportunitiesNow", () => {
  it("should return multiple opportunities", async () => {
    const opportunities = await collectSkillInvestmentOpportunitiesNow();

    expect(opportunities.length).toBeGreaterThan(0);
    expect(opportunities.length).toBeGreaterThanOrEqual(5);
  });

  it("should have all opportunities with category skill_investment", async () => {
    const opportunities = await collectSkillInvestmentOpportunitiesNow();

    for (const opp of opportunities) {
      expect(opp.metadata).toBeDefined();
      const metadata = opp.metadata as SkillInvestmentMetadata;
      expect(metadata.category).toBe("skill_investment");
    }
  });

  it("should have timeCostMinutesEstimate > 60 for all opportunities", async () => {
    const opportunities = await collectSkillInvestmentOpportunitiesNow();

    for (const opp of opportunities) {
      expect(opp.timeCostMinutesEstimate).toBeGreaterThan(60);
    }
  });

  it("should have valid opportunity types and domains", async () => {
    const opportunities = await collectSkillInvestmentOpportunitiesNow();

    for (const opp of opportunities) {
      expect(opp.type).toBe("other");
      expect(opp.domain).toBe("misc");
      expect(opp.freshnessTier).toBe("slow_batch");
      expect(["low", "medium", "high"]).toContain(opp.riskLevel);
    }
  });

  it("should have skill metadata with required fields", async () => {
    const opportunities = await collectSkillInvestmentOpportunitiesNow();

    for (const opp of opportunities) {
      const metadata = opp.metadata as SkillInvestmentMetadata;

      expect(metadata.category).toBe("skill_investment");
      expect(metadata.area).toBeDefined();
      expect(["quant", "automation", "ai_tooling", "frontend", "infra"]).toContain(
        metadata.area
      );
      expect(Array.isArray(metadata.suggestedResources)).toBe(true);
      expect(metadata.suggestedResources.length).toBeGreaterThan(0);
      expect(metadata.recommendedSessionLengthMinutes).toBeGreaterThan(0);
    }
  });

  it("should have reasonable expectedRewardEstimate values", async () => {
    const opportunities = await collectSkillInvestmentOpportunitiesNow();

    for (const opp of opportunities) {
      expect(opp.expectedRewardEstimate).toBeGreaterThanOrEqual(100);
      expect(opp.expectedRewardEstimate).toBeLessThanOrEqual(2000);
    }
  });

  it("should have unique IDs", async () => {
    const opportunities = await collectSkillInvestmentOpportunitiesNow();

    const ids = new Set(opportunities.map((opp) => opp.id));
    expect(ids.size).toBe(opportunities.length);
  });

  it("should have collectedAt timestamp", async () => {
    const opportunities = await collectSkillInvestmentOpportunitiesNow();

    for (const opp of opportunities) {
      expect(opp.collectedAt).toBeInstanceOf(Date);
    }
  });
});

describe("groupSkillOpportunitiesForHorizon", () => {
  it("should return buckets with mostly lower-time-cost items for horizonDays 7", async () => {
    const opportunities = await collectSkillInvestmentOpportunitiesNow();
    const buckets = groupSkillOpportunitiesForHorizon(7, opportunities);

    expect(buckets.length).toBeGreaterThan(0);

    // For short horizon, should only get "This Week" bucket
    expect(buckets.some((b) => b.label === "This Week")).toBe(true);

    // All opportunities should have timeCost <= 240 minutes (4 hours)
    for (const bucket of buckets) {
      for (const opp of bucket.opportunities) {
        expect(opp.timeCostMinutesEstimate).toBeLessThanOrEqual(240);
      }
    }
  });

  it("should return more items for horizonDays 30", async () => {
    const opportunities = await collectSkillInvestmentOpportunitiesNow();
    const buckets7 = groupSkillOpportunitiesForHorizon(7, opportunities);
    const buckets30 = groupSkillOpportunitiesForHorizon(30, opportunities);

    // Count total opportunities in buckets
    const count7 = buckets7.reduce((sum, b) => sum + b.opportunities.length, 0);
    const count30 = buckets30.reduce((sum, b) => sum + b.opportunities.length, 0);

    expect(count30).toBeGreaterThanOrEqual(count7);
    expect(buckets30.length).toBeGreaterThan(0);
  });

  it("should group by intensity for medium horizon (30 days)", async () => {
    const opportunities = await collectSkillInvestmentOpportunitiesNow();
    const buckets = groupSkillOpportunitiesForHorizon(30, opportunities);

    // Should have buckets organized by intensity
    const labels = buckets.map((b) => b.label);

    // Should contain at least one intensity-based label
    const hasIntensityBucket = labels.some(
      (label) =>
        label.includes("Light") ||
        label.includes("Moderate") ||
        label.includes("Deep Dive")
    );

    expect(hasIntensityBucket).toBe(true);
  });

  it("should group by area for long horizon (> 30 days)", async () => {
    const opportunities = await collectSkillInvestmentOpportunitiesNow();
    const buckets = groupSkillOpportunitiesForHorizon(60, opportunities);

    expect(buckets.length).toBeGreaterThan(0);

    // Should have area-based buckets
    const labels = buckets.map((b) => b.label);

    // Should contain area labels
    const hasAreaBucket = labels.some(
      (label) =>
        label.includes("Quant") ||
        label.includes("Automation") ||
        label.includes("AI") ||
        label.includes("Frontend") ||
        label.includes("Infrastructure")
    );

    expect(hasAreaBucket).toBe(true);
  });

  it("should handle empty opportunity array", () => {
    const buckets = groupSkillOpportunitiesForHorizon(7, []);

    expect(Array.isArray(buckets)).toBe(true);
  });

  it("should return buckets with correct structure", async () => {
    const opportunities = await collectSkillInvestmentOpportunitiesNow();
    const buckets = groupSkillOpportunitiesForHorizon(30, opportunities);

    for (const bucket of buckets) {
      expect(bucket.label).toBeDefined();
      expect(typeof bucket.label).toBe("string");
      expect(bucket.label.length).toBeGreaterThan(0);
      expect(Array.isArray(bucket.opportunities)).toBe(true);
    }
  });
});
