/**
 * Maps subscription trim suggestions to Opportunities.
 *
 * Converts SubscriptionTrimSuggestion objects into the standard Opportunity format
 * that can be consumed by the opps system.
 */

import type { Opportunity } from "@slimy/opps-core";
import type { SubscriptionTrimSuggestion } from "./types";

/**
 * Converts subscription trim suggestions into Opportunities.
 *
 * Each Opportunity:
 * - type: "other"
 * - domain: "misc"
 * - title: Short description like "Trim subscription: Netflix"
 * - shortSummary: Explanation of the suggestion
 * - expectedRewardEstimate: Estimated annual savings (monthly * 12)
 * - timeCostMinutesEstimate: Small estimate (5-20 minutes)
 * - riskLevel: "low"
 * - freshnessTier: "slow_batch"
 * - metadata: Contains subscription details and suggestion info
 *
 * @param userId - The user ID these opportunities belong to
 * @param suggestions - Array of subscription trim suggestions
 * @returns Array of Opportunities
 */
export function subscriptionTrimSuggestionsToOpportunities(
  userId: string,
  suggestions: SubscriptionTrimSuggestion[]
): Opportunity[] {
  return suggestions.map((suggestion) => {
    const { subscription, suggestionType, estimatedSavingsMonthly, reasoning } =
      suggestion;

    // Generate a unique ID based on user, subscription, and suggestion type
    const id = `subscription-trim-${userId}-${subscription.id}-${suggestionType}`;

    // Calculate annual savings
    const annualSavings = estimatedSavingsMonthly * 12;

    // Determine title based on suggestion type
    const actionVerb = getActionVerb(suggestionType);
    const title = `${actionVerb} subscription: ${subscription.name}`;

    // Estimate time cost based on suggestion type
    const timeCostMinutesEstimate = estimateTimeCost(suggestionType);

    const opportunity: Opportunity = {
      id,
      type: "other",
      domain: "misc",
      title,
      shortSummary: reasoning,
      expectedRewardEstimate: annualSavings,
      timeCostMinutesEstimate,
      riskLevel: "low",
      freshnessTier: "slow_batch",
      metadata: {
        category: "subscription_trim",
        suggestionType,
        monthlyCost: subscription.monthlyCost,
        estimatedSavingsMonthly,
        subscriptionName: subscription.name,
        subscriptionId: subscription.id,
        subscriptionCategory: subscription.category,
      },
    };

    return opportunity;
  });
}

/**
 * Gets an action verb for the opportunity title based on suggestion type.
 */
function getActionVerb(suggestionType: "cancel" | "downgrade" | "monitor"): string {
  switch (suggestionType) {
    case "cancel":
      return "Cancel";
    case "downgrade":
      return "Downgrade";
    case "monitor":
      return "Monitor";
    default:
      return "Review";
  }
}

/**
 * Estimates the time cost in minutes based on suggestion type.
 */
function estimateTimeCost(
  suggestionType: "cancel" | "downgrade" | "monitor"
): number {
  switch (suggestionType) {
    case "cancel":
      return 10; // Finding cancellation page, confirming
    case "downgrade":
      return 15; // Researching lower tiers, switching plan
    case "monitor":
      return 5; // Quick review of usage
    default:
      return 10;
  }
}
