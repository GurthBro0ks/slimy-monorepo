class MockCache {
  async connect() {}
  async get(key) { return null; }
  async set(key, data, ttl, staleTtl) {}
  async staleWhileRevalidate(key, fetcher, ttl, staleTtl) { return fetcher(); }
  async invalidatePattern(pattern) {}
  async clear() {}
}

const getCache = () => new MockCache();
const CacheUtils = {
  apiKey: (url, query) => `${url}?${new URLSearchParams(query).toString()}`
};

module.exports = { getCache, CacheUtils };
