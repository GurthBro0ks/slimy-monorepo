/**
 * Codes Aggregator - Main Orchestrator
 * Fetches codes from all sources and applies deduplication
 */

import { fetchDiscordCodes } from "./adapters/discord";
import { fetchRedditCodes } from "./adapters/reddit";
import { fetchWikiCodes } from "./adapters/wiki";
import { fetchPocketGamerCodes } from "./adapters/pocketgamer";
import { fetchSnelpCodes } from "./adapters/snelp";
import { deduplicateCodes, filterByScope } from "./dedupe";
import { Code, SourceMetadata, AggregationResult, SourceSite } from "./types/codes";

/**
 * Aggregate codes from all sources
 */
export async function aggregateCodes(): Promise<AggregationResult> {
  // Fetch from all sources in parallel
  const [discord, reddit, wiki, pocketgamer, snelp] = await Promise.all([
    fetchDiscordCodes(),
    fetchRedditCodes(),
    fetchWikiCodes(),
    fetchPocketGamerCodes(),
    fetchSnelpCodes(),
  ]);

  // Combine all codes
  const allCodes: Code[] = [
    ...discord.codes,
    ...reddit.codes,
    ...wiki.codes,
    ...pocketgamer.codes,
    ...snelp.codes,
  ];

  // Deduplicate and verify
  const uniqueCodes = deduplicateCodes(allCodes);

  // Sort by last_seen_at (newest first)
  uniqueCodes.sort(
    (a, b) =>
      new Date(b.last_seen_at).getTime() - new Date(a.last_seen_at).getTime()
  );

  // Build sources metadata
  const sources: Record<SourceSite, SourceMetadata> = {
    discord: discord.metadata,
    reddit: reddit.metadata,
    twitter: {
      source: "twitter",
      status: "not_configured",
      lastFetch: new Date().toISOString(),
      itemCount: 0,
      error: "Twitter API v2 not configured",
    },
    wiki: wiki.metadata,
    pocketgamer: pocketgamer.metadata,
    snelp: snelp.metadata,
  };

  return {
    codes: uniqueCodes,
    sources,
  };
}

/**
 * Get filtered codes by scope
 */
export async function getCodesByScope(scope: string): Promise<{
  codes: Code[];
  sources: Record<SourceSite, SourceMetadata>;
  scope: string;
  count: number;
}> {
  const result = await aggregateCodes();
  const filteredCodes = filterByScope(result.codes, scope);

  return {
    codes: filteredCodes,
    sources: result.sources,
    scope,
    count: filteredCodes.length,
  };
}
