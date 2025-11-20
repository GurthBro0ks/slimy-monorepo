/**
 * Public API for the Subscription Trim module.
 *
 * Provides a simple interface for converting user-provided subscription data
 * into actionable Opportunities.
 */

import type { Opportunity } from "@slimy/opps-core";
import type { RawSubscription } from "./types";
import { suggestSubscriptionTrims, type SubscriptionTrimOptions } from "./engine";
import { subscriptionTrimSuggestionsToOpportunities } from "./opportunities";

/**
 * Builds subscription trim opportunities for a user from their subscription data.
 *
 * This is the main entry point for the Subscription Trim module. It takes a list
 * of user subscriptions, analyzes them for cost-cutting opportunities, and returns
 * a list of Opportunities that can be integrated into the opps system.
 *
 * @param userId - The user ID these opportunities belong to
 * @param subs - Array of user subscriptions (manually provided, no external API calls)
 * @param options - Optional configuration for the suggestion engine
 * @returns Array of Opportunities representing subscription trim suggestions
 *
 * @example
 * ```typescript
 * const subscriptions: RawSubscription[] = [
 *   {
 *     id: "sub-1",
 *     name: "Netflix",
 *     category: "entertainment",
 *     monthlyCost: 15.99,
 *     lastUsedAt: "2024-05-01T00:00:00Z", // 6 months ago
 *   },
 *   {
 *     id: "sub-2",
 *     name: "GPT-5.1 Pro",
 *     category: "ai",
 *     monthlyCost: 25.00,
 *     lastUsedAt: "2024-11-15T00:00:00Z", // Recent
 *   },
 * ];
 *
 * const opportunities = buildSubscriptionTrimOpportunitiesForUser(
 *   "user-123",
 *   subscriptions,
 *   { rarelyUsedThresholdDays: 90, highCostThreshold: 20 }
 * );
 *
 * // opportunities[0] might suggest canceling Netflix (not used in 180+ days)
 * // opportunities[1] might suggest downgrading GPT-5.1 Pro (high cost, AI category)
 * ```
 */
export function buildSubscriptionTrimOpportunitiesForUser(
  userId: string,
  subs: RawSubscription[],
  options?: SubscriptionTrimOptions
): Opportunity[] {
  // Step 1: Generate trim suggestions based on heuristics
  const suggestions = suggestSubscriptionTrims(subs, options);

  // Step 2: Convert suggestions to Opportunities
  const opportunities = subscriptionTrimSuggestionsToOpportunities(
    userId,
    suggestions
  );

  return opportunities;
}
