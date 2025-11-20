/**
 * Redis-backed caching utility with in-memory fallback
 * Connects to Redis via REDIS_URL environment variable
 */

import { createClient, RedisClientType } from 'redis';
import { memoryCache } from './memory';

export class RedisCache {
  private client: RedisClientType | null = null;
  private isConnected = false;
  private connectionAttempted = false;
  private useMemoryFallback = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize Redis connection
   */
  private async initialize(): Promise<void> {
    if (this.connectionAttempted) {
      return;
    }

    this.connectionAttempted = true;

    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      console.warn('[RedisCache] REDIS_URL not configured, falling back to in-memory cache');
      this.useMemoryFallback = true;
      return;
    }

    try {
      this.client = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            // Retry with exponential backoff up to 10 times
            if (retries > 10) {
              console.error('[RedisCache] Max reconnection attempts reached, falling back to in-memory cache');
              this.useMemoryFallback = true;
              return false; // Stop reconnecting
            }
            return Math.min(retries * 100, 3000);
          },
        },
      });

      // Handle connection errors
      this.client.on('error', (err) => {
        console.error('[RedisCache] Redis client error:', err.message);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('[RedisCache] Connected to Redis');
        this.isConnected = true;
        this.useMemoryFallback = false;
      });

      this.client.on('ready', () => {
        console.log('[RedisCache] Redis client ready');
        this.isConnected = true;
      });

      this.client.on('end', () => {
        console.log('[RedisCache] Redis connection closed');
        this.isConnected = false;
      });

      // Connect to Redis
      await this.client.connect();
    } catch (error) {
      console.error('[RedisCache] Failed to connect to Redis:', error);
      this.useMemoryFallback = true;
      this.client = null;
    }
  }

  /**
   * Ensure Redis is ready or fallback to memory
   */
  private async ensureConnection(): Promise<boolean> {
    if (!this.connectionAttempted) {
      await this.initialize();
    }

    if (this.useMemoryFallback || !this.client || !this.isConnected) {
      return false;
    }

    return true;
  }

  /**
   * Get a value from the cache
   * @param key Cache key
   * @returns The cached value or null if not found
   */
  async get<T = any>(key: string): Promise<T | null> {
    const isRedisReady = await this.ensureConnection();

    // Use memory cache fallback
    if (!isRedisReady) {
      return memoryCache.get<T>(key);
    }

    try {
      const value = await this.client!.get(key);

      if (value === null) {
        return null;
      }

      // Parse JSON value
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('[RedisCache] Error getting key:', error);
      // Fallback to memory cache on error
      return memoryCache.get<T>(key);
    }
  }

  /**
   * Set a value in the cache with TTL
   * @param key Cache key
   * @param value Value to cache (will be JSON stringified)
   * @param ttlSeconds Time to live in seconds
   */
  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    const isRedisReady = await this.ensureConnection();

    // Use memory cache fallback
    if (!isRedisReady) {
      return memoryCache.set(key, value, ttlSeconds);
    }

    try {
      const serialized = JSON.stringify(value);
      await this.client!.setEx(key, ttlSeconds, serialized);
    } catch (error) {
      console.error('[RedisCache] Error setting key:', error);
      // Fallback to memory cache on error
      return memoryCache.set(key, value, ttlSeconds);
    }
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
    const isRedisReady = await this.ensureConnection();

    if (!isRedisReady) {
      return memoryCache.delete(key);
    }

    try {
      await this.client!.del(key);
    } catch (error) {
      console.error('[RedisCache] Error deleting key:', error);
      // Also try to delete from memory cache
      return memoryCache.delete(key);
    }
  }

  /**
   * Clear all keys from the cache
   * WARNING: This will flush the entire Redis database
   */
  async clear(): Promise<void> {
    const isRedisReady = await this.ensureConnection();

    if (!isRedisReady) {
      return memoryCache.clear();
    }

    try {
      await this.client!.flushDb();
    } catch (error) {
      console.error('[RedisCache] Error clearing cache:', error);
    }
  }

  /**
   * Check if Redis is connected
   */
  isRedisConnected(): boolean {
    return this.isConnected && !this.useMemoryFallback;
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
    }
  }
}

// Export singleton instance
export const redisCache = new RedisCache();

// Export for testing/custom instances
export default RedisCache;
