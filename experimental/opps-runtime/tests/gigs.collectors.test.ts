/**
 * Tests for gig and micro-service collectors
 */

import { describe, it, expect } from "vitest";
import {
  collectGigTaskOpportunitiesNow,
  collectMicroServiceOpportunitiesNow,
} from "../src/collectors/gigs";
import { buildRadarSnapshot } from "../src/radar";

describe("collectGigTaskOpportunitiesNow", () => {
  it("should return multiple opportunities", async () => {
    const opportunities = await collectGigTaskOpportunitiesNow();

    expect(opportunities).toBeDefined();
    expect(Array.isArray(opportunities)).toBe(true);
    expect(opportunities.length).toBeGreaterThan(0);
  });

  it("should use domain 'misc' for all gig tasks", async () => {
    const opportunities = await collectGigTaskOpportunitiesNow();

    for (const opp of opportunities) {
      expect(opp.domain).toBe("misc");
    }
  });

  it("should have metadata.category === 'gig_task' for all", async () => {
    const opportunities = await collectGigTaskOpportunitiesNow();

    for (const opp of opportunities) {
      expect(opp.metadata).toBeDefined();
      expect(opp.metadata?.category).toBe("gig_task");
    }
  });

  it("should have valid opportunity structure", async () => {
    const opportunities = await collectGigTaskOpportunitiesNow();

    for (const opp of opportunities) {
      expect(opp.id).toBeDefined();
      expect(opp.title).toBeDefined();
      expect(opp.description).toBeDefined();
      expect(opp.type).toBe("other");
      expect(opp.riskLevel).toMatch(/^(low|medium|high)$/);
      expect(opp.freshnessTier).toBe("fast_batch");
      expect(typeof opp.expectedRewardEstimate).toBe("number");
      expect(typeof opp.timeCostMinutesEstimate).toBe("number");
    }
  });

  it("should include skill tags in metadata", async () => {
    const opportunities = await collectGigTaskOpportunitiesNow();

    for (const opp of opportunities) {
      expect(opp.metadata?.skillTags).toBeDefined();
      expect(Array.isArray(opp.metadata?.skillTags)).toBe(true);
      expect(opp.metadata?.skillTags.length).toBeGreaterThan(0);
    }
  });

  it("should include platformHint in metadata", async () => {
    const opportunities = await collectGigTaskOpportunitiesNow();

    for (const opp of opportunities) {
      expect(opp.metadata?.platformHint).toBeDefined();
      expect(opp.metadata?.platformHint).toMatch(
        /^(freelance_board|oss_bounty|direct_client)$/
      );
    }
  });

  it("should include difficulty in metadata", async () => {
    const opportunities = await collectGigTaskOpportunitiesNow();

    for (const opp of opportunities) {
      expect(opp.metadata?.difficulty).toBeDefined();
      expect(opp.metadata?.difficulty).toMatch(/^(easy|medium|hard)$/);
    }
  });
});

describe("collectMicroServiceOpportunitiesNow", () => {
  it("should return multiple opportunities", async () => {
    const opportunities = await collectMicroServiceOpportunitiesNow();

    expect(opportunities).toBeDefined();
    expect(Array.isArray(opportunities)).toBe(true);
    expect(opportunities.length).toBeGreaterThan(0);
  });

  it("should use domain 'misc' for all micro-services", async () => {
    const opportunities = await collectMicroServiceOpportunitiesNow();

    for (const opp of opportunities) {
      expect(opp.domain).toBe("misc");
    }
  });

  it("should have metadata.category === 'micro_service' for all", async () => {
    const opportunities = await collectMicroServiceOpportunitiesNow();

    for (const opp of opportunities) {
      expect(opp.metadata).toBeDefined();
      expect(opp.metadata?.category).toBe("micro_service");
    }
  });

  it("should have metadata.reusable === true for all", async () => {
    const opportunities = await collectMicroServiceOpportunitiesNow();

    for (const opp of opportunities) {
      expect(opp.metadata?.reusable).toBe(true);
    }
  });

  it("should have valid opportunity structure", async () => {
    const opportunities = await collectMicroServiceOpportunitiesNow();

    for (const opp of opportunities) {
      expect(opp.id).toBeDefined();
      expect(opp.title).toBeDefined();
      expect(opp.description).toBeDefined();
      expect(opp.type).toBe("other");
      expect(opp.riskLevel).toMatch(/^(low|medium|high)$/);
      expect(opp.freshnessTier).toBe("fast_batch");
      expect(typeof opp.expectedRewardEstimate).toBe("number");
      expect(typeof opp.timeCostMinutesEstimate).toBe("number");
    }
  });

  it("should include idealClientProfile in metadata", async () => {
    const opportunities = await collectMicroServiceOpportunitiesNow();

    for (const opp of opportunities) {
      expect(opp.metadata?.idealClientProfile).toBeDefined();
      expect(typeof opp.metadata?.idealClientProfile).toBe("string");
    }
  });

  it("should include technicalStackHint in metadata", async () => {
    const opportunities = await collectMicroServiceOpportunitiesNow();

    for (const opp of opportunities) {
      expect(opp.metadata?.technicalStackHint).toBeDefined();
      expect(Array.isArray(opp.metadata?.technicalStackHint)).toBe(true);
    }
  });

  it("should have higher time estimates than gig tasks", async () => {
    const gigTasks = await collectGigTaskOpportunitiesNow();
    const microServices = await collectMicroServiceOpportunitiesNow();

    const avgGigTime =
      gigTasks.reduce((sum, opp) => sum + opp.timeCostMinutesEstimate, 0) /
      gigTasks.length;
    const avgMicroTime =
      microServices.reduce(
        (sum, opp) => sum + opp.timeCostMinutesEstimate,
        0
      ) / microServices.length;

    expect(avgMicroTime).toBeGreaterThan(avgGigTime);
  });
});

describe("buildRadarSnapshot integration", () => {
  it("should return radar snapshot with gig tasks and micro-services", async () => {
    const snapshot = await buildRadarSnapshot();

    expect(snapshot).toBeDefined();
    expect(snapshot.timestamp).toBeInstanceOf(Date);
    expect(snapshot.opportunities).toBeDefined();
    expect(Array.isArray(snapshot.opportunities)).toBe(true);
  });

  it("should include both gig tasks and micro-services in snapshot", async () => {
    const snapshot = await buildRadarSnapshot();

    const gigTasks = snapshot.opportunities.filter(
      (opp) => opp.metadata?.category === "gig_task"
    );
    const microServices = snapshot.opportunities.filter(
      (opp) => opp.metadata?.category === "micro_service"
    );

    expect(gigTasks.length).toBeGreaterThan(0);
    expect(microServices.length).toBeGreaterThan(0);
  });

  it("should include metadata with collector count", async () => {
    const snapshot = await buildRadarSnapshot();

    expect(snapshot.metadata).toBeDefined();
    expect(snapshot.metadata?.collectorCount).toBe(2);
    expect(snapshot.metadata?.totalOpportunities).toBeGreaterThan(0);
  });

  it("should work with permissive user profile", async () => {
    const profile = {
      skills: ["typescript", "node", "python"],
      interests: ["misc" as const],
      maxRiskLevel: "high" as const,
      minReward: 0,
      maxTimeMinutes: 1000,
    };

    const snapshot = await buildRadarSnapshot(profile);

    expect(snapshot.opportunities.length).toBeGreaterThan(0);
  });
});
