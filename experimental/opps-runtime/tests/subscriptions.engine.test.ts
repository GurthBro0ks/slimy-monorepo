/**
 * Tests for the Subscription Trim engine.
 */

import { describe, it, expect } from "vitest";
import {
  suggestSubscriptionTrims,
  type SubscriptionTrimOptions,
} from "../src/subscriptions/engine";
import { subscriptionTrimSuggestionsToOpportunities } from "../src/subscriptions/opportunities";
import type { RawSubscription } from "../src/subscriptions/types";

describe("Subscription Trim Engine", () => {
  describe("suggestSubscriptionTrims", () => {
    it("should suggest cancel for rarely used subscription with cost", () => {
      const subscriptions: RawSubscription[] = [
        {
          id: "sub-1",
          name: "Netflix",
          category: "entertainment",
          monthlyCost: 15.99,
          // 180 days ago
          lastUsedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      const options: SubscriptionTrimOptions = {
        rarelyUsedThresholdDays: 90,
        highCostThreshold: 20,
      };

      const suggestions = suggestSubscriptionTrims(subscriptions, options);

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].suggestionType).toBe("cancel");
      expect(suggestions[0].estimatedSavingsMonthly).toBe(15.99);
      expect(suggestions[0].reasoning).toContain("Not used in");
    });

    it("should suggest downgrade for high-cost AI subscription", () => {
      const subscriptions: RawSubscription[] = [
        {
          id: "sub-2",
          name: "GPT-5.1 Pro",
          category: "ai",
          monthlyCost: 25.0,
          // Recently used (5 days ago)
          lastUsedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      const options: SubscriptionTrimOptions = {
        rarelyUsedThresholdDays: 90,
        highCostThreshold: 20,
      };

      const suggestions = suggestSubscriptionTrims(subscriptions, options);

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].suggestionType).toBe("downgrade");
      expect(suggestions[0].estimatedSavingsMonthly).toBe(25.0 * 0.5);
      expect(suggestions[0].reasoning).toContain("High monthly cost");
      expect(suggestions[0].reasoning).toContain("downgrading");
    });

    it("should suggest monitor for high-cost entertainment subscription", () => {
      const subscriptions: RawSubscription[] = [
        {
          id: "sub-3",
          name: "Premium Gaming Service",
          category: "gaming",
          monthlyCost: 30.0,
          // Recently used
          lastUsedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      const options: SubscriptionTrimOptions = {
        rarelyUsedThresholdDays: 90,
        highCostThreshold: 20,
      };

      const suggestions = suggestSubscriptionTrims(subscriptions, options);

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].suggestionType).toBe("monitor");
      expect(suggestions[0].estimatedSavingsMonthly).toBe(0);
      expect(suggestions[0].reasoning).toContain("Monitor usage");
    });

    it("should suggest monitor for low-cost, regularly used subscription", () => {
      const subscriptions: RawSubscription[] = [
        {
          id: "sub-4",
          name: "Spotify",
          category: "entertainment",
          monthlyCost: 9.99,
          // Recently used
          lastUsedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      const options: SubscriptionTrimOptions = {
        rarelyUsedThresholdDays: 90,
        highCostThreshold: 20,
      };

      const suggestions = suggestSubscriptionTrims(subscriptions, options);

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].suggestionType).toBe("monitor");
      expect(suggestions[0].estimatedSavingsMonthly).toBe(0);
      expect(suggestions[0].reasoning).toContain("regularly");
    });

    it("should handle subscription with no lastUsedAt", () => {
      const subscriptions: RawSubscription[] = [
        {
          id: "sub-5",
          name: "Unknown Service",
          category: "other",
          monthlyCost: 10.0,
          lastUsedAt: null,
        },
      ];

      const options: SubscriptionTrimOptions = {
        rarelyUsedThresholdDays: 90,
        highCostThreshold: 20,
      };

      const suggestions = suggestSubscriptionTrims(subscriptions, options);

      expect(suggestions).toHaveLength(1);
      // Should not suggest cancel if we don't know when it was used
      expect(suggestions[0].suggestionType).toBe("monitor");
    });

    it("should handle multiple subscriptions", () => {
      const subscriptions: RawSubscription[] = [
        {
          id: "sub-1",
          name: "Netflix",
          category: "entertainment",
          monthlyCost: 15.99,
          lastUsedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "sub-2",
          name: "GPT-5.1 Pro",
          category: "ai",
          monthlyCost: 25.0,
          lastUsedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "sub-3",
          name: "Spotify",
          category: "entertainment",
          monthlyCost: 9.99,
          lastUsedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      const suggestions = suggestSubscriptionTrims(subscriptions);

      expect(suggestions).toHaveLength(3);
      expect(suggestions[0].suggestionType).toBe("cancel"); // Netflix
      expect(suggestions[1].suggestionType).toBe("downgrade"); // GPT-5.1 Pro
      expect(suggestions[2].suggestionType).toBe("monitor"); // Spotify
    });
  });

  describe("subscriptionTrimSuggestionsToOpportunities", () => {
    it("should create Opportunities with correct structure", () => {
      const subscriptions: RawSubscription[] = [
        {
          id: "sub-1",
          name: "Netflix",
          category: "entertainment",
          monthlyCost: 15.99,
          lastUsedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      const suggestions = suggestSubscriptionTrims(subscriptions);
      const opportunities = subscriptionTrimSuggestionsToOpportunities(
        "user-123",
        suggestions
      );

      expect(opportunities).toHaveLength(1);

      const opp = opportunities[0];
      expect(opp.type).toBe("other");
      expect(opp.domain).toBe("misc");
      expect(opp.title).toContain("Netflix");
      expect(opp.riskLevel).toBe("low");
      expect(opp.freshnessTier).toBe("slow_batch");
      expect(opp.metadata?.category).toBe("subscription_trim");
      expect(opp.metadata?.suggestionType).toBe("cancel");
      expect(opp.metadata?.monthlyCost).toBe(15.99);
      expect(opp.metadata?.estimatedSavingsMonthly).toBe(15.99);
    });

    it("should calculate annual savings correctly", () => {
      const subscriptions: RawSubscription[] = [
        {
          id: "sub-1",
          name: "Netflix",
          category: "entertainment",
          monthlyCost: 15.99,
          lastUsedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      const suggestions = suggestSubscriptionTrims(subscriptions);
      const opportunities = subscriptionTrimSuggestionsToOpportunities(
        "user-123",
        suggestions
      );

      const opp = opportunities[0];
      // Annual savings should be monthly * 12
      expect(opp.expectedRewardEstimate).toBe(15.99 * 12);
    });

    it("should set appropriate time costs for different suggestion types", () => {
      const subscriptions: RawSubscription[] = [
        {
          id: "sub-1",
          name: "Netflix",
          category: "entertainment",
          monthlyCost: 15.99,
          lastUsedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "sub-2",
          name: "GPT-5.1 Pro",
          category: "ai",
          monthlyCost: 25.0,
          lastUsedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "sub-3",
          name: "Spotify",
          category: "entertainment",
          monthlyCost: 9.99,
          lastUsedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      const suggestions = suggestSubscriptionTrims(subscriptions);
      const opportunities = subscriptionTrimSuggestionsToOpportunities(
        "user-123",
        suggestions
      );

      expect(opportunities[0].timeCostMinutesEstimate).toBe(10); // cancel
      expect(opportunities[1].timeCostMinutesEstimate).toBe(15); // downgrade
      expect(opportunities[2].timeCostMinutesEstimate).toBe(5); // monitor
    });

    it("should generate unique IDs for each opportunity", () => {
      const subscriptions: RawSubscription[] = [
        {
          id: "sub-1",
          name: "Netflix",
          category: "entertainment",
          monthlyCost: 15.99,
          lastUsedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "sub-2",
          name: "Spotify",
          category: "entertainment",
          monthlyCost: 9.99,
          lastUsedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      const suggestions = suggestSubscriptionTrims(subscriptions);
      const opportunities = subscriptionTrimSuggestionsToOpportunities(
        "user-123",
        suggestions
      );

      expect(opportunities[0].id).not.toBe(opportunities[1].id);
      expect(opportunities[0].id).toContain("user-123");
      expect(opportunities[0].id).toContain("sub-1");
    });
  });
});
