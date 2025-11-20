/**
 * Tests for Found Money collectors
 */

import { describe, it, expect } from "vitest";
import {
  collectRebateOpportunitiesNow,
  collectUnclaimedPropertyNudgesNow,
} from "../src/collectors/foundMoney";
import { buildRadarSnapshot } from "../src/radar";
import type { UserProfile } from "../../opps-core/src/types";

describe("Found Money Collectors", () => {
  describe("collectRebateOpportunitiesNow", () => {
    it("should return at least 2-3 rebate opportunities", async () => {
      const opportunities = await collectRebateOpportunitiesNow();
      expect(opportunities.length).toBeGreaterThanOrEqual(2);
    });

    it("should return opportunities with correct risk level and freshness tier", async () => {
      const opportunities = await collectRebateOpportunitiesNow();

      opportunities.forEach((opp) => {
        expect(opp.riskLevel).toBe("low");
        expect(opp.freshnessTier).toBe("slow_batch");
      });
    });

    it("should return opportunities with valid domains", async () => {
      const opportunities = await collectRebateOpportunitiesNow();
      const validDomains = ["promo", "legal", "misc"];

      opportunities.forEach((opp) => {
        expect(validDomains).toContain(opp.domain);
      });
    });

    it("should have reasonable reward estimates and time costs", async () => {
      const opportunities = await collectRebateOpportunitiesNow();

      opportunities.forEach((opp) => {
        expect(opp.expectedRewardEstimate).toBeGreaterThan(0);
        expect(opp.timeCostMinutesEstimate).toBeGreaterThan(0);
        expect(opp.timeCostMinutesEstimate).toBeLessThan(120); // Less than 2 hours
      });
    });

    it("should have metadata with category 'rebate'", async () => {
      const opportunities = await collectRebateOpportunitiesNow();

      opportunities.forEach((opp) => {
        expect(opp.metadata).toBeDefined();
        expect(opp.metadata?.category).toBe("rebate");
        expect(opp.metadata?.programType).toBeDefined();
        expect(opp.metadata?.region).toBeDefined();
        expect(typeof opp.metadata?.requiresPaperwork).toBe("boolean");
      });
    });
  });

  describe("collectUnclaimedPropertyNudgesNow", () => {
    it("should return at least 1-2 nudge opportunities", async () => {
      const opportunities = await collectUnclaimedPropertyNudgesNow();
      expect(opportunities.length).toBeGreaterThanOrEqual(1);
    });

    it("should return opportunities with low time cost", async () => {
      const opportunities = await collectUnclaimedPropertyNudgesNow();

      opportunities.forEach((opp) => {
        expect(opp.timeCostMinutesEstimate).toBeLessThanOrEqual(20);
      });
    });

    it("should have metadata with category 'unclaimed_property_nudge'", async () => {
      const opportunities = await collectUnclaimedPropertyNudgesNow();

      opportunities.forEach((opp) => {
        expect(opp.metadata).toBeDefined();
        expect(opp.metadata?.category).toBe("unclaimed_property_nudge");
        expect(opp.metadata?.region).toBeDefined();
        expect(opp.metadata?.officialSitesHint).toBe(true);
      });
    });

    it("should return opportunities with correct risk level and freshness tier", async () => {
      const opportunities = await collectUnclaimedPropertyNudgesNow();

      opportunities.forEach((opp) => {
        expect(opp.riskLevel).toBe("low");
        expect(opp.freshnessTier).toBe("slow_batch");
      });
    });
  });

  describe("buildRadarSnapshot integration", () => {
    it("should include Found Money opportunities in radar snapshot", async () => {
      const profile: UserProfile = {
        userId: "test-user-123",
        preferences: {},
      };

      const snapshot = await buildRadarSnapshot(profile);

      // Should have total opportunities
      expect(snapshot.totalOpportunities).toBeGreaterThan(0);

      // Should have opportunities in promo, legal, or misc categories
      const hasFoundMoney =
        (snapshot.topByCategory.promo?.length ?? 0) > 0 ||
        (snapshot.topByCategory.legal?.length ?? 0) > 0 ||
        (snapshot.topByCategory.misc?.length ?? 0) > 0;

      expect(hasFoundMoney).toBe(true);
    });

    it("should include at least one opportunity in promo or legal domain", async () => {
      const profile: UserProfile = {
        userId: "test-user-456",
      };

      const snapshot = await buildRadarSnapshot(profile, 20);

      // Verify we have opportunities in expected domains
      const promoCount = snapshot.topByCategory.promo?.length ?? 0;
      const legalCount = snapshot.topByCategory.legal?.length ?? 0;
      const miscCount = snapshot.topByCategory.misc?.length ?? 0;

      expect(promoCount + legalCount + miscCount).toBeGreaterThan(0);
    });

    it("should respect limitPerDomain parameter", async () => {
      const profile: UserProfile = {
        userId: "test-user-789",
      };

      const limit = 3;
      const snapshot = await buildRadarSnapshot(profile, limit);

      // Each domain category should have at most 'limit' opportunities
      Object.values(snapshot.topByCategory).forEach((opps) => {
        if (opps) {
          expect(opps.length).toBeLessThanOrEqual(limit);
        }
      });
    });
  });
});
