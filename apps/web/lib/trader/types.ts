// Trader UI Data Types

export interface HealthResponse {
  ok: boolean;
  timestamp: string;
  version: string;
}

export interface Market {
  id: string;
  symbol: string;
  exchange: string;
  status: "active" | "halted" | "closed";
  lastPrice: number;
  volume24h: number;
  change24h: number;
  updatedAt: string;
}

export interface FeedStatus {
  id: string;
  name: string;
  connected: boolean;
  latencyMs: number;
  messagesPerSec: number;
  lastMessage: string;
}

export interface Decision {
  id: string;
  timestamp: string;
  market: string;
  signal: "long" | "short" | "flat";
  confidence: number;
  edge: string;
  executed: boolean;
  notes?: string;
}

export interface RiskMetrics {
  totalExposure: number;
  maxDrawdown: number;
  sharpeRatio: number;
  positionCount: number;
  unrealizedPnl: number;
  dailyPnl: number;
  weeklyPnl: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error";
  source: string;
  message: string;
}

export interface FetchResult<T> {
  data: T | null;
  error: string | null;
  latencyMs: number;
}

export interface TraderClient {
  getHealth(): Promise<FetchResult<HealthResponse>>;
  getActiveMarkets(): Promise<FetchResult<Market[]>>;
  getFeedsStatus(): Promise<FetchResult<FeedStatus[]>>;
  getRecentDecisions(limit?: number): Promise<FetchResult<Decision[]>>;
  getRisk(): Promise<FetchResult<RiskMetrics>>;
  getLogsTail(limit?: number): Promise<FetchResult<LogEntry[]>>;
}

export type TraderMode = "shadow" | "live";
export type AdapterType = "mock" | "http";

export interface TraderState {
  mode: TraderMode;
  adapterType: AdapterType;
  apiBase: string;
  lastFetch: string | null;
  latencyMs: number | null;
  errorCount: number;
  lastError: string | null;
}
