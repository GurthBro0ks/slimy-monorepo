/**
 * Subscription-related types for the Subscription Trim module.
 *
 * This module helps identify cost-cutting opportunities from a user's subscriptions.
 * No external APIs or real bank data integration - uses manually provided data only.
 */

/**
 * Represents a raw subscription from user-provided data.
 */
export interface RawSubscription {
  /** Unique identifier for this subscription */
  id: string;

  /** Name of the subscription service (e.g., "Netflix", "GPT-5.1 Pro") */
  name: string;

  /** Category of the subscription */
  category?: "ai" | "entertainment" | "productivity" | "gaming" | "other";

  /** Monthly cost in dollars */
  monthlyCost: number;

  /** When the subscription was last used (ISO timestamp) or null if unknown */
  lastUsedAt?: string | null;

  /** Additional notes about the subscription */
  notes?: string;
}

/**
 * Represents a suggestion to trim/optimize a subscription.
 */
export interface SubscriptionTrimSuggestion {
  /** The subscription this suggestion applies to */
  subscription: RawSubscription;

  /** Type of suggestion */
  suggestionType: "cancel" | "downgrade" | "monitor";

  /** Estimated monthly savings if the suggestion is followed */
  estimatedSavingsMonthly: number;

  /** Human-readable explanation of why this suggestion was made */
  reasoning: string;
}
