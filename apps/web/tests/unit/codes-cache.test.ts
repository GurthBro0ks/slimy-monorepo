import { describe, it, expect, vi, beforeEach } from "vitest";
import { CodesCache, CacheKeys } from "@/lib/codes/cache";

// Mock redis
vi.mock("redis", () => ({
  createClient: vi.fn().mockReturnValue({
    on: vi.fn(),
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    get: vi.fn(),
    setEx: vi.fn(),
    del: vi.fn(),
    exists: vi.fn(),
    keys: vi.fn(),
  }),
}));

describe("CodesCache", () => {
  let cache: CodesCache;
  let mockRedisClient: any;

  beforeEach(() => {
    // Reset mocks
    mockRedisClient = {
      on: vi.fn(),
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      get: vi.fn(),
      setEx: vi.fn().mockResolvedValue("OK"),
      del: vi.fn().mockResolvedValue(1),
      exists: vi.fn().mockResolvedValue(1),
      keys: vi.fn().mockResolvedValue(["codes:test"]),
    };

    vi.clearAllMocks();
    cache = new CodesCache({ enabled: true });
    // Inject mock client
    (cache as any).client = mockRedisClient;
    (cache as any).connected = true;
    (cache as any).config.enabled = true;
  });

  describe("connection management", () => {
    it("should connect successfully", async () => {
      const cacheWithoutClient = new CodesCache({ enabled: true, url: "redis://localhost:6379" });
      await cacheWithoutClient.connect();

      expect(cacheWithoutClient.isAvailable()).toBe(true);
    });

    it("should handle connection failures", async () => {
      mockRedisClient.connect.mockRejectedValue(new Error("Connection failed"));

      const cacheWithoutClient = new CodesCache({ enabled: true, url: "redis://localhost:6379" });
      await expect(cacheWithoutClient.connect()).rejects.toThrow("Connection failed");

      expect(cacheWithoutClient.isAvailable()).toBe(false);
    });

    it("should disconnect gracefully", async () => {
      await cache.disconnect();

      expect(mockRedisClient.disconnect).toHaveBeenCalled();
    });
  });

  describe("cache operations", () => {
    it("should get cached data", async () => {
      const testData = { test: "data" };
      const cachedData = JSON.stringify({
        data: testData,
        timestamp: new Date().toISOString(),
        ttl: 300,
        source: "cache",
      });
      mockRedisClient.get.mockResolvedValue(cachedData);

      const result = await cache.get("test");

      expect(result).toEqual(testData);
      expect(mockRedisClient.get).toHaveBeenCalledWith("codes:test");
    });

    it("should return null for missing data", async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await cache.get("missing");

      expect(result).toBeNull();
    });

    it("should set cached data", async () => {
      const testData = { test: "data" };

      const result = await cache.set("test", testData, 300);

      expect(result).toBe(true);
      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        "codes:test",
        300,
        expect.stringContaining('"data":{"test":"data"}')
      );
    });

    it("should handle cache set failures", async () => {
      mockRedisClient.setEx.mockRejectedValue(new Error("Set failed"));

      const result = await cache.set("test", { test: "data" });

      expect(result).toBe(false);
    });

    it("should delete cached data", async () => {
      const result = await cache.delete("test");

      expect(result).toBe(true);
      expect(mockRedisClient.del).toHaveBeenCalledWith("codes:test");
    });

    it("should check if key exists", async () => {
      const result = await cache.exists("test");

      expect(result).toBe(true);
      expect(mockRedisClient.exists).toHaveBeenCalledWith("codes:test");
    });

    it("should get cache statistics", async () => {
      const stats = await cache.getStats();

      expect(stats).toBeDefined();
      expect(stats.available).toBe(true);
      expect(stats.connected).toBe(true);
      expect(stats.keys).toBe(1);
    });
  });

  describe("cache keys", () => {
    it("should generate correct cache keys", () => {
      expect(CacheKeys.aggregatedCodes).toBe("aggregated_codes");
      expect(CacheKeys.sourceResult("snelp")).toBe("source_snelp");
      expect(CacheKeys.sourceHealth("reddit")).toBe("health_reddit");
    });
  });

  describe("error handling", () => {
    it("should handle redis operation failures gracefully", async () => {
      mockRedisClient.get.mockRejectedValue(new Error("Redis error"));

      const result = await cache.get("test");

      expect(result).toBeNull();
    });

    it("should retry operations on failure", async () => {
      const testData = { test: "data" };
      const cachedData = JSON.stringify({
        data: testData,
        timestamp: new Date().toISOString(),
        ttl: 300,
        source: "cache",
      });

      mockRedisClient.get
        .mockRejectedValueOnce(new Error("First failure"))
        .mockResolvedValueOnce(cachedData);

      const result = await cache.get("test");

      expect(result).toEqual(testData);
      expect(mockRedisClient.get).toHaveBeenCalledTimes(2);
    });
  });

  describe("disabled cache", () => {
    it("should not perform operations when disabled", async () => {
      const disabledCache = new CodesCache({ enabled: false });

      const getResult = await disabledCache.get("test");
      const setResult = await disabledCache.set("test", { data: "test" });
      const deleteResult = await disabledCache.delete("test");
      const existsResult = await disabledCache.exists("test");

      expect(getResult).toBeNull();
      expect(setResult).toBe(false);
      expect(deleteResult).toBe(false);
      expect(existsResult).toBe(false);
      expect(disabledCache.isAvailable()).toBe(false);
    });
  });
});
