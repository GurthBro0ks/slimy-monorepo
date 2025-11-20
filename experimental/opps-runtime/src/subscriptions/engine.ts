/**
 * Subscription Trim suggestion engine.
 *
 * Analyzes user subscriptions and generates cost-cutting suggestions based on
 * simple heuristics like usage patterns and cost thresholds.
 */

import type { RawSubscription, SubscriptionTrimSuggestion } from "./types";

/**
 * Options for configuring the subscription trim suggestion engine.
 */
export interface SubscriptionTrimOptions {
  /**
   * Number of days of inactivity before a subscription is considered "rarely used".
   * Default: 90 days
   */
  rarelyUsedThresholdDays?: number;

  /**
   * Monthly cost threshold above which a subscription is considered "high cost".
   * Default: 20 dollars
   */
  highCostThreshold?: number;
}

const DEFAULT_OPTIONS: Required<SubscriptionTrimOptions> = {
  rarelyUsedThresholdDays: 90,
  highCostThreshold: 20,
};

/**
 * Generates subscription trim suggestions based on usage and cost heuristics.
 *
 * Heuristics:
 * - If lastUsedAt is older than rarelyUsedThresholdDays: suggest "cancel"
 * - Else if monthlyCost > highCostThreshold: suggest "downgrade" or "monitor" depending on category
 * - Else: suggest "monitor"
 *
 * Estimated savings:
 * - For "cancel": equal to monthlyCost
 * - For "downgrade": monthlyCost * 0.5 (rough estimate)
 * - For "monitor": 0
 *
 * @param subs - Array of user subscriptions to analyze
 * @param options - Optional configuration for the suggestion engine
 * @returns Array of subscription trim suggestions
 */
export function suggestSubscriptionTrims(
  subs: RawSubscription[],
  options?: SubscriptionTrimOptions
): SubscriptionTrimSuggestion[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const now = new Date();

  return subs.map((subscription) => {
    // Check if rarely used
    const isRarelyUsed = isSubscriptionRarelyUsed(
      subscription,
      now,
      opts.rarelyUsedThresholdDays
    );

    // Check if high cost
    const isHighCost = subscription.monthlyCost > opts.highCostThreshold;

    // Determine suggestion type
    let suggestionType: "cancel" | "downgrade" | "monitor";
    let estimatedSavingsMonthly: number;
    let reasoning: string;

    if (isRarelyUsed && subscription.monthlyCost > 0) {
      // Rarely used subscription - suggest cancellation
      suggestionType = "cancel";
      estimatedSavingsMonthly = subscription.monthlyCost;
      const daysSinceUse = getDaysSinceLastUse(subscription, now);
      reasoning = `Not used in ${daysSinceUse} days. Canceling would save $${subscription.monthlyCost.toFixed(2)}/month.`;
    } else if (isHighCost) {
      // High cost subscription - suggest downgrade or monitor based on category
      if (shouldSuggestDowngrade(subscription)) {
        suggestionType = "downgrade";
        estimatedSavingsMonthly = subscription.monthlyCost * 0.5;
        reasoning = `High monthly cost ($${subscription.monthlyCost.toFixed(2)}). Consider downgrading to a lower tier to save approximately $${estimatedSavingsMonthly.toFixed(2)}/month.`;
      } else {
        suggestionType = "monitor";
        estimatedSavingsMonthly = 0;
        reasoning = `High monthly cost ($${subscription.monthlyCost.toFixed(2)}). Monitor usage to ensure value.`;
      }
    } else {
      // Low cost or regularly used - just monitor
      suggestionType = "monitor";
      estimatedSavingsMonthly = 0;
      reasoning = `Currently being used regularly at a reasonable cost ($${subscription.monthlyCost.toFixed(2)}/month).`;
    }

    return {
      subscription,
      suggestionType,
      estimatedSavingsMonthly,
      reasoning,
    };
  });
}

/**
 * Determines if a subscription is rarely used based on lastUsedAt timestamp.
 */
function isSubscriptionRarelyUsed(
  subscription: RawSubscription,
  now: Date,
  thresholdDays: number
): boolean {
  if (!subscription.lastUsedAt) {
    // If we don't know when it was last used, assume it's being used
    return false;
  }

  const lastUsed = new Date(subscription.lastUsedAt);
  const daysSinceUse = (now.getTime() - lastUsed.getTime()) / (1000 * 60 * 60 * 24);

  return daysSinceUse > thresholdDays;
}

/**
 * Gets the number of days since the subscription was last used.
 */
function getDaysSinceLastUse(subscription: RawSubscription, now: Date): number {
  if (!subscription.lastUsedAt) {
    return 0;
  }

  const lastUsed = new Date(subscription.lastUsedAt);
  return Math.floor((now.getTime() - lastUsed.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Determines if we should suggest a downgrade based on subscription category.
 *
 * Heuristic: AI and productivity tools often have tiered pricing where downgrades
 * make sense. Entertainment and gaming less so.
 */
function shouldSuggestDowngrade(subscription: RawSubscription): boolean {
  const downgradeableCategories: RawSubscription["category"][] = [
    "ai",
    "productivity",
  ];

  return downgradeableCategories.includes(subscription.category);
}
