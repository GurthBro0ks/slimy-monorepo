/**
 * Feature Flags System
 * Guild-scoped configuration for themes and experiments
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

export interface GuildFlags {
  guildId: string;
  theme: {
    colorPrimary?: string;
    badgeStyle?: "rounded" | "square" | "pill";
  };
  experiments: {
    ensembleOCR?: boolean;
    secondApprover?: boolean;
    askManus?: boolean;
    publicStats?: boolean;
  };
  updatedAt: string;
}

const FLAGS_DIR = join(process.cwd(), "data/guild-flags");

// Default flags
export const DEFAULT_FLAGS: Omit<GuildFlags, "guildId" | "updatedAt"> = {
  theme: {
    colorPrimary: "#39FF14", // neon-green
    badgeStyle: "rounded",
  },
  experiments: {
    ensembleOCR: false,
    secondApprover: false,
    askManus: false,
    publicStats: false,
  },
};

/**
 * Ensure flags directory exists
 */
function ensureFlagsDir() {
  if (!existsSync(FLAGS_DIR)) {
    mkdirSync(FLAGS_DIR, { recursive: true });
  }
}

/**
 * Get flags file path for a guild
 */
function getFlagsPath(guildId: string): string {
  return join(FLAGS_DIR, `${guildId}.json`);
}

/**
 * Get flags for a guild (server-side only)
 */
export function getGuildFlags(guildId: string): GuildFlags {
  ensureFlagsDir();

  const flagsPath = getFlagsPath(guildId);

  if (!existsSync(flagsPath)) {
    // Return defaults if no custom flags
    return {
      guildId,
      ...DEFAULT_FLAGS,
      updatedAt: new Date().toISOString(),
    };
  }

  try {
    const content = readFileSync(flagsPath, "utf-8");
    const flags = JSON.parse(content);

    // Merge with defaults to ensure all fields exist
    return {
      guildId,
      theme: { ...DEFAULT_FLAGS.theme, ...flags.theme },
      experiments: { ...DEFAULT_FLAGS.experiments, ...flags.experiments },
      updatedAt: flags.updatedAt || new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Failed to read flags for guild ${guildId}:`, error);
    return {
      guildId,
      ...DEFAULT_FLAGS,
      updatedAt: new Date().toISOString(),
    };
  }
}

/**
 * Update flags for a guild (server-side only)
 */
export function updateGuildFlags(
  guildId: string,
  updates: Partial<Omit<GuildFlags, "guildId" | "updatedAt">>
): GuildFlags {
  ensureFlagsDir();

  const current = getGuildFlags(guildId);

  const updated: GuildFlags = {
    guildId,
    theme: { ...current.theme, ...updates.theme },
    experiments: { ...current.experiments, ...updates.experiments },
    updatedAt: new Date().toISOString(),
  };

  const flagsPath = getFlagsPath(guildId);
  writeFileSync(flagsPath, JSON.stringify(updated, null, 2));

  console.info(`Flags updated for guild ${guildId}:`, updates);

  return updated;
}

/**
 * Delete flags for a guild (revert to defaults)
 */
export function deleteGuildFlags(guildId: string): void {
  ensureFlagsDir();

  const flagsPath = getFlagsPath(guildId);

  if (existsSync(flagsPath)) {
    writeFileSync(flagsPath, ""); // Clear file
    console.info(`Flags deleted for guild ${guildId}`);
  }
}

/**
 * Check if a specific experiment is enabled
 */
export function isExperimentEnabled(
  guildId: string,
  experiment: keyof GuildFlags["experiments"]
): boolean {
  const flags = getGuildFlags(guildId);
  return flags.experiments[experiment] === true;
}

/**
 * Get theme color for a guild
 */
export function getThemeColor(guildId: string): string {
  const flags = getGuildFlags(guildId);
  return flags.theme.colorPrimary || DEFAULT_FLAGS.theme.colorPrimary!;
}
