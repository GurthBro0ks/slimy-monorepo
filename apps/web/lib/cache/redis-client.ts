/**
 * Redis Client for Distributed Caching
 *
 * Provides a Redis client with fallback to in-memory caching
 * if Redis is not available
 */

import { createClient, RedisClientType } from 'redis';
import { env, hasRedis } from '../env';

/**
 * Cache interface for consistent API
 */
export interface CacheClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  expire(key: string, ttlSeconds: number): Promise<void>;
  ttl(key: string): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  flushAll(): Promise<void>;
  disconnect(): Promise<void>;
}

/**
 * In-memory cache fallback
 */
class InMemoryCache implements CacheClient {
  private cache: Map<string, { value: string; expiresAt?: number }>;
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.cache = new Map();

    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        this.cache.delete(key);
      }
    }
  }

  async get(key: string): Promise<string | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.cache.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    const entry = this.cache.get(key);
    if (entry) {
      entry.expiresAt = Date.now() + ttlSeconds * 1000;
    }
  }

  async ttl(key: string): Promise<number> {
    const entry = this.cache.get(key);
    if (!entry) return -2; // Key doesn't exist
    if (!entry.expiresAt) return -1; // Key exists but has no expiration

    const ttl = Math.floor((entry.expiresAt - Date.now()) / 1000);
    return ttl > 0 ? ttl : -2;
  }

  async keys(pattern: string): Promise<string[]> {
    // Simple pattern matching (only supports * wildcard)
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return Array.from(this.cache.keys()).filter((key) => regex.test(key));
  }

  async flushAll(): Promise<void> {
    this.cache.clear();
  }

  async disconnect(): Promise<void> {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

/**
 * Redis cache implementation
 */
class RedisCache implements CacheClient {
  private client: RedisClientType;
  private connected: boolean = false;

  constructor(client: RedisClientType) {
    this.client = client;
  }

  async connect(): Promise<void> {
    if (this.connected) return;

    try {
      await this.client.connect();
      this.connected = true;
      console.log('✅ Redis connected');
    } catch (error) {
      console.error('❌ Redis connection failed:', error);
      throw error;
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      console.error('Redis SET error:', error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Redis DEL error:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis EXISTS error:', error);
      return false;
    }
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    try {
      await this.client.expire(key, ttlSeconds);
    } catch (error) {
      console.error('Redis EXPIRE error:', error);
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      console.error('Redis TTL error:', error);
      return -2;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      console.error('Redis KEYS error:', error);
      return [];
    }
  }

  async flushAll(): Promise<void> {
    try {
      await this.client.flushAll();
    } catch (error) {
      console.error('Redis FLUSHALL error:', error);
    }
  }

  async disconnect(): Promise<void> {
    if (this.connected) {
      await this.client.disconnect();
      this.connected = false;
    }
  }
}

/**
 * Create Redis client
 */
function createRedisClient(): RedisClientType {
  const redisUrl = env.REDIS_URL;

  if (redisUrl) {
    return createClient({ url: redisUrl });
  }

  // Use individual settings
  return createClient({
    socket: {
      host: env.REDIS_HOST || 'localhost',
      port: env.REDIS_PORT || 6379,
    },
    password: env.REDIS_PASSWORD,
  });
}

// Singleton instances
let cacheClientInstance: CacheClient | null = null;

/**
 * Get cache client (Redis or in-memory fallback)
 */
export async function getCacheClient(): Promise<CacheClient> {
  if (cacheClientInstance) {
    return cacheClientInstance;
  }

  // Try Redis if configured
  if (hasRedis()) {
    try {
      const redisClient = createRedisClient();
      const redisCache = new RedisCache(redisClient);
      await redisCache.connect();
      cacheClientInstance = redisCache;
      console.log('✅ Using Redis for caching');
      return cacheClientInstance;
    } catch (error) {
      console.warn('⚠️  Redis connection failed, falling back to in-memory cache');
    }
  }

  // Fallback to in-memory cache
  console.log('ℹ️  Using in-memory cache (not suitable for production)');
  cacheClientInstance = new InMemoryCache();
  return cacheClientInstance;
}

/**
 * Cache helper with JSON serialization
 */
export class CacheHelper {
  private client: CacheClient;

  constructor(client: CacheClient) {
    this.client = client;
  }

  /**
   * Get and parse JSON value
   */
  async getJSON<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Failed to parse JSON from cache:', error);
      return null;
    }
  }

  /**
   * Set JSON value
   */
  async setJSON<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const json = JSON.stringify(value);
    await this.client.set(key, json, ttlSeconds);
  }

  /**
   * Get or compute value
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds?: number
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.getJSON<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch and cache
    const value = await fetchFn();
    await this.setJSON(key, value, ttlSeconds);
    return value;
  }

  /**
   * Invalidate pattern
   */
  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.client.keys(pattern);
    await Promise.all(keys.map((key) => this.client.del(key)));
  }

  /**
   * Increment counter
   */
  async increment(key: string, by: number = 1, ttlSeconds?: number): Promise<number> {
    const current = await this.client.get(key);
    const newValue = (current ? parseInt(current, 10) : 0) + by;
    await this.client.set(key, newValue.toString(), ttlSeconds);
    return newValue;
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    return await this.client.exists(key);
  }

  /**
   * Delete key
   */
  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }
}

/**
 * Get cache helper instance
 */
export async function getCacheHelper(): Promise<CacheHelper> {
  const client = await getCacheClient();
  return new CacheHelper(client);
}

/**
 * Cache key builder helpers
 */
export const CacheKeys = {
  codes: (scope?: string) => scope ? `codes:${scope}` : 'codes:all',
  guild: (guildId: string) => `guild:${guildId}`,
  guildList: (limit: number, offset: number) => `guilds:list:${limit}:${offset}`,
  guildMembers: (guildId: string, limit: number, offset: number) =>
    `guild:${guildId}:members:${limit}:${offset}`,
  health: () => 'health:status',
  diagnostics: () => 'diagnostics:status',
  userSession: (userId: string) => `session:${userId}`,
  userPreferences: (userId: string) => `preferences:${userId}`,
  rateLimit: (key: string) => `ratelimit:${key}`,
} as const;
