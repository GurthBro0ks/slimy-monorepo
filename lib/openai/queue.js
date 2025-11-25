"use strict";
/**
 * OpenAI Request Queue with Rate Limiting
 *
 * Provides per-user rate limiting for OpenAI requests using:
 * - Redis for distributed rate limiting (production)
 * - In-memory storage as fallback (development)
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIQueue = void 0;
exports.getOpenAIQueue = getOpenAIQueue;
exports.createOpenAIQueue = createOpenAIQueue;
/**
 * Default rate limits: 10 requests per minute per user
 */
const DEFAULT_RATE_LIMIT = {
    maxRequestsPerWindow: 10,
    windowMs: 60000, // 1 minute
};
/**
 * Redis storage adapter
 */
class RedisStorage {
    constructor(redisClient) {
        this.redis = redisClient;
    }
    async get(key) {
        try {
            return await this.redis.get(key);
        }
        catch (error) {
            console.error('[redis-storage] GET error:', error);
            return null;
        }
    }
    async set(key, value, ttlSeconds) {
        try {
            if (ttlSeconds) {
                await this.redis.setEx(key, ttlSeconds, value);
            }
            else {
                await this.redis.set(key, value);
            }
        }
        catch (error) {
            console.error('[redis-storage] SET error:', error);
        }
    }
    async increment(key, ttlSeconds) {
        try {
            const newValue = await this.redis.incr(key);
            if (ttlSeconds && newValue === 1) {
                // Set TTL only on first increment
                await this.redis.expire(key, ttlSeconds);
            }
            return newValue;
        }
        catch (error) {
            console.error('[redis-storage] INCR error:', error);
            throw error;
        }
    }
}
/**
 * In-memory storage adapter (fallback)
 */
class MemoryStorage {
    constructor() {
        this.store = new Map();
        // Cleanup expired entries every 30 seconds
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 30000);
    }
    cleanup() {
        const now = Date.now();
        for (const [key, entry] of this.store.entries()) {
            if (entry.expiresAt && entry.expiresAt < now) {
                this.store.delete(key);
            }
        }
    }
    async get(key) {
        const entry = this.store.get(key);
        if (!entry)
            return null;
        // Check expiration
        if (entry.expiresAt && entry.expiresAt < Date.now()) {
            this.store.delete(key);
            return null;
        }
        return entry.value;
    }
    async set(key, value, ttlSeconds) {
        const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
        this.store.set(key, { value, expiresAt });
    }
    async increment(key, ttlSeconds) {
        const current = await this.get(key);
        const newValue = (current ? parseInt(current, 10) : 0) + 1;
        await this.set(key, newValue.toString(), ttlSeconds);
        return newValue;
    }
    destroy() {
        clearInterval(this.cleanupInterval);
        this.store.clear();
    }
}
/**
 * OpenAI Request Queue
 */
class OpenAIQueue {
    constructor(storage, config = {}) {
        this.storage = storage;
        this.config = { ...DEFAULT_RATE_LIMIT, ...config };
    }
    /**
     * Enqueue a request for a user with rate limiting
     *
     * @param userId - User identifier
     * @returns Rate limit result indicating if request is allowed
     */
    async enqueueRequest(userId) {
        const now = Date.now();
        const windowStartKey = this.getWindowStartKey(userId);
        const countKey = this.getCountKey(userId);
        // Get or set window start time
        let windowStartStr = await this.storage.get(windowStartKey);
        let windowStart;
        if (!windowStartStr) {
            // Start new window
            windowStart = now;
            await this.storage.set(windowStartKey, windowStart.toString(), Math.ceil(this.config.windowMs / 1000));
            await this.storage.set(countKey, '0', Math.ceil(this.config.windowMs / 1000));
        }
        else {
            windowStart = parseInt(windowStartStr, 10);
        }
        // Check if window has expired
        const windowEnd = windowStart + this.config.windowMs;
        if (now >= windowEnd) {
            // Reset window
            windowStart = now;
            await this.storage.set(windowStartKey, windowStart.toString(), Math.ceil(this.config.windowMs / 1000));
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
        const newCount = await this.storage.increment(countKey, Math.ceil(this.config.windowMs / 1000));
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
    async checkRateLimit(userId) {
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
    async resetRateLimit(userId) {
        const windowStartKey = this.getWindowStartKey(userId);
        const countKey = this.getCountKey(userId);
        await this.storage.set(windowStartKey, '0', 1);
        await this.storage.set(countKey, '0', 1);
    }
    getWindowStartKey(userId) {
        return `openai:ratelimit:${userId}:window`;
    }
    getCountKey(userId) {
        return `openai:ratelimit:${userId}:count`;
    }
}
exports.OpenAIQueue = OpenAIQueue;
// Singleton instance
let queueInstance = null;
/**
 * Get OpenAI queue instance
 *
 * Automatically uses Redis if available, otherwise falls back to in-memory storage
 *
 * @param config - Optional rate limit configuration
 * @returns OpenAI queue instance
 */
async function getOpenAIQueue(config) {
    if (queueInstance) {
        return queueInstance;
    }
    // Try to use Redis if available
    let storage;
    try {
        // Try to import and use Redis from the web app
        // This is a dynamic import to avoid errors if Redis is not available
        const redisModule = await Promise.resolve().then(() => __importStar(require('../../apps/web/lib/cache/redis-client.js')));
        const cacheClient = await redisModule.getCacheClient();
        storage = new RedisStorage(cacheClient);
        console.log('✅ OpenAI queue using Redis storage');
    }
    catch (error) {
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
function createOpenAIQueue(storage, config) {
    return new OpenAIQueue(storage, config);
}
