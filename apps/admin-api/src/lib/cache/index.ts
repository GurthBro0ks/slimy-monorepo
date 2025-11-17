/**
 * Cache module exports
 * Provides easy access to both Redis and Memory cache implementations
 */

export { MemoryCache, memoryCache } from './memory';
export { RedisCache, redisCache } from './redis';
export default { redisCache: require('./redis').redisCache, memoryCache: require('./memory').memoryCache };
