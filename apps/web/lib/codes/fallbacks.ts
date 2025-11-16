import { Code } from "@/lib/codes-aggregator";
import { SourceResult } from "./sources/types";
import { getCache, CacheKeys } from "./cache";

/**
 * Fallback configuration
 */
export interface FallbackConfig {
  enabled: boolean;
  useCache: boolean;
  staleData: boolean;
  defaultCodes: Code[];
  circuitBreaker: {
    enabled: boolean;
    failureThreshold: number;
    recoveryTimeout: number;
  };
}

/**
 * Default fallback configuration
 */
const DEFAULT_CONFIG: FallbackConfig = {
  enabled: true,
  useCache: true,
  staleData: true,
  defaultCodes: [],
  circuitBreaker: {
    enabled: true,
    failureThreshold: 3,
    recoveryTimeout: 300000, // 5 minutes
  },
};

/**
 * Circuit breaker state for sources
 */
interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  state: "closed" | "open" | "half-open";
}

/**
 * Fallback mechanisms for handling source failures
 */
export class FallbackManager {
  private config: FallbackConfig;
  private circuitBreakers = new Map<string, CircuitBreakerState>();
  private cache = getCache();

  constructor(config?: Partial<FallbackConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Execute operation with fallback strategies
   */
  async executeWithFallback<T>(
    operation: () => Promise<T>,
    fallbackKey: string,
    options: {
      useCache?: boolean;
      staleData?: boolean;
      defaultValue?: T;
    } = {}
  ): Promise<T> {
    const { defaultValue } = options;

    // Check circuit breaker
    if (this.isCircuitOpen(fallbackKey)) {
      return this.fallbackToCache(fallbackKey, defaultValue);
    }

    try {
      // Try the main operation
      const result = await operation();

      // Reset circuit breaker on success
      this.resetCircuitBreaker(fallbackKey);

      return result;
    } catch (error) {
      // Record failure for circuit breaker
      this.recordFailure(fallbackKey);

      // Try fallback strategies
      return this.fallbackToCache(fallbackKey, defaultValue);
    }
  }

  /**
   * Handle source result with fallback logic
   */
  async handleSourceResult(
    result: SourceResult,
    fallbackKey: string
  ): Promise<SourceResult> {
    if (result.success) {
      // Cache successful result
      if (this.config.useCache) {
        await this.cache.set(CacheKeys.sourceResult(fallbackKey), result);
      }
      return result;
    }

    // Try to get cached result
    if (this.config.useCache) {
      try {
        const cached = await this.cache.get<SourceResult>(CacheKeys.sourceResult(fallbackKey));
        if (cached && this.isStaleDataAcceptable(cached.metadata.fetchedAt)) {
          console.info(`Using cached data for ${fallbackKey} due to source failure`);
          return {
            ...cached,
            metadata: {
              ...cached.metadata,
              status: "partial" as const, // Indicate this is fallback data
            },
          };
        }
      } catch (error) {
        console.warn(`Failed to retrieve cached data for ${fallbackKey}:`, error);
      }
    }

    // Return failed result with empty codes
    return result;
  }

  /**
   * Aggregate results with fallback handling
   */
  async aggregateWithFallbacks(
    results: SourceResult[]
  ): Promise<{
    codes: Code[];
    sources: SourceResult[];
    hasFallbacks: boolean;
  }> {
    const successfulResults = results.filter(r => r.success);
    const failedResults = results.filter(r => !r.success);

    let allCodes: Code[] = [];
    const processedResults: SourceResult[] = [];
    let hasFallbacks = false;

    // Process successful results
    for (const result of successfulResults) {
      allCodes.push(...result.codes);
      processedResults.push(result);
    }

    // Process failed results with fallbacks
    for (const result of failedResults) {
      const fallbackResult = await this.handleSourceResult(result, result.metadata.source);
      processedResults.push(fallbackResult);

      if (fallbackResult.metadata.status === "partial") {
        hasFallbacks = true;
        allCodes.push(...fallbackResult.codes);
      }
    }

    return {
      codes: allCodes,
      sources: processedResults,
      hasFallbacks,
    };
  }

  /**
   * Get emergency fallback codes
   */
  getEmergencyFallback(): Code[] {
    // Return hardcoded emergency codes that are known to be valid
    // These should be updated periodically with known good codes
    return [
      {
        code: "SLIMY2024",
        source: "emergency",
        ts: new Date().toISOString(),
        tags: ["emergency", "fallback"],
        expires: null,
        region: "global",
        description: "Emergency fallback code - please verify manually",
      },
      // Add more emergency codes as needed
    ];
  }

  /**
   * Check if circuit breaker is open
   */
  private isCircuitOpen(key: string): boolean {
    if (!this.config.circuitBreaker.enabled) {
      return false;
    }

    const state = this.circuitBreakers.get(key);
    if (!state) {
      return false;
    }

    if (state.state === "open") {
      const now = Date.now();
      const timeSinceLastFailure = now - state.lastFailure;

      if (timeSinceLastFailure > this.config.circuitBreaker.recoveryTimeout) {
        // Transition to half-open
        state.state = "half-open";
        this.circuitBreakers.set(key, state);
        return false;
      }

      return true;
    }

    return false;
  }

  /**
   * Record a failure for circuit breaker
   */
  private recordFailure(key: string): void {
    if (!this.config.circuitBreaker.enabled) {
      return;
    }

    const state = this.circuitBreakers.get(key) || {
      failures: 0,
      lastFailure: 0,
      state: "closed" as const,
    };

    state.failures++;
    state.lastFailure = Date.now();

    if (state.failures >= this.config.circuitBreaker.failureThreshold) {
      state.state = "open";
      console.warn(`Circuit breaker opened for ${key} after ${state.failures} failures`);
    }

    this.circuitBreakers.set(key, state);
  }

  /**
   * Reset circuit breaker on success
   */
  private resetCircuitBreaker(key: string): void {
    if (!this.config.circuitBreaker.enabled) {
      return;
    }

    this.circuitBreakers.set(key, {
      failures: 0,
      lastFailure: 0,
      state: "closed",
    });
  }

  /**
   * Fallback to cached data
   */
  private async fallbackToCache<T>(key: string, defaultValue?: T): Promise<T> {
    try {
      const cached = await this.cache.get<T>(key);
      if (cached !== null) {
        return cached;
      }
    } catch (error) {
      console.warn(`Cache fallback failed for ${key}:`, error);
    }

    if (defaultValue !== undefined) {
      return defaultValue;
    }

    throw new Error(`All fallback strategies failed for ${key}`);
  }

  /**
   * Check if stale data is acceptable
   */
  private isStaleDataAcceptable(lastFetched: string): boolean {
    if (!this.config.staleData) {
      return false;
    }

    const lastFetchTime = new Date(lastFetched).getTime();
    const now = Date.now();
    const age = now - lastFetchTime;

    // Accept data up to 24 hours old for fallbacks
    return age < 24 * 60 * 60 * 1000;
  }

  /**
   * Get circuit breaker status
   */
  getCircuitBreakerStatus(): { [key: string]: CircuitBreakerState } {
    return Object.fromEntries(this.circuitBreakers);
  }

  /**
   * Manually reset circuit breaker
   */
  resetCircuitBreakerManual(key: string): void {
    this.circuitBreakers.delete(key);
  }
}

/**
 * Singleton fallback manager instance
 */
let fallbackManagerInstance: FallbackManager | null = null;

/**
 * Get the global fallback manager instance
 */
export function getFallbackManager(config?: Partial<FallbackConfig>): FallbackManager {
  if (!fallbackManagerInstance) {
    fallbackManagerInstance = new FallbackManager(config);
  }
  return fallbackManagerInstance;
}
