import { Code } from "@/lib/codes-aggregator";

/**
 * Result of a source fetch operation
 */
export interface SourceResult {
  codes: Code[];
  success: boolean;
  error?: string;
  metadata: {
    source: string;
    fetchedAt: string;
    count: number;
    duration: number;
    status: "success" | "partial" | "failed";
  };
}

/**
 * Configuration for source adapters
 */
export interface SourceConfig {
  timeout: number;
  retries: number;
  retryDelay: number;
  cacheTtl: number;
  enabled: boolean;
}

/**
 * Base interface for all source adapters
 */
export interface CodeSource {
  readonly name: string;
  readonly config: SourceConfig;

  /**
   * Fetch codes from this source
   */
  fetch(): Promise<SourceResult>;

  /**
   * Check if the source is available/healthy
   */
  healthCheck(): Promise<{ healthy: boolean; error?: string }>;

  /**
   * Get source-specific metadata
   */
  getMetadata(): {
    name: string;
    description: string;
    url?: string;
    rateLimit?: string;
    lastSuccessfulFetch?: string;
    totalFetches: number;
    successfulFetches: number;
    failedFetches: number;
  };
}

/**
 * Factory function to create source adapters
 */
export type SourceFactory<T extends CodeSource = CodeSource> = (
  config?: Partial<SourceConfig>
) => T;

/**
 * Registry for managing multiple source adapters
 */
export interface SourceRegistry {
  register(source: CodeSource): void;
  unregister(name: string): void;
  get(name: string): CodeSource | undefined;
  getAll(): CodeSource[];
  getEnabled(): CodeSource[];
}

/**
 * Configuration for the codes aggregator
 */
export interface AggregatorConfig {
  sources: {
    [key: string]: Partial<SourceConfig>;
  };
  cache: {
    enabled: boolean;
    ttl: number;
    staleWhileRevalidate: boolean;
    staleTtl: number;
  };
  deduplication: {
    enabled: boolean;
    strategy: "newest" | "oldest" | "highest_priority";
    priorityOrder: string[];
  };
  refresh: {
    enabled: boolean;
    interval: number;
    onDemand: boolean;
  };
}
