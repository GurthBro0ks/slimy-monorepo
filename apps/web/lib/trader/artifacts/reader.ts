/**
 * Artifact Reader - Server-only module
 *
 * Reads JSON artifacts from the local filesystem.
 * NEVER reads from NUC1 directly - only from DEST_PATH.
 *
 * This module is server-only and should not be imported in client components.
 */

import fs from "fs/promises";
import path from "path";
import type {
  ArtifactReadResult,
  PullStatus,
  ShadowSummary,
  ShadowHealth,
  JournalPreview,
  JournalEntry,
} from "./types";

// Configuration from environment or defaults
const DEST_PATH =
  process.env.TRADER_ARTIFACTS_PATH || "/var/lib/trader-artifacts/shadow";
const STATUS_FILE =
  process.env.TRADER_ARTIFACTS_STATUS_FILE ||
  "/var/lib/trader-artifacts/status.json";
const STALE_THRESHOLD_SEC = parseInt(
  process.env.TRADER_ARTIFACTS_STALE_THRESHOLD_SEC || "300",
  10
);

/**
 * Read and parse a JSON file with status tracking
 */
async function readJsonFile<T>(
  filename: string,
  staleThresholdSec = STALE_THRESHOLD_SEC
): Promise<ArtifactReadResult<T>> {
  const filePath = path.join(DEST_PATH, filename);

  try {
    // Check if file exists and get stats
    const stat = await fs.stat(filePath);
    const mtimeUtc = stat.mtime.toISOString();
    const ageSeconds = Math.floor((Date.now() - stat.mtime.getTime()) / 1000);

    // Check if stale
    if (ageSeconds > staleThresholdSec) {
      return {
        status: "STALE",
        data: null,
        error: `File is ${ageSeconds}s old (threshold: ${staleThresholdSec}s)`,
        file_mtime_utc: mtimeUtc,
        age_seconds: ageSeconds,
      };
    }

    // Read and parse
    const raw = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(raw) as T;

    return {
      status: "OK",
      data,
      error: null,
      file_mtime_utc: mtimeUtc,
      age_seconds: ageSeconds,
    };
  } catch (err) {
    // Handle file not found
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return {
        status: "MISSING",
        data: null,
        error: `File not found: ${filename}`,
        file_mtime_utc: null,
        age_seconds: null,
      };
    }

    // Handle JSON parse errors
    if (err instanceof SyntaxError) {
      return {
        status: "PARSE_ERROR",
        data: null,
        error: `Invalid JSON in ${filename}`,
        file_mtime_utc: null,
        age_seconds: null,
      };
    }

    // Handle other errors (sanitized)
    return {
      status: "PARSE_ERROR",
      data: null,
      error: `Read error: ${(err as Error).message?.slice(0, 100) || "unknown"}`,
      file_mtime_utc: null,
      age_seconds: null,
    };
  }
}

/**
 * Read pull status from status.json
 */
export async function readPullStatus(): Promise<ArtifactReadResult<PullStatus>> {
  try {
    const raw = await fs.readFile(STATUS_FILE, "utf-8");
    const data = JSON.parse(raw) as PullStatus;
    const stat = await fs.stat(STATUS_FILE);

    return {
      status: "OK",
      data,
      error: null,
      file_mtime_utc: stat.mtime.toISOString(),
      age_seconds: Math.floor((Date.now() - stat.mtime.getTime()) / 1000),
    };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return {
        status: "MISSING",
        data: null,
        error: "Pull status file not found",
        file_mtime_utc: null,
        age_seconds: null,
      };
    }

    return {
      status: "PARSE_ERROR",
      data: null,
      error: `Status read error: ${(err as Error).message?.slice(0, 100) || "unknown"}`,
      file_mtime_utc: null,
      age_seconds: null,
    };
  }
}

/**
 * Read shadow summary artifact
 */
export async function readSummary(): Promise<ArtifactReadResult<ShadowSummary>> {
  return readJsonFile<ShadowSummary>("summary.json");
}

/**
 * Read shadow health artifact
 */
export async function readHealth(): Promise<ArtifactReadResult<ShadowHealth>> {
  return readJsonFile<ShadowHealth>("health.json");
}

/**
 * Read journal preview (last N entries)
 */
export async function readJournalPreview(
  limit = 20
): Promise<ArtifactReadResult<JournalPreview>> {
  // Use a longer stale threshold for journal (it may update less frequently)
  const result = await readJsonFile<JournalEntry[]>(
    "journal.json",
    STALE_THRESHOLD_SEC * 2
  );

  if (result.status !== "OK" || !result.data) {
    return {
      status: result.status,
      data: null,
      error: result.error,
      file_mtime_utc: result.file_mtime_utc,
      age_seconds: result.age_seconds,
    };
  }

  // Ensure we have an array
  const entries = Array.isArray(result.data) ? result.data : [];
  const preview: JournalPreview = {
    entries: entries.slice(0, limit),
    total_count: entries.length,
    oldest_entry: entries.length > 0 ? entries[entries.length - 1].timestamp : null,
    newest_entry: entries.length > 0 ? entries[0].timestamp : null,
  };

  return {
    status: "OK",
    data: preview,
    error: null,
    file_mtime_utc: result.file_mtime_utc,
    age_seconds: result.age_seconds,
  };
}

/**
 * Get artifacts directory path (for debug info)
 */
export function getArtifactsPath(): string {
  return DEST_PATH;
}

/**
 * Get status file path (for debug info)
 */
export function getStatusFilePath(): string {
  return STATUS_FILE;
}
