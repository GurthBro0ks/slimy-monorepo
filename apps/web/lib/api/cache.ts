/**
 * In-Memory API Response Cache
 *
 * Simple Map-based cache for storing API responses with TTL support.
 * Useful for reducing redundant API calls and improving performance.
 */

export interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * In-memory cache using Map
 */
class ApiCache {
  private cache = new Map<string, CacheEntry>();

  /**
   * Generate a cache key from URL and optional body
   */
  generateKey(url: string, method: string = 'GET', body?: string): string {
    return `${method}:${url}:${body || ''}`;
  }

  /**
   * Check if a cache entry is still valid
   */
  isValid<T>(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  /**
   * Get data from cache if available and valid
   */
  getFromCache<T = unknown>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    if (this.isValid(entry)) {
      console.log(`[Cache] Hit: ${key}`);
      return entry.data;
    }

    // Entry expired, remove it
    console.log(`[Cache] Expired: ${key}`);
    this.cache.delete(key);
    return null;
  }

  /**
   * Store data in cache with TTL
   */
  setCache<T = unknown>(key: string, data: T, ttl: number = 300000): void {
    console.log(`[Cache] Set: ${key} (TTL: ${ttl}ms)`);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Remove a specific entry from cache
   */
  remove(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    console.log(`[Cache] Clearing all entries (${this.cache.size} total)`);
    this.cache.clear();
  }

  /**
   * Clean up expired cache entries
   */
  cleanExpired(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[Cache] Cleaned ${cleaned} expired entries`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Check if a key exists in cache (regardless of expiry)
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }
}

// Export singleton instance
export const apiCache = new ApiCache();

// Export helper functions for convenience
export const getFromCache = <T = unknown>(key: string): T | null =>
  apiCache.getFromCache<T>(key);

export const setCache = <T = unknown>(key: string, data: T, ttl?: number): void =>
  apiCache.setCache(key, data, ttl);

export const clearCache = (): void =>
  apiCache.clear();

export const cleanExpiredCache = (): void =>
  apiCache.cleanExpired();

export const getCacheStats = () =>
  apiCache.getStats();
