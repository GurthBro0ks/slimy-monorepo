import { describe, it, expect } from "vitest";
import type { Opportunity, UserProfile } from "../src/index";
import {
  scoreOpportunity,
  rankOpportunitiesForUser,
  filterOpportunitiesForUser,
} from "../src/index";

/**
 * Helper to create a test opportunity with sensible defaults.
 */
function createTestOpportunity(
  overrides: Partial<Opportunity> = {}
): Opportunity {
  return {
    id: `opp-${Math.random().toString(36).substr(2, 9)}`,
    type: "market_move",
    domain: "crypto",
    title: "Test Opportunity",
    shortSummary: "A test opportunity for unit testing",
    source: "test_collector",
    expectedRewardEstimate: 100,
    timeCostMinutesEstimate: 30,
    capitalRequiredEstimate: 0,
    riskLevel: "low",
    freshnessTier: "realtime",
    createdAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Helper to create a test user profile with sensible defaults.
 */
function createTestProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: "test-user",
    maxRiskLevel: "high",
    maxCapitalPerOpportunity: 1000,
    maxTimePerOpportunityMinutes: 120,
    ...overrides,
  };
}

describe("Opportunity Scoring", () => {
  describe("scoreOpportunity", () => {
    it("should score high-reward, low-time opportunities highly", () => {
      const profile = createTestProfile();
      const opportunity = createTestOpportunity({
        expectedRewardEstimate: 500,
        timeCostMinutesEstimate: 10,
        riskLevel: "low",
      });

      const scored = scoreOpportunity(opportunity, profile);

      // High reward (500) - low time cost (10 * 0.5 = 5) = ~495
      expect(scored.score).toBeGreaterThan(400);
      expect(scored.reasons).toContain("Expected reward: $500");
    });

    it("should penalize high time cost opportunities", () => {
      const profile = createTestProfile();
      const highTimeOpp = createTestOpportunity({
        expectedRewardEstimate: 100,
        timeCostMinutesEstimate: 120, // 2 hours
        riskLevel: "low",
      });
      const lowTimeOpp = createTestOpportunity({
        expectedRewardEstimate: 100,
        timeCostMinutesEstimate: 10,
        riskLevel: "low",
      });

      const highTimeScore = scoreOpportunity(highTimeOpp, profile);
      const lowTimeScore = scoreOpportunity(lowTimeOpp, profile);

      expect(lowTimeScore.score).toBeGreaterThan(highTimeScore.score);
    });

    it("should apply risk multipliers correctly", () => {
      const profile = createTestProfile();
      const lowRiskOpp = createTestOpportunity({
        expectedRewardEstimate: 100,
        timeCostMinutesEstimate: 0,
        riskLevel: "low",
      });
      const mediumRiskOpp = createTestOpportunity({
        expectedRewardEstimate: 100,
        timeCostMinutesEstimate: 0,
        riskLevel: "medium",
      });
      const highRiskOpp = createTestOpportunity({
        expectedRewardEstimate: 100,
        timeCostMinutesEstimate: 0,
        riskLevel: "high",
      });

      const lowRiskScore = scoreOpportunity(lowRiskOpp, profile);
      const mediumRiskScore = scoreOpportunity(mediumRiskOpp, profile);
      const highRiskScore = scoreOpportunity(highRiskOpp, profile);

      // Low risk should score highest, high risk should score lowest
      expect(lowRiskScore.score).toBeGreaterThan(mediumRiskScore.score);
      expect(mediumRiskScore.score).toBeGreaterThan(highRiskScore.score);
    });

    it("should add bonuses for preferred domains and types", () => {
      const profile = createTestProfile({
        prefersDomains: ["crypto", "stocks"],
        prefersTypes: ["market_move"],
      });
      const preferredOpp = createTestOpportunity({
        domain: "crypto",
        type: "market_move",
        expectedRewardEstimate: 100,
        timeCostMinutesEstimate: 0,
        riskLevel: "low",
      });
      const nonPreferredOpp = createTestOpportunity({
        domain: "legal",
        type: "class_action",
        expectedRewardEstimate: 100,
        timeCostMinutesEstimate: 0,
        riskLevel: "low",
      });

      const preferredScore = scoreOpportunity(preferredOpp, profile);
      const nonPreferredScore = scoreOpportunity(nonPreferredOpp, profile);

      // Preferred should score higher due to bonuses
      expect(preferredScore.score).toBeGreaterThan(nonPreferredScore.score);
      expect(preferredScore.reasons.some((r) => r.includes("Domain preference"))).toBe(true);
      expect(preferredScore.reasons.some((r) => r.includes("Type preference"))).toBe(true);
    });

    it("should handle null reward estimates with default value", () => {
      const profile = createTestProfile();
      const opportunity = createTestOpportunity({
        expectedRewardEstimate: null,
        timeCostMinutesEstimate: 0,
        riskLevel: "low",
      });

      const scored = scoreOpportunity(opportunity, profile);

      // Should use default reward estimate (10)
      expect(scored.score).toBeGreaterThan(0);
      expect(scored.reasons.some((r) => r.includes("Default reward estimate"))).toBe(true);
    });
  });

  describe("filterOpportunitiesForUser", () => {
    it("should filter out opportunities above risk limit", () => {
      const profile = createTestProfile({
        maxRiskLevel: "low",
      });
      const lowRiskOpp = createTestOpportunity({ riskLevel: "low" });
      const mediumRiskOpp = createTestOpportunity({ riskLevel: "medium" });
      const highRiskOpp = createTestOpportunity({ riskLevel: "high" });

      const filtered = filterOpportunitiesForUser(profile, [
        lowRiskOpp,
        mediumRiskOpp,
        highRiskOpp,
      ]);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe(lowRiskOpp.id);
    });

    it("should filter out opportunities above capital limit", () => {
      const profile = createTestProfile({
        maxCapitalPerOpportunity: 500,
      });
      const lowCapOpp = createTestOpportunity({ capitalRequiredEstimate: 100 });
      const highCapOpp = createTestOpportunity({ capitalRequiredEstimate: 1000 });

      const filtered = filterOpportunitiesForUser(profile, [lowCapOpp, highCapOpp]);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe(lowCapOpp.id);
    });

    it("should filter out opportunities above time limit", () => {
      const profile = createTestProfile({
        maxTimePerOpportunityMinutes: 60,
      });
      const quickOpp = createTestOpportunity({ timeCostMinutesEstimate: 30 });
      const slowOpp = createTestOpportunity({ timeCostMinutesEstimate: 120 });

      const filtered = filterOpportunitiesForUser(profile, [quickOpp, slowOpp]);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe(quickOpp.id);
    });

    it("should filter out avoided domains and types", () => {
      const profile = createTestProfile({
        avoidsDomains: ["legal"],
        avoidsTypes: ["class_action"],
      });
      const cryptoOpp = createTestOpportunity({
        domain: "crypto",
        type: "market_move",
      });
      const legalOpp = createTestOpportunity({
        domain: "legal",
        type: "class_action",
      });

      const filtered = filterOpportunitiesForUser(profile, [cryptoOpp, legalOpp]);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe(cryptoOpp.id);
    });

    it("should allow opportunities with null capital/time estimates", () => {
      const profile = createTestProfile({
        maxCapitalPerOpportunity: 100,
        maxTimePerOpportunityMinutes: 30,
      });
      const unknownOpp = createTestOpportunity({
        capitalRequiredEstimate: null,
        timeCostMinutesEstimate: null,
      });

      const filtered = filterOpportunitiesForUser(profile, [unknownOpp]);

      // Should pass through since we don't know the requirements
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe(unknownOpp.id);
    });
  });

  describe("rankOpportunitiesForUser", () => {
    it("should rank opportunities by score descending", () => {
      const profile = createTestProfile();
      const highScoreOpp = createTestOpportunity({
        expectedRewardEstimate: 1000,
        timeCostMinutesEstimate: 10,
        riskLevel: "low",
      });
      const mediumScoreOpp = createTestOpportunity({
        expectedRewardEstimate: 500,
        timeCostMinutesEstimate: 20,
        riskLevel: "low",
      });
      const lowScoreOpp = createTestOpportunity({
        expectedRewardEstimate: 100,
        timeCostMinutesEstimate: 60,
        riskLevel: "medium",
      });

      const ranked = rankOpportunitiesForUser(
        profile,
        [lowScoreOpp, highScoreOpp, mediumScoreOpp],
        10
      );

      expect(ranked).toHaveLength(3);
      expect(ranked[0].opportunity.id).toBe(highScoreOpp.id);
      expect(ranked[1].opportunity.id).toBe(mediumScoreOpp.id);
      expect(ranked[2].opportunity.id).toBe(lowScoreOpp.id);
    });

    it("should respect the limit parameter", () => {
      const profile = createTestProfile();
      const opportunities = [
        createTestOpportunity({ expectedRewardEstimate: 100 }),
        createTestOpportunity({ expectedRewardEstimate: 200 }),
        createTestOpportunity({ expectedRewardEstimate: 300 }),
        createTestOpportunity({ expectedRewardEstimate: 400 }),
        createTestOpportunity({ expectedRewardEstimate: 500 }),
      ];

      const ranked = rankOpportunitiesForUser(profile, opportunities, 3);

      expect(ranked).toHaveLength(3);
      // Should get top 3 by score
      expect(ranked[0].opportunity.expectedRewardEstimate).toBe(500);
      expect(ranked[1].opportunity.expectedRewardEstimate).toBe(400);
      expect(ranked[2].opportunity.expectedRewardEstimate).toBe(300);
    });

    it("should filter before ranking", () => {
      const profile = createTestProfile({
        maxRiskLevel: "low",
      });
      const lowRiskHighReward = createTestOpportunity({
        expectedRewardEstimate: 500,
        riskLevel: "low",
      });
      const highRiskHigherReward = createTestOpportunity({
        expectedRewardEstimate: 1000,
        riskLevel: "high",
      });

      const ranked = rankOpportunitiesForUser(
        profile,
        [lowRiskHighReward, highRiskHigherReward],
        10
      );

      // Should only include low risk opportunity, even though high risk had higher reward
      expect(ranked).toHaveLength(1);
      expect(ranked[0].opportunity.id).toBe(lowRiskHighReward.id);
    });
  });
});
