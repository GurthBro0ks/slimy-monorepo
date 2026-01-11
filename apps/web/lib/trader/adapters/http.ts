// HTTP adapter for Trader UI - makes real API calls to the trader backend

import type {
  TraderClient,
  FetchResult,
  HealthResponse,
  Market,
  FeedStatus,
  Decision,
  RiskMetrics,
  LogEntry,
} from "../types";

const DEFAULT_TIMEOUT = 5000;

async function fetchWithTimeout<T>(
  url: string,
  options: RequestInit = {},
  timeout = DEFAULT_TIMEOUT
): Promise<FetchResult<T>> {
  const start = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);
    const latencyMs = Date.now() - start;

    if (!response.ok) {
      return {
        data: null,
        error: `HTTP ${response.status}: ${response.statusText}`,
        latencyMs,
      };
    }

    const data = await response.json();
    return { data, error: null, latencyMs };
  } catch (err) {
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - start;

    if (err instanceof Error) {
      if (err.name === "AbortError") {
        return { data: null, error: "Request timeout", latencyMs };
      }
      return { data: null, error: err.message, latencyMs };
    }

    return { data: null, error: "Unknown error", latencyMs };
  }
}

export function createHttpAdapter(baseUrl?: string): TraderClient {
  const base = baseUrl || process.env.NEXT_PUBLIC_TRADER_API_BASE || "";

  if (!base) {
    console.warn("[TraderHttpAdapter] No API base URL configured");
  }

  return {
    async getHealth(): Promise<FetchResult<HealthResponse>> {
      return fetchWithTimeout(`${base}/health`);
    },

    async getActiveMarkets(): Promise<FetchResult<Market[]>> {
      return fetchWithTimeout(`${base}/markets/active`);
    },

    async getFeedsStatus(): Promise<FetchResult<FeedStatus[]>> {
      return fetchWithTimeout(`${base}/feeds/status`);
    },

    async getRecentDecisions(limit = 20): Promise<FetchResult<Decision[]>> {
      return fetchWithTimeout(`${base}/decisions/recent?limit=${limit}`);
    },

    async getRisk(): Promise<FetchResult<RiskMetrics>> {
      return fetchWithTimeout(`${base}/risk`);
    },

    async getLogsTail(limit = 50): Promise<FetchResult<LogEntry[]>> {
      return fetchWithTimeout(`${base}/logs/tail?limit=${limit}`);
    },
  };
}
