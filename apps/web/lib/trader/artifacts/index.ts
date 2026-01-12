/**
 * Trader Artifacts Module
 *
 * Provides server-side utilities for reading and gating access to
 * shadow trading artifacts pulled from NUC1.
 */

// Types
export type {
  ArtifactStatus,
  ArtifactReadResult,
  PullStatus,
  ShadowSummary,
  ShadowHealth,
  JournalEntry,
  JournalPreview,
  ArtifactApiResponse,
  ArtifactAccessResult,
  ArtifactDebugInfo,
} from "./types";

// Reader functions
export {
  readPullStatus,
  readSummary,
  readHealth,
  readJournalPreview,
  getArtifactsPath,
  getStatusFilePath,
} from "./reader";

// Access gate functions
export {
  checkArtifactAccess,
  gateArtifactAccess,
  isAllowlistConfigured,
} from "./gate";
export type { GateResponse } from "./gate";
