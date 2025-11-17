/**
 * Simple TTL-based in-memory cache
 * Used as fallback when Redis is unavailable
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class MemoryCache {
  private cache: Map<string, CacheEntry<any>>;

  constructor() {
    this.cache = new Map();
  }

  /**
   * Get a value from the cache
   * @param key Cache key
   * @returns The cached value or null if not found or expired
   */
  async get<T = any>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Set a value in the cache with TTL
   * @param key Cache key
   * @param value Value to cache
   * @param ttlSeconds Time to live in seconds
   */
  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    const expiresAt = Date.now() + ttlSeconds * 1000;

    this.cache.set(key, {
      value,
      expiresAt,
    });
  }

  /**
   * Get a value from cache or set it using a callback function
   * @param key Cache key
   * @param ttlSeconds Time to live in seconds
   * @param callbackFn Function to call if value not in cache
   * @returns The cached or freshly computed value
   */
  async getOrSet<T = any>(
    key: string,
    ttlSeconds: number,
    callbackFn: () => Promise<T> | T
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    // Call the callback to get fresh value
    const freshValue = await callbackFn();

    // Store in cache
    await this.set(key, freshValue, ttlSeconds);

    return freshValue;
  }

  /**
   * Delete a key from the cache
   * @param key Cache key to delete
   */
  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  /**
   * Clear all entries from the cache
   */
  async clear(): Promise<void> {
    this.cache.clear();
  }

  /**
   * Get the number of entries in the cache (including expired ones)
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }
  }
}

// Export singleton instance
export const memoryCache = new MemoryCache();
