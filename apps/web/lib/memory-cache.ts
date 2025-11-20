/**
 * Simple in-memory cache with TTL support
 * For caching expensive derived data computations
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

interface CacheOptions {
  /**
   * Time-to-live in milliseconds
   * @default 60000 (1 minute)
   */
  ttl?: number;

  /**
   * Maximum number of entries before LRU eviction
   * @default 100
   */
  maxSize?: number;

  /**
   * Enable debug logging
   * @default false
   */
  debug?: boolean;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  evictions: number;
}

export class MemoryCache<T = any> {
  private cache: Map<string, CacheEntry<T>>;
  private accessOrder: Map<string, number>; // Track access time for LRU
  private stats: CacheStats;
  private ttl: number;
  private maxSize: number;
  private debug: boolean;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(options: CacheOptions = {}) {
    this.cache = new Map();
    this.accessOrder = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0,
      evictions: 0
    };
    this.ttl = options.ttl ?? 60000; // Default 1 minute
    this.maxSize = options.maxSize ?? 100;
    this.debug = options.debug ?? false;

    // Start cleanup interval to remove expired entries
    this.startCleanup();
  }

  /**
   * Get a value from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      this.log('MISS', key);
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      this.stats.size--;
      this.stats.misses++;
      this.log('EXPIRED', key);
      return null;
    }

    // Update access time for LRU
    this.accessOrder.set(key, Date.now());
    this.stats.hits++;
    this.log('HIT', key);

    return entry.value;
  }

  /**
   * Set a value in cache with optional custom TTL
   */
  set(key: string, value: T, customTtl?: number): void {
    const ttl = customTtl ?? this.ttl;

    // Check if we need to evict for size limit
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      value,
      expiresAt: Date.now() + ttl
    };

    const isNew = !this.cache.has(key);
    this.cache.set(key, entry);
    this.accessOrder.set(key, Date.now());

    if (isNew) {
      this.stats.size++;
    }

    this.log('SET', key, `TTL: ${ttl}ms`);
  }

  /**
   * Delete a specific key
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.accessOrder.delete(key);
      this.stats.size--;
      this.log('DELETE', key);
    }
    return deleted;
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder.clear();
    this.stats.size = 0;
    this.log('CLEAR', 'all entries removed');
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Check if cache has a valid entry for key
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Get or compute - fetch from cache or compute and cache
   */
  async getOrCompute(
    key: string,
    computeFn: () => Promise<T> | T,
    customTtl?: number
  ): Promise<T> {
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    const value = await computeFn();
    this.set(key, value, customTtl);
    return value;
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    // Find the least recently accessed entry
    for (const [key, accessTime] of this.accessOrder.entries()) {
      if (accessTime < oldestTime) {
        oldestTime = accessTime;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.accessOrder.delete(oldestKey);
      this.stats.size--;
      this.stats.evictions++;
      this.log('EVICT', oldestKey, 'LRU eviction');
    }
  }

  /**
   * Start background cleanup of expired entries
   */
  private startCleanup(): void {
    // Run cleanup every 30 seconds
    this.cleanupInterval = setInterval(() => {
      this.removeExpired();
    }, 30000);
  }

  /**
   * Remove all expired entries
   */
  private removeExpired(): void {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        this.accessOrder.delete(key);
        this.stats.size--;
        removed++;
      }
    }

    if (removed > 0) {
      this.log('CLEANUP', `removed ${removed} expired entries`);
    }
  }

  /**
   * Stop cleanup interval and clear cache
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
    this.log('DESTROY', 'cache destroyed');
  }

  /**
   * Debug logging
   */
  private log(action: string, key: string, extra?: string): void {
    if (this.debug) {
      const msg = extra ? `${action} ${key} (${extra})` : `${action} ${key}`;
      console.log(`[MemoryCache] ${msg} - Stats: ${JSON.stringify(this.stats)}`);
    }
  }
}

/**
 * Create a memoization decorator for expensive functions
 */
export function memoize<T>(
  options: CacheOptions & { keyFn?: (...args: any[]) => string } = {}
) {
  const cache = new MemoryCache<T>(options);
  const keyFn = options.keyFn || ((...args: any[]) => JSON.stringify(args));

  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const key = `${propertyKey}:${keyFn(...args)}`;
      return cache.getOrCompute(key, () => originalMethod.apply(this, args));
    };

    return descriptor;
  };
}

/**
 * Global cache instances for different use cases
 */
export const caches = {
  /**
   * Short-lived cache for frequently accessed data (30 seconds)
   */
  shortLived: new MemoryCache({
    ttl: 30000,
    maxSize: 50,
    debug: process.env.NODE_ENV === 'development'
  }),

  /**
   * Medium-lived cache for expensive computations (2 minutes)
   */
  mediumLived: new MemoryCache({
    ttl: 120000,
    maxSize: 100,
    debug: process.env.NODE_ENV === 'development'
  }),

  /**
   * Long-lived cache for rarely changing data (5 minutes)
   */
  longLived: new MemoryCache({
    ttl: 300000,
    maxSize: 200,
    debug: process.env.NODE_ENV === 'development'
  })
};

/**
 * Bypass cache in development if enabled via env
 */
export function shouldBypassCache(): boolean {
  return process.env.BYPASS_MEMORY_CACHE === 'true' ||
         process.env.NODE_ENV === 'test';
}
