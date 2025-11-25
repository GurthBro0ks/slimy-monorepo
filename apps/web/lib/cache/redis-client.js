"use strict";
/**
 * Redis Client for Distributed Caching
 *
 * Provides a Redis client with fallback to in-memory caching
 * if Redis is not available
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheKeys = exports.CacheHelper = void 0;
exports.getCacheClient = getCacheClient;
exports.getCacheHelper = getCacheHelper;
const redis_1 = require("redis");
const env_1 = require("../env");
/**
 * In-memory cache fallback
 */
class InMemoryCache {
    constructor() {
        this.cache = new Map();
        // Cleanup expired entries every minute
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 60000);
    }
    cleanup() {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (entry.expiresAt && entry.expiresAt < now) {
                this.cache.delete(key);
            }
        }
    }
    async get(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return null;
        // Check if expired
        if (entry.expiresAt && entry.expiresAt < Date.now()) {
            this.cache.delete(key);
            return null;
        }
        return entry.value;
    }
    async set(key, value, ttlSeconds) {
        const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
        this.cache.set(key, { value, expiresAt });
    }
    async del(key) {
        this.cache.delete(key);
    }
    async exists(key) {
        const value = await this.get(key);
        return value !== null;
    }
    async expire(key, ttlSeconds) {
        const entry = this.cache.get(key);
        if (entry) {
            entry.expiresAt = Date.now() + ttlSeconds * 1000;
        }
    }
    async ttl(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return -2; // Key doesn't exist
        if (!entry.expiresAt)
            return -1; // Key exists but has no expiration
        const ttl = Math.floor((entry.expiresAt - Date.now()) / 1000);
        return ttl > 0 ? ttl : -2;
    }
    async keys(pattern) {
        // Simple pattern matching (only supports * wildcard)
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        return Array.from(this.cache.keys()).filter((key) => regex.test(key));
    }
    async flushAll() {
        this.cache.clear();
    }
    async disconnect() {
        clearInterval(this.cleanupInterval);
        this.cache.clear();
    }
}
/**
 * Redis cache implementation
 */
class RedisCache {
    constructor(client) {
        this.connected = false;
        this.client = client;
    }
    async connect() {
        if (this.connected)
            return;
        try {
            await this.client.connect();
            this.connected = true;
            console.log('✅ Redis connected');
        }
        catch (error) {
            console.error('❌ Redis connection failed:', error);
            throw error;
        }
    }
    async get(key) {
        try {
            return await this.client.get(key);
        }
        catch (error) {
            console.error('Redis GET error:', error);
            return null;
        }
    }
    async set(key, value, ttlSeconds) {
        try {
            if (ttlSeconds) {
                await this.client.setEx(key, ttlSeconds, value);
            }
            else {
                await this.client.set(key, value);
            }
        }
        catch (error) {
            console.error('Redis SET error:', error);
        }
    }
    async del(key) {
        try {
            await this.client.del(key);
        }
        catch (error) {
            console.error('Redis DEL error:', error);
        }
    }
    async exists(key) {
        try {
            const result = await this.client.exists(key);
            return result === 1;
        }
        catch (error) {
            console.error('Redis EXISTS error:', error);
            return false;
        }
    }
    async expire(key, ttlSeconds) {
        try {
            await this.client.expire(key, ttlSeconds);
        }
        catch (error) {
            console.error('Redis EXPIRE error:', error);
        }
    }
    async ttl(key) {
        try {
            return await this.client.ttl(key);
        }
        catch (error) {
            console.error('Redis TTL error:', error);
            return -2;
        }
    }
    async keys(pattern) {
        try {
            return await this.client.keys(pattern);
        }
        catch (error) {
            console.error('Redis KEYS error:', error);
            return [];
        }
    }
    async flushAll() {
        try {
            await this.client.flushAll();
        }
        catch (error) {
            console.error('Redis FLUSHALL error:', error);
        }
    }
    async disconnect() {
        if (this.connected) {
            await this.client.disconnect();
            this.connected = false;
        }
    }
}
/**
 * Create Redis client
 */
function createRedisClient() {
    const redisUrl = env_1.env.REDIS_URL;
    if (redisUrl) {
        return (0, redis_1.createClient)({ url: redisUrl });
    }
    // Use individual settings
    return (0, redis_1.createClient)({
        socket: {
            host: env_1.env.REDIS_HOST || 'localhost',
            port: env_1.env.REDIS_PORT || 6379,
        },
        password: env_1.env.REDIS_PASSWORD,
    });
}
// Singleton instances
let cacheClientInstance = null;
/**
 * Get cache client (Redis or in-memory fallback)
 */
async function getCacheClient() {
    if (cacheClientInstance) {
        return cacheClientInstance;
    }
    // Try Redis if configured
    if ((0, env_1.hasRedis)()) {
        try {
            const redisClient = createRedisClient();
            const redisCache = new RedisCache(redisClient);
            await redisCache.connect();
            cacheClientInstance = redisCache;
            console.log('✅ Using Redis for caching');
            return cacheClientInstance;
        }
        catch (error) {
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
class CacheHelper {
    constructor(client) {
        this.client = client;
    }
    /**
     * Get and parse JSON value
     */
    async getJSON(key) {
        const value = await this.client.get(key);
        if (!value)
            return null;
        try {
            return JSON.parse(value);
        }
        catch (error) {
            console.error('Failed to parse JSON from cache:', error);
            return null;
        }
    }
    /**
     * Set JSON value
     */
    async setJSON(key, value, ttlSeconds) {
        const json = JSON.stringify(value);
        await this.client.set(key, json, ttlSeconds);
    }
    /**
     * Get or compute value
     */
    async getOrSet(key, fetchFn, ttlSeconds) {
        // Try to get from cache
        const cached = await this.getJSON(key);
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
    async invalidatePattern(pattern) {
        const keys = await this.client.keys(pattern);
        await Promise.all(keys.map((key) => this.client.del(key)));
    }
    /**
     * Increment counter
     */
    async increment(key, by = 1, ttlSeconds) {
        const current = await this.client.get(key);
        const newValue = (current ? parseInt(current, 10) : 0) + by;
        await this.client.set(key, newValue.toString(), ttlSeconds);
        return newValue;
    }
    /**
     * Check if key exists
     */
    async exists(key) {
        return await this.client.exists(key);
    }
    /**
     * Delete key
     */
    async delete(key) {
        await this.client.del(key);
    }
}
exports.CacheHelper = CacheHelper;
/**
 * Get cache helper instance
 */
async function getCacheHelper() {
    const client = await getCacheClient();
    return new CacheHelper(client);
}
/**
 * Cache key builder helpers
 */
exports.CacheKeys = {
    codes: (scope) => scope ? `codes:${scope}` : 'codes:all',
    guild: (guildId) => `guild:${guildId}`,
    guildList: (limit, offset) => `guilds:list:${limit}:${offset}`,
    guildMembers: (guildId, limit, offset) => `guild:${guildId}:members:${limit}:${offset}`,
    health: () => 'health:status',
    diagnostics: () => 'diagnostics:status',
    userSession: (userId) => `session:${userId}`,
    userPreferences: (userId) => `preferences:${userId}`,
    rateLimit: (key) => `ratelimit:${key}`,
};
