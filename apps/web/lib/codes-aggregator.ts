/**
 * Enhanced Codes Aggregator
 * Merges codes from multiple sources with comprehensive error handling,
 * caching, deduplication, and fallback mechanisms
 */

import { createSnelpSource } from "./codes/sources/snelp";
import { createRedditSource } from "./codes/sources/reddit";
import { SourceResult, CodeSource, AggregatorConfig } from "./codes/sources/types";
import { getCache, CacheKeys } from "./codes/cache";
import { getDeduplicator } from "./codes/deduplication";
import { getFallbackManager } from "./codes/fallbacks";
import { CodesRefreshManager } from "./codes/refresh";

export interface Code {
  code: string;
  source: string;
  ts: string;
  tags: string[];
  expires: string | null;
  region: string;
  description?: string;
}

export interface CodesResponse {
  codes: Code[];
  sources: {
    [key: string]: {
      count: number;
      lastFetch: string;
      status: "success" | "partial" | "failed";
      error?: string;
    };
  };
  metadata: {
    totalSources: number;
    successfulSources: number;
    failedSources: number;
    deduplicationStats: {
      total: number;
      unique: number;
      duplicates: number;
      merged: number;
    };
    cache: {
      hit: boolean;
      stale: boolean;
      age?: number;
    };
    timestamp: string;
  };
}

/**
 * Default aggregator configuration
 */
const DEFAULT_CONFIG: AggregatorConfig = {
  sources: {
    snelp: {
      timeout: 10000,
      retries: 3,
      retryDelay: 1000,
      cacheTtl: 300,
      enabled: true,
    },
    reddit: {
      timeout: 15000,
      retries: 2,
      retryDelay: 2000,
      cacheTtl: 600,
      enabled: true,
    },
  },
  cache: {
    enabled: true,
    ttl: 300,
    staleWhileRevalidate: true,
    staleTtl: 600,
  },
  deduplication: {
    enabled: true,
    strategy: "newest",
    priorityOrder: ["snelp", "reddit"],
  },
  refresh: {
    enabled: true,
    interval: 300000,
    onDemand: true,
  },
};

/**
 * Enhanced codes aggregator
 */
export class CodesAggregator {
  private sources = new Map<string, CodeSource>();
  private config: AggregatorConfig;
  private cache = getCache();
  private deduplicator = getDeduplicator();
  private fallbackManager = getFallbackManager();
  private refreshManager = new CodesRefreshManager();

  constructor(config?: Partial<AggregatorConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config || {} };
    this.initializeSources();
  }

  /**
   * Initialize source adapters
   */
  private initializeSources(): void {
    // Create source adapters
    const snelpSource = createSnelpSource(this.config.sources.snelp);
    const redditSource = createRedditSource(this.config.sources.reddit);

    this.sources.set("snelp", snelpSource);
    this.sources.set("reddit", redditSource);

    // Configure deduplicator
    this.deduplicator = getDeduplicator(this.config.deduplication);

    // Configure fallback manager
    this.fallbackManager = getFallbackManager({
      enabled: true,
      useCache: this.config.cache.enabled,
      staleData: this.config.cache.staleWhileRevalidate,
    });

    // Configure cache
    this.cache = getCache({
      enabled: this.config.cache.enabled,
      ttl: this.config.cache.ttl,
    });

    // Start auto-refresh if enabled
    if (this.config.refresh.enabled) {
      this.refreshManager.startCodesAutoRefresh(() => this.fetchAndAggregate());
    }
  }

  /**
   * Aggregate codes from all sources with enhanced features
   */
  async aggregateCodes(): Promise<CodesResponse> {
    try {
      // Use refresh manager for stale-while-revalidate
      const { response, isStale } = await this.refreshManager.getCodesWithRefresh(
        () => this.fetchAndAggregate()
      );

      // Add cache metadata
      response.metadata.cache = {
        hit: true,
        stale: isStale,
        age: isStale ? this.getCacheAge() : 0,
      };

      return response;
    } catch (error) {
      console.error("Codes aggregation failed:", error);

      // Try to return cached data as last resort
      const cached = await this.cache.get<CodesResponse>(CacheKeys.aggregatedCodes);
      if (cached) {
        return {
          ...cached,
          metadata: {
            ...cached.metadata,
            cache: { hit: true, stale: true, age: this.getCacheAge() },
          },
        };
      }

      // Return empty response with error metadata
      return {
        codes: [],
        sources: {},
        metadata: {
          totalSources: 0,
          successfulSources: 0,
          failedSources: 0,
          deduplicationStats: { total: 0, unique: 0, duplicates: 0, merged: 0 },
          cache: { hit: false, stale: false },
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * Fetch and aggregate from all sources
   */
  private async fetchAndAggregate(): Promise<CodesResponse> {
    // Fetch from all enabled sources
    const enabledSources = Array.from(this.sources.values()).filter(
      source => this.config.sources[source.name]?.enabled !== false
    );

    // Fetch from all sources concurrently
    const sourcePromises = enabledSources.map(source =>
      this.fallbackManager.executeWithFallback(
        () => source.fetch(),
        source.name,
        { useCache: true }
      )
    );

    const results = await Promise.allSettled(sourcePromises);
    const sourceResults: SourceResult[] = [];

    // Process results
    for (let i = 0; i < results.length; i++) {
      const source = enabledSources[i];
      const result = results[i];

      if (result.status === "fulfilled") {
        sourceResults.push(result.value);
      } else {
        // Handle source failure
        console.error(`Source ${source.name} failed:`, result.reason);
        sourceResults.push({
          codes: [],
          success: false,
          error: result.reason instanceof Error ? result.reason.message : String(result.reason),
          metadata: {
            source: source.name,
            fetchedAt: new Date().toISOString(),
            count: 0,
            duration: 0,
            status: "failed",
          },
        });
      }
    }

    // Apply fallback mechanisms
    const { codes: allCodes, sources: processedSources } =
      await this.fallbackManager.aggregateWithFallbacks(sourceResults);

    // Deduplicate codes
    const deduplicationResult = this.deduplicator.deduplicate(allCodes);

    // Sort by timestamp (newest first)
    deduplicationResult.codes.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());

    // Build response
    const response: CodesResponse = {
      codes: deduplicationResult.codes,
      sources: {},
      metadata: {
        totalSources: sourceResults.length,
        successfulSources: processedSources.filter(s => s.success).length,
        failedSources: processedSources.filter(s => !s.success).length,
        deduplicationStats: deduplicationResult.stats,
        cache: { hit: false, stale: false },
        timestamp: new Date().toISOString(),
      },
    };

    // Build sources metadata
    for (const source of processedSources) {
      response.sources[source.metadata.source] = {
        count: source.codes.length,
        lastFetch: source.metadata.fetchedAt,
        status: source.metadata.status,
        error: source.error,
      };
    }

    return response;
  }

  /**
   * Get cache age in seconds
   */
  private getCacheAge(): number {
    // This is a simplified implementation - in a real scenario,
    // you'd track cache timestamps more precisely
    return 0;
  }

  /**
   * Get aggregator health status
   */
  async getHealthStatus(): Promise<{
    overall: "healthy" | "degraded" | "unhealthy";
    sources: { [key: string]: { healthy: boolean; error?: string } };
    cache: { available: boolean; connected: boolean };
    refresh: { active: boolean; stats: Record<string, unknown> };
  }> {
    // Check source health
    const sourceHealth: { [key: string]: { healthy: boolean; error?: string } } = {};
    for (const [name, source] of this.sources) {
      try {
        const health = await source.healthCheck();
        sourceHealth[name] = health;
      } catch (error) {
        sourceHealth[name] = {
          healthy: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }

    // Check cache health
    const cacheStats = await this.cache.getStats();

    // Check refresh health
    const refreshStats = this.refreshManager.getRefreshStats();

    // Determine overall health
    const healthySources = Object.values(sourceHealth).filter(s => s.healthy).length;
    const totalSources = Object.keys(sourceHealth).length;
    const cacheHealthy = cacheStats.available;
    const refreshActive = Object.keys(refreshStats).length > 0;

    let overall: "healthy" | "degraded" | "unhealthy" = "healthy";
    if (healthySources === 0 || !cacheHealthy) {
      overall = "unhealthy";
    } else if (healthySources < totalSources) {
      overall = "degraded";
    }

    return {
      overall,
      sources: sourceHealth,
      cache: {
        available: cacheStats.available,
        connected: cacheStats.connected,
      },
      refresh: {
        active: refreshActive,
        stats: refreshStats,
      },
    };
  }
}

/**
 * Singleton aggregator instance
 */
let aggregatorInstance: CodesAggregator | null = null;

/**
 * Get the global aggregator instance
 */
export function getAggregator(config?: Partial<AggregatorConfig>): CodesAggregator {
  if (!aggregatorInstance) {
    aggregatorInstance = new CodesAggregator(config);
  }
  return aggregatorInstance;
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use getAggregator().aggregateCodes() instead
 */
export async function aggregateCodes(): Promise<CodesResponse> {
  const aggregator = getAggregator();
  return aggregator.aggregateCodes();
}

/**
 * Filter codes by scope (unchanged for backward compatibility)
 */
export function filterByScope(codes: Code[], scope: string): Code[] {
  const now = new Date();

  switch (scope) {
    case "active":
      return codes.filter((code) => {
        if (code.expires) {
          return new Date(code.expires) > now;
        }
        return code.tags.includes("active");
      });

    case "past7":
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return codes.filter((code) => new Date(code.ts) > sevenDaysAgo);

    case "all":
    default:
      return codes;
  }
}

/**
 * Search codes by query string (unchanged for backward compatibility)
 */
export function searchCodes(codes: Code[], query: string): Code[] {
  if (!query.trim()) {
    return codes;
  }

  const lowerQuery = query.toLowerCase();

  return codes.filter((code) => {
    return (
      code.code.toLowerCase().includes(lowerQuery) ||
      code.description?.toLowerCase().includes(lowerQuery) ||
      code.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  });
}
