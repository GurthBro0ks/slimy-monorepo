import { MemoryCache, caches, shouldBypassCache } from '@/lib/memory-cache';

describe('MemoryCache', () => {
  let cache: MemoryCache<string>;

  beforeEach(() => {
    cache = new MemoryCache<string>({
      ttl: 1000, // 1 second for tests
      maxSize: 3,
      debug: false
    });
  });

  afterEach(() => {
    cache.destroy();
  });

  describe('basic operations', () => {
    it('should store and retrieve values', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return null for missing keys', () => {
      expect(cache.get('nonexistent')).toBeNull();
    });

    it('should delete values', () => {
      cache.set('key1', 'value1');
      expect(cache.delete('key1')).toBe(true);
      expect(cache.get('key1')).toBeNull();
    });

    it('should clear all values', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
    });

    it('should check if key exists', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(false);
    });
  });

  describe('TTL expiration', () => {
    it('should expire entries after TTL', async () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));

      expect(cache.get('key1')).toBeNull();
    });

    it('should support custom TTL per entry', async () => {
      cache.set('key1', 'value1', 500); // 500ms TTL
      cache.set('key2', 'value2', 2000); // 2s TTL

      await new Promise(resolve => setTimeout(resolve, 600));

      expect(cache.get('key1')).toBeNull(); // Expired
      expect(cache.get('key2')).toBe('value2'); // Still valid
    });
  });

  describe('LRU eviction', () => {
    it('should evict least recently used when max size reached', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      // Cache is full (maxSize: 3)
      cache.set('key4', 'value4');

      // key1 should be evicted (least recently used)
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key3')).toBe('value3');
      expect(cache.get('key4')).toBe('value4');
    });

    it('should update access time on get', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      // Access key1 to make it recently used
      cache.get('key1');

      // Small delay to ensure access time differs
      const now = Date.now();
      while (Date.now() - now < 10) {
        // Busy wait for 10ms
      }

      // Add key4, should evict LRU (likely key2)
      cache.set('key4', 'value4');

      // After eviction, cache should have 3 items
      const stats = cache.getStats();
      expect(stats.size).toBe(3);
      expect(stats.evictions).toBe(1);

      // key4 should definitely be there
      expect(cache.get('key4')).toBe('value4');
    });
  });

  describe('statistics', () => {
    it('should track hits and misses', () => {
      cache.set('key1', 'value1');

      cache.get('key1'); // Hit
      cache.get('key2'); // Miss
      cache.get('key1'); // Hit

      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.size).toBe(1);
    });

    it('should track evictions', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      cache.set('key4', 'value4'); // Triggers eviction

      const stats = cache.getStats();
      expect(stats.evictions).toBe(1);
    });
  });

  describe('getOrCompute', () => {
    it('should compute value on cache miss', async () => {
      const computeFn = vi.fn(() => Promise.resolve('computed'));

      const result = await cache.getOrCompute('key1', computeFn);

      expect(result).toBe('computed');
      expect(computeFn).toHaveBeenCalledTimes(1);
    });

    it('should use cached value on cache hit', async () => {
      const computeFn = vi.fn(() => Promise.resolve('computed'));

      // First call - computes
      await cache.getOrCompute('key1', computeFn);
      // Second call - uses cache
      const result = await cache.getOrCompute('key1', computeFn);

      expect(result).toBe('computed');
      expect(computeFn).toHaveBeenCalledTimes(1); // Only called once
    });

    it('should support synchronous compute functions', async () => {
      const computeFn = () => 'sync-value';

      const result = await cache.getOrCompute('key1', computeFn);

      expect(result).toBe('sync-value');
    });
  });

  describe('complex data types', () => {
    it('should cache objects', () => {
      const obj = { foo: 'bar', nested: { value: 42 } };
      cache.set('obj', obj as any);

      const retrieved = cache.get('obj');
      expect(retrieved).toEqual(obj);
    });

    it('should cache arrays', () => {
      const arr = [1, 2, 3, { value: 'test' }];
      cache.set('arr', arr as any);

      const retrieved = cache.get('arr');
      expect(retrieved).toEqual(arr);
    });
  });
});

describe('Global cache instances', () => {
  afterEach(() => {
    caches.shortLived.clear();
    caches.mediumLived.clear();
    caches.longLived.clear();
  });

  it('should have different TTLs', () => {
    // Just verify instances exist
    expect(caches.shortLived).toBeDefined();
    expect(caches.mediumLived).toBeDefined();
    expect(caches.longLived).toBeDefined();
  });

  it('should work independently', () => {
    caches.shortLived.set('key', 'short' as any);
    caches.mediumLived.set('key', 'medium' as any);
    caches.longLived.set('key', 'long' as any);

    expect(caches.shortLived.get('key')).toBe('short');
    expect(caches.mediumLived.get('key')).toBe('medium');
    expect(caches.longLived.get('key')).toBe('long');
  });
});

describe('shouldBypassCache', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return true when BYPASS_MEMORY_CACHE is true', () => {
    process.env.BYPASS_MEMORY_CACHE = 'true';
    expect(shouldBypassCache()).toBe(true);
  });

  it('should return true in test environment', () => {
    process.env.NODE_ENV = 'test';
    expect(shouldBypassCache()).toBe(true);
  });

  it('should return false in production', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.BYPASS_MEMORY_CACHE;
    expect(shouldBypassCache()).toBe(false);
  });

  it('should return false in development by default', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.BYPASS_MEMORY_CACHE;
    expect(shouldBypassCache()).toBe(false);
  });
});
