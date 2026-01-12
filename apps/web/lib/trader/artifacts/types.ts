/**
 * Artifact Types for Trader UI
 *
 * Defines the structure of artifacts read from /var/lib/trader-artifacts/shadow
 * and the API response shapes.
 */

/**
 * Status of an artifact read operation
 */
export type ArtifactStatus = "OK" | "MISSING" | "STALE" | "PARSE_ERROR";

/**
 * Result of reading a single artifact file
 */
export interface ArtifactReadResult<T> {
  status: ArtifactStatus;
  data: T | null;
  error: string | null;
  file_mtime_utc: string | null;
  age_seconds: number | null;
}

/**
 * Pull status from the systemd timer service
 */
export interface PullStatus {
  ok: boolean;
  last_pull_utc: string;
  artifact_age_sec: number;
  last_error: string | null;
  source: string;
  dest: string;
}

/**
 * Shadow mode trading summary artifact
 */
export interface ShadowSummary {
  mode: "shadow";
  timestamp: string;
  positions: number;
  signals_today: number;
  edge_active?: string[];
  pnl_unrealized: number;
  pnl_daily: number;
}

/**
 * Shadow mode health status artifact
 */
export interface ShadowHealth {
  ok: boolean;
  components: {
    feeds: boolean;
    engine: boolean;
    risk: boolean;
    db: boolean;
  };
  last_heartbeat: string;
  version: string;
}

/**
 * Single journal entry
 */
export interface JournalEntry {
  id: string;
  timestamp: string;
  type: "signal" | "position" | "risk" | "system";
  message: string;
  metadata?: Record<string, unknown>;
}

/**
 * Journal preview with limited entries
 */
export interface JournalPreview {
  entries: JournalEntry[];
  total_count: number;
  oldest_entry: string | null;
  newest_entry: string | null;
}

/**
 * Standard API response shape for artifact endpoints
 */
export interface ArtifactApiResponse<T> {
  ok: boolean;
  data: T | null;
  status: ArtifactStatus;
  error: string | null;
  artifact_age_sec: number | null;
  last_pull_utc: string | null;
}

/**
 * Access check result for artifact gating
 */
export interface ArtifactAccessResult {
  allowed: boolean;
  reason?: "not_in_allowlist" | "env_not_configured" | "user_not_found" | "check_failed";
  userId: string;
}

/**
 * Debug info for TraderDebugDock extension
 */
export interface ArtifactDebugInfo {
  artifacts_dir: string;
  last_pull_utc: string | null;
  artifact_age_sec: number | null;
  last_error: string | null;
  pull_status: "ok" | "stale" | "error" | "unknown";
}
