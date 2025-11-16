/**
 * Type definitions for Codes Aggregator
 */

export type SourceSite = "discord" | "reddit" | "twitter" | "wiki" | "pocketgamer" | "snelp";

export type SourceStatus = "ok" | "degraded" | "failed" | "not_configured";

export interface CodeSource {
  site: SourceSite;
  url?: string;
  post_id?: string;
  confidence: number; // 0..1 (trust weight)
  fetched_at: string; // ISO 8601
}

export interface Code {
  code: string; // UPPERCASE; dashes preserved
  title?: string;
  description?: string;
  rewards?: string[];
  region?: "global" | "na" | "eu" | "asia" | string | null;
  expires_at?: string | null; // ISO 8601
  first_seen_at: string; // ISO 8601
  last_seen_at: string; // ISO 8601
  sources: CodeSource[];
  verified: boolean;
  tags?: string[];
}

export interface SourceMetadata {
  source: SourceSite;
  status: SourceStatus;
  lastFetch: string;
  itemCount: number;
  error?: string;
  parseSuccessRate?: number;
}

export interface AggregationResult {
  codes: Code[];
  sources: Record<SourceSite, SourceMetadata>;
}
