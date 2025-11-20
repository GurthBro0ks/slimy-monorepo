/**
 * OpenAI Request Queue with Rate Limiting
 *
 * Provides per-user rate limiting for OpenAI requests using:
 * - Redis for distributed rate limiting (production)
 * - In-memory storage as fallback (development)
 */

/**
 * Queue entry for tracking user requests
 */
interface QueueEntry {
  userId: string;
  timestamp: number;
  requestCount: number;
  windowStart: number;
}

/**
 * Rate limit configuration
 */
interface RateLimitConfig {
  maxRequestsPerWindow: number;
  windowMs: number; // Time window in milliseconds
}

/**
 * Default rate limits: 10 requests per minute per user
 */
const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  maxRequestsPerWindow: 10,
  windowMs: 60000, // 1 minute
};

/**
 * Queue storage interface
 */
interface QueueStorage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  increment(key: string, ttlSeconds?: number): Promise<number>;
}

/**
 * Redis storage adapter
 */
class RedisStorage implements QueueStorage {
  private redis: any; // Redis client type

  constructor(redisClient: any) {
    this.redis = redisClient;
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.redis.get(key);
    } catch (error) {
      console.error('[redis-storage] GET error:', error);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds) {
        await this.redis.setEx(key, ttlSeconds, value);
      } else {
        await this.redis.set(key, value);
      }
    } catch (error) {
      console.error('[redis-storage] SET error:', error);
    }
  }

  async increment(key: string, ttlSeconds?: number): Promise<number> {
    try {
      const newValue = await this.redis.incr(key);
      if (ttlSeconds && newValue === 1) {
        // Set TTL only on first increment
        await this.redis.expire(key, ttlSeconds);
      }
      return newValue;
    } catch (error) {
      console.error('[redis-storage] INCR error:', error);
      throw error;
    }
  }
}

/**
 * In-memory storage adapter (fallback)
 */
class MemoryStorage implements QueueStorage {
  private store: Map<string, { value: string; expiresAt?: number }>;
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.store = new Map();

    // Cleanup expired entries every 30 seconds
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 30000);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        this.store.delete(key);
      }
    }
  }

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    // Check expiration
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.store.set(key, { value, expiresAt });
  }

  async increment(key: string, ttlSeconds?: number): Promise<number> {
    const current = await this.get(key);
    const newValue = (current ? parseInt(current, 10) : 0) + 1;
    await this.set(key, newValue.toString(), ttlSeconds);
    return newValue;
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // Unix timestamp (ms)
  retryAfter?: number; // Seconds to wait before retrying
}

/**
 * OpenAI Request Queue
 */
export class OpenAIQueue {
  private storage: QueueStorage;
  private config: RateLimitConfig;

  constructor(storage: QueueStorage, config: Partial<RateLimitConfig> = {}) {
    this.storage = storage;
    this.config = { ...DEFAULT_RATE_LIMIT, ...config };
  }

  /**
   * Enqueue a request for a user with rate limiting
   *
   * @param userId - User identifier
   * @returns Rate limit result indicating if request is allowed
   */
  async enqueueRequest(userId: string): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStartKey = this.getWindowStartKey(userId);
    const countKey = this.getCountKey(userId);

    // Get or set window start time
    let windowStartStr = await this.storage.get(windowStartKey);
    let windowStart: number;

    if (!windowStartStr) {
      // Start new window
      windowStart = now;
      await this.storage.set(
        windowStartKey,
        windowStart.toString(),
        Math.ceil(this.config.windowMs / 1000)
      );
      await this.storage.set(countKey, '0', Math.ceil(this.config.windowMs / 1000));
    } else {
      windowStart = parseInt(windowStartStr, 10);
    }

    // Check if window has expired
    const windowEnd = windowStart + this.config.windowMs;
    if (now >= windowEnd) {
      // Reset window
      windowStart = now;
      await this.storage.set(
        windowStartKey,
        windowStart.toString(),
        Math.ceil(this.config.windowMs / 1000)
      );
      await this.storage.set(countKey, '0', Math.ceil(this.config.windowMs / 1000));
    }

    // Get current count
    const countStr = await this.storage.get(countKey);
    const currentCount = countStr ? parseInt(countStr, 10) : 0;

    // Check rate limit
    if (currentCount >= this.config.maxRequestsPerWindow) {
      const resetAt = windowStart + this.config.windowMs;
      const retryAfter = Math.ceil((resetAt - now) / 1000);

      return {
        allowed: false,
        remaining: 0,
        resetAt,
        retryAfter,
      };
    }

    // Increment count
    const newCount = await this.storage.increment(
      countKey,
      Math.ceil(this.config.windowMs / 1000)
    );

    return {
      allowed: true,
      remaining: Math.max(0, this.config.maxRequestsPerWindow - newCount),
      resetAt: windowStart + this.config.windowMs,
    };
  }

  /**
   * Check rate limit status without incrementing
   *
   * @param userId - User identifier
   * @returns Current rate limit status
   */
  async checkRateLimit(userId: string): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStartKey = this.getWindowStartKey(userId);
    const countKey = this.getCountKey(userId);

    const windowStartStr = await this.storage.get(windowStartKey);
    const countStr = await this.storage.get(countKey);

    if (!windowStartStr || !countStr) {
      return {
        allowed: true,
        remaining: this.config.maxRequestsPerWindow,
        resetAt: now + this.config.windowMs,
      };
    }

    const windowStart = parseInt(windowStartStr, 10);
    const currentCount = parseInt(countStr, 10);
    const windowEnd = windowStart + this.config.windowMs;

    // Check if window expired
    if (now >= windowEnd) {
      return {
        allowed: true,
        remaining: this.config.maxRequestsPerWindow,
        resetAt: now + this.config.windowMs,
      };
    }

    const remaining = Math.max(0, this.config.maxRequestsPerWindow - currentCount);
    const allowed = currentCount < this.config.maxRequestsPerWindow;

    return {
      allowed,
      remaining,
      resetAt: windowEnd,
      retryAfter: allowed ? undefined : Math.ceil((windowEnd - now) / 1000),
    };
  }

  /**
   * Reset rate limit for a user (for testing or admin override)
   *
   * @param userId - User identifier
   */
  async resetRateLimit(userId: string): Promise<void> {
    const windowStartKey = this.getWindowStartKey(userId);
    const countKey = this.getCountKey(userId);

    await this.storage.set(windowStartKey, '0', 1);
    await this.storage.set(countKey, '0', 1);
  }

  private getWindowStartKey(userId: string): string {
    return `openai:ratelimit:${userId}:window`;
  }

  private getCountKey(userId: string): string {
    return `openai:ratelimit:${userId}:count`;
  }
}

// Singleton instance
let queueInstance: OpenAIQueue | null = null;

/**
 * Get OpenAI queue instance
 *
 * Automatically uses Redis if available, otherwise falls back to in-memory storage
 *
 * @param config - Optional rate limit configuration
 * @returns OpenAI queue instance
 */
export async function getOpenAIQueue(
  config?: Partial<RateLimitConfig>
): Promise<OpenAIQueue> {
  if (queueInstance) {
    return queueInstance;
  }

  // Try to use Redis if available
  let storage: QueueStorage;

  try {
    // Try to import and use Redis from the web app
    // This is a dynamic import to avoid errors if Redis is not available
    const redisModule = await import('../../apps/web/lib/cache/redis-client.js');
    const cacheClient = await redisModule.getCacheClient();

    storage = new RedisStorage(cacheClient);
    console.log('✅ OpenAI queue using Redis storage');
  } catch (error) {
    console.warn('⚠️  Redis not available, using in-memory storage for OpenAI queue');
    storage = new MemoryStorage();
  }

  queueInstance = new OpenAIQueue(storage, config);
  return queueInstance;
}

/**
 * Create a new queue instance (useful for testing with custom storage)
 *
 * @param storage - Custom storage implementation
 * @param config - Rate limit configuration
 * @returns New queue instance
 */
export function createOpenAIQueue(
  storage: QueueStorage,
  config?: Partial<RateLimitConfig>
): OpenAIQueue {
  return new OpenAIQueue(storage, config);
}
