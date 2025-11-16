import { RedisClientType, createClient } from "redis";

/**
 * Cache configuration
 */
export interface CacheConfig {
  enabled: boolean;
  url?: string;
  ttl: number;
  staleTtl?: number;
  keyPrefix: string;
  retryAttempts: number;
  retryDelay: number;
}

/**
 * Default cache configuration
 */
const DEFAULT_CONFIG: CacheConfig = {
  enabled: process.env.REDIS_URL ? true : false,
  url: process.env.REDIS_URL,
  ttl: 300, // 5 minutes
  staleTtl: 600, // 10 minutes for stale data
  keyPrefix: "codes:",
  retryAttempts: 3,
  retryDelay: 1000,
};

/**
 * Cached data with metadata
 */
interface CachedData<T> {
  data: T;
  timestamp: string;
  ttl: number;
  source: string;
}

/**
 * Redis-based cache for codes data
 */
export class CodesCache {
  private client: RedisClientType | null = null;
  private config: CacheConfig;
  private connected: boolean = false;

  constructor(config?: Partial<CacheConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize the Redis connection
   */
  async connect(): Promise<void> {
    if (!this.config.enabled || !this.config.url) {
      console.info("Redis cache disabled or no URL configured");
      return;
    }

    if (this.client && this.connected) {
      return; // Already connected
    }

    try {
      this.client = createClient({
        url: this.config.url,
        socket: {
          connectTimeout: 5000,
        },
      });

      this.client.on("error", (err) => {
        console.error("Redis client error:", err);
        this.connected = false;
      });

      this.client.on("connect", () => {
        console.info("Redis cache connected");
        this.connected = true;
      });

      this.client.on("disconnect", () => {
        console.info("Redis cache disconnected");
        this.connected = false;
      });

      await this.client.connect();
    } catch (error) {
      console.error("Failed to connect to Redis:", error);
      this.connected = false;
      throw error;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.disconnect();
      } catch (error) {
        console.error("Error disconnecting from Redis:", error);
      } finally {
        this.client = null;
        this.connected = false;
      }
    }
  }

  /**
   * Check if cache is available
   */
  isAvailable(): boolean {
    return this.config.enabled && this.connected && !!this.client;
  }

  /**
   * Get cached data with retry logic
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isAvailable()) {
      return null;
    }

    const fullKey = this.getFullKey(key);

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const data = await this.client!.get(fullKey);
        if (data) {
          const parsed: CachedData<T> = JSON.parse(data);
          return parsed.data;
        }
        return null;
      } catch (error) {
        console.warn(`Cache get attempt ${attempt} failed:`, error);

        if (attempt === this.config.retryAttempts) {
          console.error(`Cache get failed after ${this.config.retryAttempts} attempts`);
          return null;
        }

        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
      }
    }

    return null;
  }

  /**
   * Set cached data with retry logic
   */
  async set<T>(key: string, data: T, ttl?: number): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    const fullKey = this.getFullKey(key);
    const cacheData: CachedData<T> = {
      data,
      timestamp: new Date().toISOString(),
      ttl: ttl || this.config.ttl,
      source: "cache",
    };

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        await this.client!.setEx(fullKey, ttl || this.config.ttl, JSON.stringify(cacheData));
        return true;
      } catch (error) {
        console.warn(`Cache set attempt ${attempt} failed:`, error);

        if (attempt === this.config.retryAttempts) {
          console.error(`Cache set failed after ${this.config.retryAttempts} attempts`);
          return false;
        }

        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
      }
    }

    return false;
  }

  /**
   * Delete cached data
   */
  async delete(key: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    const fullKey = this.getFullKey(key);

    try {
      await this.client!.del(fullKey);
      return true;
    } catch (error) {
      console.error("Cache delete failed:", error);
      return false;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    const fullKey = this.getFullKey(key);

    try {
      const result = await this.client!.exists(fullKey);
      return result === 1;
    } catch (error) {
      console.error("Cache exists check failed:", error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    available: boolean;
    connected: boolean;
    enabled: boolean;
    keys?: number;
  }> {
    const stats = {
      available: this.isAvailable(),
      connected: this.connected,
      enabled: this.config.enabled,
    };

    if (this.isAvailable()) {
      try {
        const keys = await this.client!.keys(`${this.config.keyPrefix}*`);
        return { ...stats, keys: keys.length };
      } catch (error) {
        console.error("Failed to get cache stats:", error);
      }
    }

    return stats;
  }

  /**
   * Clear all cached data
   */
  async clear(): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const keys = await this.client!.keys(`${this.config.keyPrefix}*`);
      if (keys.length > 0) {
        await this.client!.del(keys);
      }
      return true;
    } catch (error) {
      console.error("Cache clear failed:", error);
      return false;
    }
  }

  /**
   * Get full key with prefix
   */
  private getFullKey(key: string): string {
    return `${this.config.keyPrefix}${key}`;
  }
}

/**
 * Singleton cache instance
 */
let cacheInstance: CodesCache | null = null;

/**
 * Get the global cache instance
 */
export function getCache(config?: Partial<CacheConfig>): CodesCache {
  if (!cacheInstance) {
    cacheInstance = new CodesCache(config);
  }
  return cacheInstance;
}

/**
 * Cache keys for different data types
 */
export const CacheKeys = {
  aggregatedCodes: "aggregated_codes",
  sourceResult: (source: string) => `source_${source}`,
  sourceHealth: (source: string) => `health_${source}`,
} as const;
