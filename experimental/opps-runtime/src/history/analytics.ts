/**
 * Analytics utilities for inferring user preferences from interaction history.
 */

import type { OpportunityDomain, OpportunityType, RiskLevel } from "@slimy/opps-core";
import type { UserHistorySnapshot } from "./types";

/**
 * Options for preference inference
 */
export interface InferenceOptions {
  /** Minimum number of events required to make inferences (default: 3) */
  minEvents?: number;
}

/**
 * Inferred user preferences based on interaction history
 */
export interface InferredPreferences {
  /** Domains the user seems to prefer (ordered by strength) */
  prefersDomains?: OpportunityDomain[];
  /** Types the user seems to prefer (ordered by strength) */
  prefersTypes?: OpportunityType[];
  /** Inferred risk tolerance level */
  inferredRiskTolerance?: RiskLevel | null;
}

/**
 * Infer basic user preferences from their interaction history.
 *
 * This function uses simple heuristics to determine user preferences:
 *
 * 1. Domain preferences: Domains where the user has more "accepted" or "completed"
 *    actions relative to "ignored" actions are considered preferred.
 *
 * 2. Type preferences: Similar logic to domains - types with higher engagement
 *    (accepts/completes vs ignores) are preferred.
 *
 * 3. Risk tolerance: Inferred from the risk levels of opportunities the user
 *    completed vs ignored. If high-risk opportunities have a higher completion
 *    rate than ignore rate, we infer high risk tolerance.
 *
 * Note: This is a simplified implementation. A production system would use
 * more sophisticated ML models and larger sample sizes.
 *
 * @param history - The user's interaction history
 * @param options - Configuration options for inference
 * @returns Inferred preferences or empty object if insufficient data
 */
export function inferBasicPreferencesFromHistory(
  history: UserHistorySnapshot,
  options?: InferenceOptions
): InferredPreferences {
  const minEvents = options?.minEvents ?? 3;

  // Not enough data to make inferences
  if (history.events.length < minEvents) {
    return {};
  }

  // We need opportunity metadata to infer preferences
  // For now, we'll assume metadata contains { domain, type, riskLevel }
  // In a real implementation, you'd fetch opportunity details from a store

  const domainScores = new Map<OpportunityDomain, { positive: number; negative: number }>();
  const typeScores = new Map<OpportunityType, { positive: number; negative: number }>();
  const riskScores = new Map<RiskLevel, { positive: number; negative: number }>();

  // Analyze each event
  for (const event of history.events) {
    const { action, metadata } = event;

    if (!metadata) continue;

    const domain = metadata.domain as OpportunityDomain | undefined;
    const type = metadata.type as OpportunityType | undefined;
    const riskLevel = metadata.riskLevel as RiskLevel | undefined;

    // Score positive (accepted/completed) vs negative (ignored) actions
    const isPositive = action === "accepted" || action === "completed";
    const isNegative = action === "ignored";

    if (domain) {
      const score = domainScores.get(domain) || { positive: 0, negative: 0 };
      if (isPositive) score.positive++;
      if (isNegative) score.negative++;
      domainScores.set(domain, score);
    }

    if (type) {
      const score = typeScores.get(type) || { positive: 0, negative: 0 };
      if (isPositive) score.positive++;
      if (isNegative) score.negative++;
      typeScores.set(type, score);
    }

    if (riskLevel) {
      const score = riskScores.get(riskLevel) || { positive: 0, negative: 0 };
      if (isPositive) score.positive++;
      if (isNegative) score.negative++;
      riskScores.set(riskLevel, score);
    }
  }

  // Calculate preferred domains
  const prefersDomains = Array.from(domainScores.entries())
    .filter(([_, scores]) => scores.positive > scores.negative)
    .sort((a, b) => {
      const aRatio = a[1].positive / (a[1].positive + a[1].negative);
      const bRatio = b[1].positive / (b[1].positive + b[1].negative);
      return bRatio - aRatio;
    })
    .map(([domain]) => domain);

  // Calculate preferred types
  const prefersTypes = Array.from(typeScores.entries())
    .filter(([_, scores]) => scores.positive > scores.negative)
    .sort((a, b) => {
      const aRatio = a[1].positive / (a[1].positive + a[1].negative);
      const bRatio = b[1].positive / (b[1].positive + b[1].negative);
      return bRatio - aRatio;
    })
    .map(([type]) => type);

  // Infer risk tolerance
  // If user completes/accepts more high-risk than they ignore, they're high-risk tolerant
  // If they ignore more high-risk, they're low-risk tolerant
  let inferredRiskTolerance: RiskLevel | null = null;

  const highRisk = riskScores.get("high");
  const mediumRisk = riskScores.get("medium");
  const lowRisk = riskScores.get("low");

  if (highRisk && highRisk.positive > highRisk.negative) {
    inferredRiskTolerance = "high";
  } else if (mediumRisk && mediumRisk.positive > mediumRisk.negative) {
    inferredRiskTolerance = "medium";
  } else if (lowRisk && lowRisk.positive > lowRisk.negative) {
    inferredRiskTolerance = "low";
  } else {
    // Default to medium if unclear
    inferredRiskTolerance = "medium";
  }

  return {
    prefersDomains: prefersDomains.length > 0 ? prefersDomains : undefined,
    prefersTypes: prefersTypes.length > 0 ? prefersTypes : undefined,
    inferredRiskTolerance,
  };
}
