/**
 * Usage API Client
 * Provides usage summary, breakdown, and timeseries data
 * Supports sandbox mode when admin-api is not configured
 */

export interface UsageSummary {
  tokens: number;
  cost: number;
  requests: number;
  images: number;
}

export interface UsageBreakdownItem {
  category: string;
  tokens: number;
  cost: number;
  requests: number;
}

export interface UsageTimeseriesPoint {
  timestamp: string;
  tokens: number;
  cost: number;
  requests: number;
}

// Sandbox data
const SANDBOX_SUMMARY: UsageSummary = {
  tokens: 45230,
  cost: 1.23,
  requests: 127,
  images: 34,
};

const SANDBOX_BREAKDOWN: UsageBreakdownItem[] = [
  { category: "Chat", tokens: 25000, cost: 0.75, requests: 80 },
  { category: "Club Analysis", tokens: 12000, cost: 0.36, requests: 25 },
  { category: "Screenshot Analysis", tokens: 8230, cost: 0.12, requests: 22 },
];

const SANDBOX_TIMESERIES: UsageTimeseriesPoint[] = Array.from({ length: 7 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (6 - i));
  return {
    timestamp: date.toISOString(),
    tokens: Math.floor(5000 + Math.random() * 3000),
    cost: Math.random() * 0.5,
    requests: Math.floor(15 + Math.random() * 10),
  };
});

/**
 * Get usage summary
 */
export async function getUsageSummary(): Promise<UsageSummary> {
  const adminApiBase = process.env.NEXT_PUBLIC_ADMIN_API_BASE;

  if (!adminApiBase) {
    // Sandbox mode - return mock data
    return Promise.resolve(SANDBOX_SUMMARY);
  }

  try {
    const response = await fetch(`${adminApiBase}/api/usage/summary`, {
      credentials: "include",
    });

    if (!response.ok) {
      console.warn("Usage summary fetch failed, using sandbox data");
      return SANDBOX_SUMMARY;
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch usage summary:", error);
    return SANDBOX_SUMMARY;
  }
}

/**
 * Get usage breakdown by category
 */
export async function getUsageBreakdown(): Promise<UsageBreakdownItem[]> {
  const adminApiBase = process.env.NEXT_PUBLIC_ADMIN_API_BASE;

  if (!adminApiBase) {
    return Promise.resolve(SANDBOX_BREAKDOWN);
  }

  try {
    const response = await fetch(`${adminApiBase}/api/usage/breakdown`, {
      credentials: "include",
    });

    if (!response.ok) {
      console.warn("Usage breakdown fetch failed, using sandbox data");
      return SANDBOX_BREAKDOWN;
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch usage breakdown:", error);
    return SANDBOX_BREAKDOWN;
  }
}

/**
 * Get usage timeseries data
 * @param days Number of days to fetch (default: 7)
 */
export async function getUsageTimeseries(days: number = 7): Promise<UsageTimeseriesPoint[]> {
  const adminApiBase = process.env.NEXT_PUBLIC_ADMIN_API_BASE;

  if (!adminApiBase) {
    return Promise.resolve(SANDBOX_TIMESERIES.slice(-days));
  }

  try {
    const response = await fetch(`${adminApiBase}/api/usage/timeseries?days=${days}`, {
      credentials: "include",
    });

    if (!response.ok) {
      console.warn("Usage timeseries fetch failed, using sandbox data");
      return SANDBOX_TIMESERIES.slice(-days);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch usage timeseries:", error);
    return SANDBOX_TIMESERIES.slice(-days);
  }
}
