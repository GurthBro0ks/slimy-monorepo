/**
 * Usage Thresholds and Logic
 */

export type UsageLevel = "free" | "pro" | "over_cap";

export interface UsageData {
  level: UsageLevel;
  currentSpend: number;
  limit: number;
  modelProbeStatus: "ok" | "soft_cap" | "hard_cap";
}

const THRESHOLDS = {
  FREE_LIMIT: 100, // e.g., 100 model probes per month
  PRO_LIMIT: 1000,
};

/**
 * Determines the usage level based on current spend.
 */
export function getUsageLevel(currentSpend: number): UsageLevel {
  if (currentSpend <= THRESHOLDS.FREE_LIMIT) {
    return "free";
  }
  if (currentSpend <= THRESHOLDS.PRO_LIMIT) {
    return "pro";
  }
  return "over_cap";
}

/**
 * Generates a mock usage data object.
 */
export function getMockUsageData(spend: number): UsageData {
  const level = getUsageLevel(spend);
  let limit = THRESHOLDS.FREE_LIMIT;
  let modelProbeStatus: UsageData["modelProbeStatus"] = "ok";

  if (level === "pro") {
    limit = THRESHOLDS.PRO_LIMIT;
  } else if (level === "over_cap") {
    limit = THRESHOLDS.PRO_LIMIT;
    modelProbeStatus = "hard_cap";
  }

  // Simulate soft cap near the limit
  if (spend > THRESHOLDS.PRO_LIMIT * 0.9 && spend < THRESHOLDS.PRO_LIMIT) {
    modelProbeStatus = "soft_cap";
  }

  return {
    level,
    currentSpend: spend,
    limit,
    modelProbeStatus,
  };
}
