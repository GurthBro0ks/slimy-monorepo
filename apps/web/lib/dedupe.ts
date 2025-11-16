/**
 * Deduplication and Normalization Logic
 * Implements trust weights and verification rules
 */

import { Code } from "./types/codes";

// Trust weights by source
const TRUST_WEIGHTS: Record<string, number> = {
  wiki: 1.0,
  discord: 0.9,
  twitter: 0.8,
  pocketgamer: 0.7,
  snelp: 0.65,
  reddit: 0.6,
};

/**
 * Normalize a code string
 */
export function normalizeCode(code: string): string {
  return code.toUpperCase().trim();
}

/**
 * Deduplicate and merge codes from multiple sources
 */
export function deduplicateCodes(codes: Code[]): Code[] {
  const codeMap = new Map<string, Code>();

  for (const code of codes) {
    const normalizedCode = normalizeCode(code.code);
    const existing = codeMap.get(normalizedCode);

    if (!existing) {
      // First occurrence
      codeMap.set(normalizedCode, {
        ...code,
        code: normalizedCode,
      });
      continue;
    }

    // Merge with existing
    existing.sources.push(...code.sources);

    // Update timestamps
    if (new Date(code.first_seen_at) < new Date(existing.first_seen_at)) {
      existing.first_seen_at = code.first_seen_at;
    }
    if (new Date(code.last_seen_at) > new Date(existing.last_seen_at)) {
      existing.last_seen_at = code.last_seen_at;
    }

    // Merge tags
    if (code.tags) {
      existing.tags = Array.from(
        new Set([...(existing.tags || []), ...code.tags])
      );
    }

    // Prefer non-null values for optional fields
    if (code.title && !existing.title) {
      existing.title = code.title;
    }
    if (code.description && !existing.description) {
      existing.description = code.description;
    }
    if (code.rewards && code.rewards.length > 0) {
      existing.rewards = Array.from(
        new Set([...(existing.rewards || []), ...code.rewards])
      );
    }
    if (code.expires_at && !existing.expires_at) {
      existing.expires_at = code.expires_at;
    }
  }

  // Apply verification logic
  const deduped = Array.from(codeMap.values());
  return deduped.map(applyVerification);
}

/**
 * Apply verification logic based on trust weights
 */
function applyVerification(code: Code): Code {
  // Check if from high-trust source
  const hasHighTrustSource = code.sources.some(
    (s) => s.site === "wiki" || s.site === "discord" || s.site === "twitter"
  );

  if (hasHighTrustSource) {
    code.verified = true;
    return code;
  }

  // Calculate combined trust weight within 24 hours
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const recentSources = code.sources.filter(
    (s) => new Date(s.fetched_at) > oneDayAgo
  );

  const combinedWeight = recentSources.reduce(
    (sum, s) => sum + (TRUST_WEIGHTS[s.site] || 0),
    0
  );

  code.verified = combinedWeight >= 1.5;

  return code;
}

/**
 * Filter codes by scope
 */
export function filterByScope(codes: Code[], scope: string): Code[] {
  const now = new Date();

  switch (scope) {
    case "active":
      return codes.filter((code) => {
        if (code.expires_at) {
          return new Date(code.expires_at) > now;
        }
        // If no expiry, consider active if seen in last 30 days
        const lastSeen = new Date(code.last_seen_at);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return lastSeen > thirtyDaysAgo;
      });

    case "past7":
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return codes.filter(
        (code) => new Date(code.last_seen_at) > sevenDaysAgo
      );

    case "all":
    default:
      return codes;
  }
}
