import { CodesResponse } from "@/lib/codes-aggregator";
import { getCache, CacheKeys } from "./cache";

/**
 * Refresh configuration
 */
export interface RefreshConfig {
  enabled: boolean;
  interval: number; // milliseconds
  staleWhileRevalidate: boolean;
  staleTtl: number; // seconds
  backgroundRefresh: boolean;
  forceRefreshThreshold: number; // age in seconds when we force refresh
}

/**
 * Default refresh configuration
 */
const DEFAULT_CONFIG: RefreshConfig = {
  enabled: true,
  interval: 300000, // 5 minutes
  staleWhileRevalidate: true,
  staleTtl: 600, // 10 minutes
  backgroundRefresh: true,
  forceRefreshThreshold: 1800, // 30 minutes
};

/**
 * Refresh state tracking
 */
interface RefreshState {
  lastRefresh: number;
  inProgress: boolean;
  lastSuccess: number | null;
  consecutiveFailures: number;
}

/**
 * Auto-refresh strategy with stale-while-revalidate pattern
 */
export class RefreshManager {
  private config: RefreshConfig;
  private refreshStates = new Map<string, RefreshState>();
  private intervals = new Map<string, NodeJS.Timeout>();
  private cache = getCache();

  constructor(config?: Partial<RefreshConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get data with stale-while-revalidate strategy
   */
  async getWithRefresh<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: {
      force?: boolean;
      background?: boolean;
    } = {}
  ): Promise<{ data: T; isStale: boolean }> {
    const { force = false, background = this.config.backgroundRefresh } = options;

    // Try to get from cache first
    const cached = await this.cache.get<T>(key);
    const state = this.getRefreshState(key);
    const now = Date.now();

    if (cached !== null && !force) {
      const cacheAge = (now - state.lastRefresh) / 1000; // seconds

      // If data is fresh enough, return it
      if (cacheAge < this.config.forceRefreshThreshold) {
        return { data: cached, isStale: false };
      }

      // If stale-while-revalidate is enabled, return stale data and refresh in background
      if (this.config.staleWhileRevalidate && background) {
        this.refreshInBackground(key, fetcher);
        return { data: cached, isStale: true };
      }
    }

    // Data is too old or missing, fetch fresh data
    try {
      const freshData = await fetcher();
      await this.cache.set(key, freshData, this.config.staleTtl);
      this.updateRefreshState(key, true);

      return { data: freshData, isStale: false };
    } catch (error) {
      // If we have stale data, return it even if fetch failed
      if (cached !== null && this.config.staleWhileRevalidate) {
        console.warn(`Fetch failed for ${key}, returning stale data:`, error);
        return { data: cached, isStale: true };
      }

      throw error;
    }
  }

  /**
   * Start automatic refresh intervals
   */
  startAutoRefresh(key: string, fetcher: () => Promise<unknown>): void {
    if (!this.config.enabled) {
      return;
    }

    // Clear existing interval if any
    this.stopAutoRefresh(key);

    const interval = setInterval(async () => {
      try {
        await this.performRefresh(key, fetcher);
      } catch (error) {
        console.error(`Auto-refresh failed for ${key}:`, error);
      }
    }, this.config.interval);

    this.intervals.set(key, interval);
    console.info(`Started auto-refresh for ${key} every ${this.config.interval / 1000}s`);
  }

  /**
   * Stop automatic refresh for a key
   */
  stopAutoRefresh(key: string): void {
    const interval = this.intervals.get(key);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(key);
      console.info(`Stopped auto-refresh for ${key}`);
    }
  }

  /**
   * Stop all automatic refreshes
   */
  stopAllAutoRefresh(): void {
    for (const [key] of this.intervals) {
      this.stopAutoRefresh(key);
    }
  }

  /**
   * Force a refresh for a key
   */
  async forceRefresh(key: string, fetcher: () => Promise<unknown>): Promise<void> {
    await this.performRefresh(key, fetcher);
  }

  /**
   * Get refresh statistics
   */
  getRefreshStats(): { [key: string]: RefreshState & { autoRefresh: boolean } } {
    const stats: { [key: string]: RefreshState & { autoRefresh: boolean } } = {};

    for (const [key, state] of this.refreshStates) {
      stats[key] = {
        ...state,
        autoRefresh: this.intervals.has(key),
      };
    }

    return stats;
  }

  /**
   * Perform the actual refresh operation
   */
  private async performRefresh(key: string, fetcher: () => Promise<any>): Promise<void> {
    const state = this.getRefreshState(key);

    // Prevent concurrent refreshes
    if (state.inProgress) {
      return;
    }

    state.inProgress = true;
    this.refreshStates.set(key, state);

    try {
      const data = await fetcher();
      await this.cache.set(key, data);
      this.updateRefreshState(key, true);
    } catch (error) {
      this.updateRefreshState(key, false);
      throw error;
    } finally {
      state.inProgress = false;
      this.refreshStates.set(key, state);
    }
  }

  /**
   * Refresh in background without blocking
   */
  private refreshInBackground(key: string, fetcher: () => Promise<any>): void {
    // Non-blocking refresh
    this.performRefresh(key, fetcher).catch(error => {
      console.error(`Background refresh failed for ${key}:`, error);
    });
  }

  /**
   * Get or create refresh state for a key
   */
  private getRefreshState(key: string): RefreshState {
    let state = this.refreshStates.get(key);
    if (!state) {
      state = {
        lastRefresh: 0,
        inProgress: false,
        lastSuccess: null,
        consecutiveFailures: 0,
      };
      this.refreshStates.set(key, state);
    }
    return state;
  }

  /**
   * Update refresh state after an operation
   */
  private updateRefreshState(key: string, success: boolean): void {
    const state = this.getRefreshState(key);
    const now = Date.now();

    state.lastRefresh = now;

    if (success) {
      state.lastSuccess = now;
      state.consecutiveFailures = 0;
    } else {
      state.consecutiveFailures++;
    }

    this.refreshStates.set(key, state);
  }
}

/**
 * Singleton refresh manager instance
 */
let refreshManagerInstance: RefreshManager | null = null;

/**
 * Get the global refresh manager instance
 */
export function getRefreshManager(config?: Partial<RefreshConfig>): RefreshManager {
  if (!refreshManagerInstance) {
    refreshManagerInstance = new RefreshManager(config);
  }
  return refreshManagerInstance;
}

/**
 * Specialized codes refresh manager
 */
export class CodesRefreshManager extends RefreshManager {
  constructor() {
    super({
      enabled: true,
      interval: 300000, // 5 minutes
      staleWhileRevalidate: true,
      staleTtl: 600, // 10 minutes
      backgroundRefresh: true,
      forceRefreshThreshold: 1800, // 30 minutes
    });
  }

  /**
   * Get codes with refresh strategy
   */
  async getCodesWithRefresh(
    fetcher: () => Promise<CodesResponse>
  ): Promise<{ response: CodesResponse; isStale: boolean }> {
    const result = await this.getWithRefresh(
      CacheKeys.aggregatedCodes,
      fetcher,
      { background: true }
    );

    return {
      response: result.data,
      isStale: result.isStale,
    };
  }

  /**
   * Start codes auto-refresh
   */
  startCodesAutoRefresh(fetcher: () => Promise<CodesResponse>): void {
    this.startAutoRefresh(CacheKeys.aggregatedCodes, fetcher);
  }
}
