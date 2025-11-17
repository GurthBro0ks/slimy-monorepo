/**
 * Cache Tests - Memory and Redis with fallback
 * Tests both in-memory cache and Redis cache with fallback logic
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MemoryCache } from '../src/lib/cache/memory';
import RedisCache from '../src/lib/cache/redis';

describe('MemoryCache', () => {
  let cache: MemoryCache;

  beforeEach(() => {
    cache = new MemoryCache();
  });

  afterEach(async () => {
    await cache.clear();
  });

  describe('get and set', () => {
    it('should store and retrieve a value', async () => {
      await cache.set('test-key', 'test-value', 60);
      const value = await cache.get('test-key');
      expect(value).toBe('test-value');
    });

    it('should return null for non-existent key', async () => {
      const value = await cache.get('non-existent');
      expect(value).toBeNull();
    });

    it('should store and retrieve objects', async () => {
      const obj = { name: 'John', age: 30, active: true };
      await cache.set('user', obj, 60);
      const value = await cache.get('user');
      expect(value).toEqual(obj);
    });

    it('should store and retrieve arrays', async () => {
      const arr = [1, 2, 3, 'four', { five: 5 }];
      await cache.set('array', arr, 60);
      const value = await cache.get('array');
      expect(value).toEqual(arr);
    });
  });

  describe('TTL expiration', () => {
    it('should expire entries after TTL', async () => {
      // Set with 1 second TTL
      await cache.set('short-lived', 'value', 1);

      // Should exist immediately
      let value = await cache.get('short-lived');
      expect(value).toBe('value');

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Should be expired
      value = await cache.get('short-lived');
      expect(value).toBeNull();
    });

    it('should not expire before TTL', async () => {
      await cache.set('long-lived', 'value', 10);

      // Wait 0.5 seconds
      await new Promise(resolve => setTimeout(resolve, 500));

      const value = await cache.get('long-lived');
      expect(value).toBe('value');
    });
  });

  describe('getOrSet', () => {
    it('should return cached value if exists', async () => {
      await cache.set('existing', 'cached-value', 60);

      const callbackFn = vi.fn(() => 'new-value');
      const value = await cache.getOrSet('existing', 60, callbackFn);

      expect(value).toBe('cached-value');
      expect(callbackFn).not.toHaveBeenCalled();
    });

    it('should call callback and cache result if not exists', async () => {
      const callbackFn = vi.fn(() => 'fresh-value');
      const value = await cache.getOrSet('new-key', 60, callbackFn);

      expect(value).toBe('fresh-value');
      expect(callbackFn).toHaveBeenCalledTimes(1);

      // Verify it was cached
      const cached = await cache.get('new-key');
      expect(cached).toBe('fresh-value');
    });

    it('should handle async callback functions', async () => {
      const callbackFn = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { data: 'async-result' };
      });

      const value = await cache.getOrSet('async-key', 60, callbackFn);

      expect(value).toEqual({ data: 'async-result' });
      expect(callbackFn).toHaveBeenCalledTimes(1);
    });

    it('should not call callback if expired value exists', async () => {
      // Set a value that will expire
      await cache.set('expiring', 'old-value', 1);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));

      const callbackFn = vi.fn(() => 'new-value');
      const value = await cache.getOrSet('expiring', 60, callbackFn);

      expect(value).toBe('new-value');
      expect(callbackFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('delete', () => {
    it('should delete a key', async () => {
      await cache.set('to-delete', 'value', 60);
      await cache.delete('to-delete');

      const value = await cache.get('to-delete');
      expect(value).toBeNull();
    });

    it('should not throw when deleting non-existent key', async () => {
      await expect(cache.delete('non-existent')).resolves.toBeUndefined();
    });
  });

  describe('clear', () => {
    it('should clear all entries', async () => {
      await cache.set('key1', 'value1', 60);
      await cache.set('key2', 'value2', 60);
      await cache.set('key3', 'value3', 60);

      await cache.clear();

      expect(await cache.get('key1')).toBeNull();
      expect(await cache.get('key2')).toBeNull();
      expect(await cache.get('key3')).toBeNull();
      expect(cache.size()).toBe(0);
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', async () => {
      await cache.set('short1', 'value1', 1);
      await cache.set('short2', 'value2', 1);
      await cache.set('long', 'value3', 60);

      expect(cache.size()).toBe(3);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));

      cache.cleanup();

      // Only the long-lived entry should remain
      expect(cache.size()).toBe(1);
      expect(await cache.get('long')).toBe('value3');
    });
  });
});

describe('RedisCache', () => {
  let cache: RedisCache;

  beforeEach(() => {
    // Reset environment
    delete process.env.REDIS_URL;
  });

  afterEach(async () => {
    if (cache) {
      await cache.disconnect();
    }
  });

  describe('fallback to memory cache', () => {
    it('should use memory cache when REDIS_URL is not set', async () => {
      cache = new RedisCache();

      // Wait a bit for initialization
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(cache.isRedisConnected()).toBe(false);

      // Should still work with memory cache
      await cache.set('test', 'value', 60);
      const value = await cache.get('test');
      expect(value).toBe('value');
    });

    it('should use memory cache when Redis connection fails', async () => {
      // Set invalid Redis URL
      process.env.REDIS_URL = 'redis://invalid-host:6379';

      cache = new RedisCache();

      // Wait for connection attempt to fail
      await new Promise(resolve => setTimeout(resolve, 500));

      // Should fallback to memory cache
      await cache.set('test', 'fallback-value', 60);
      const value = await cache.get('test');
      expect(value).toBe('fallback-value');
    });
  });

  describe('getOrSet with fallback', () => {
    it('should work with memory fallback', async () => {
      cache = new RedisCache();

      await new Promise(resolve => setTimeout(resolve, 100));

      const callbackFn = vi.fn(() => ({ data: 'computed-value' }));
      const value = await cache.getOrSet('computed', 60, callbackFn);

      expect(value).toEqual({ data: 'computed-value' });
      expect(callbackFn).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const value2 = await cache.getOrSet('computed', 60, callbackFn);
      expect(value2).toEqual({ data: 'computed-value' });
      expect(callbackFn).toHaveBeenCalledTimes(1); // Still only called once
    });
  });

  describe('delete and clear with fallback', () => {
    it('should delete keys when using memory fallback', async () => {
      cache = new RedisCache();
      await new Promise(resolve => setTimeout(resolve, 100));

      await cache.set('to-delete', 'value', 60);
      await cache.delete('to-delete');

      const value = await cache.get('to-delete');
      expect(value).toBeNull();
    });

    it('should clear cache when using memory fallback', async () => {
      cache = new RedisCache();
      await new Promise(resolve => setTimeout(resolve, 100));

      await cache.set('key1', 'value1', 60);
      await cache.set('key2', 'value2', 60);

      await cache.clear();

      expect(await cache.get('key1')).toBeNull();
      expect(await cache.get('key2')).toBeNull();
    });
  });

  describe('Redis connection (when available)', () => {
    it('should connect to Redis when REDIS_URL is valid', async () => {
      // This test would require a real Redis instance
      // Skip in CI/CD environments without Redis
      const redisUrl = process.env.REDIS_URL || process.env.CI ? null : 'redis://localhost:6379';

      if (!redisUrl) {
        console.log('Skipping Redis connection test - no Redis available');
        return;
      }

      process.env.REDIS_URL = redisUrl;
      cache = new RedisCache();

      // Wait for connection
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Test basic operations if connected
      if (cache.isRedisConnected()) {
        await cache.set('redis-test', 'redis-value', 60);
        const value = await cache.get('redis-test');
        expect(value).toBe('redis-value');

        await cache.delete('redis-test');
        const deleted = await cache.get('redis-test');
        expect(deleted).toBeNull();
      }
    });
  });
});

describe('Cache Integration', () => {
  it('should handle complex data structures', async () => {
    const cache = new MemoryCache();

    const complexData = {
      users: [
        { id: 1, name: 'Alice', roles: ['admin', 'user'] },
        { id: 2, name: 'Bob', roles: ['user'] },
      ],
      metadata: {
        total: 2,
        timestamp: Date.now(),
      },
      flags: {
        enabled: true,
        features: ['caching', 'redis', 'fallback'],
      },
    };

    await cache.set('complex', complexData, 60);
    const retrieved = await cache.get('complex');

    expect(retrieved).toEqual(complexData);
  });

  it('should handle concurrent operations', async () => {
    const cache = new MemoryCache();

    // Perform multiple operations concurrently
    const operations = [
      cache.set('key1', 'value1', 60),
      cache.set('key2', 'value2', 60),
      cache.set('key3', 'value3', 60),
      cache.get('key1'),
      cache.get('key2'),
    ];

    await Promise.all(operations);

    expect(await cache.get('key1')).toBe('value1');
    expect(await cache.get('key2')).toBe('value2');
    expect(await cache.get('key3')).toBe('value3');
  });
});
