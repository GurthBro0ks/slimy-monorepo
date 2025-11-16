import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  filterByScope,
  searchCodes,
  type Code,
  CodesAggregator,
  getAggregator
} from "@/lib/codes-aggregator";
import { getCache } from "@/lib/codes/cache";
import { getDeduplicator } from "@/lib/codes/deduplication";
import { getFallbackManager } from "@/lib/codes/fallbacks";

const mockCodes: Code[] = [
  {
    code: "ACTIVE2024",
    source: "snelp",
    ts: new Date().toISOString(),
    tags: ["active"],
    expires: null,
    region: "global",
    description: "Active code from Snelp",
  },
  {
    code: "EXPIRED2023",
    source: "snelp",
    ts: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    tags: [],
    expires: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Expired yesterday
    region: "global",
    description: "Expired code",
  },
  {
    code: "RECENT2024",
    source: "reddit",
    ts: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    tags: ["reddit"],
    expires: null,
    region: "global",
  },
  {
    code: "OLD2023",
    source: "reddit",
    ts: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    tags: ["reddit"],
    expires: null,
    region: "global",
  },
];

// Mock external dependencies
vi.mock("@/lib/codes/cache");
vi.mock("@/lib/codes/deduplication");
vi.mock("@/lib/codes/fallbacks");
vi.mock("@/lib/codes/sources/snelp");
vi.mock("@/lib/codes/sources/reddit");

describe("Codes Aggregator", () => {
  let mockCache: any;
  let mockDeduplicator: any;
  let mockFallbackManager: any;

  beforeEach(() => {
    // Reset mocks
    mockCache = {
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      get: vi.fn(),
      set: vi.fn(),
      isAvailable: vi.fn().mockReturnValue(true),
      getStats: vi.fn().mockResolvedValue({ available: true, connected: true }),
    };

    mockDeduplicator = {
      deduplicate: vi.fn().mockReturnValue({
        codes: mockCodes,
        duplicates: {},
        stats: { total: 4, unique: 4, duplicates: 0, merged: 0 },
      }),
    };

    mockFallbackManager = {
      executeWithFallback: vi.fn(),
      aggregateWithFallbacks: vi.fn().mockResolvedValue({
        codes: mockCodes,
        sources: [],
        hasFallbacks: false,
      }),
      getCircuitBreakerStatus: vi.fn().mockReturnValue({}),
    };

    (getCache as any).mockReturnValue(mockCache);
    (getDeduplicator as any).mockReturnValue(mockDeduplicator);
    (getFallbackManager as any).mockReturnValue(mockFallbackManager);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("filterByScope", () => {
    it("should filter active codes", () => {
      const result = filterByScope(mockCodes, "active");
      expect(result).toHaveLength(1); // Only ACTIVE2024 has "active" tag
      expect(result[0].code).toBe("ACTIVE2024");
      expect(result.some((c) => c.code === "EXPIRED2023")).toBe(false);
    });

    it("should filter codes from past 7 days", () => {
      const result = filterByScope(mockCodes, "past7");
      expect(result).toHaveLength(2); // ACTIVE2024 and RECENT2024
      expect(result.every((c) => ["ACTIVE2024", "RECENT2024"].includes(c.code))).toBe(true);
    });

    it("should return all codes for 'all' scope", () => {
      const result = filterByScope(mockCodes, "all");
      expect(result).toHaveLength(4);
    });
  });

  describe("searchCodes", () => {
    it("should return all codes for empty query", () => {
      const result = searchCodes(mockCodes, "");
      expect(result).toHaveLength(4);
    });

    it("should search by code text", () => {
      const result = searchCodes(mockCodes, "ACTIVE");
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe("ACTIVE2024");
    });

    it("should search by description", () => {
      const result = searchCodes(mockCodes, "Snelp");
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe("ACTIVE2024");
    });

    it("should search by tags", () => {
      const result = searchCodes(mockCodes, "reddit");
      expect(result).toHaveLength(2);
      expect(result.every((c) => c.source === "reddit")).toBe(true);
    });

    it("should be case-insensitive", () => {
      const result = searchCodes(mockCodes, "active");
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe("ACTIVE2024");
    });
  });

  describe("CodesAggregator", () => {
    let aggregator: CodesAggregator;
    let mockSnelpSource: any;
    let mockRedditSource: any;

    beforeEach(() => {
      // Create mock source adapters
      mockSnelpSource = {
        name: "snelp",
        config: { enabled: true },
        fetch: vi.fn().mockResolvedValue({
          codes: [mockCodes[0], mockCodes[1]],
          success: true,
          metadata: {
            source: "snelp",
            fetchedAt: new Date().toISOString(),
            count: 2,
            duration: 100,
            status: "success",
          },
        }),
        healthCheck: vi.fn().mockResolvedValue({ healthy: true }),
        getMetadata: vi.fn().mockReturnValue({
          name: "Snelp",
          description: "Test source",
          totalFetches: 1,
          successfulFetches: 1,
          failedFetches: 0,
        }),
      };

      mockRedditSource = {
        name: "reddit",
        config: { enabled: true },
        fetch: vi.fn().mockResolvedValue({
          codes: [mockCodes[2], mockCodes[3]],
          success: true,
          metadata: {
            source: "reddit",
            fetchedAt: new Date().toISOString(),
            count: 2,
            duration: 150,
            status: "success",
          },
        }),
        healthCheck: vi.fn().mockResolvedValue({ healthy: true }),
        getMetadata: vi.fn().mockReturnValue({
          name: "Reddit",
          description: "Test source",
          totalFetches: 1,
          successfulFetches: 1,
          failedFetches: 0,
        }),
      };

      // Setup fallback manager to return successful results
      mockFallbackManager.executeWithFallback
        .mockResolvedValueOnce({
          codes: [mockCodes[0], mockCodes[1]],
          success: true,
          metadata: {
            source: "snelp",
            fetchedAt: new Date().toISOString(),
            count: 2,
            duration: 100,
            status: "success",
          },
        })
        .mockResolvedValueOnce({
          codes: [mockCodes[2], mockCodes[3]],
          success: true,
          metadata: {
            source: "reddit",
            fetchedAt: new Date().toISOString(),
            count: 2,
            duration: 150,
            status: "success",
          },
        });

      // Mock the aggregator to avoid calling real constructors
      aggregator = new CodesAggregator();
      // Manually set up sources to avoid constructor issues in tests
      (aggregator as any).sources = new Map([
        ["snelp", mockSnelpSource],
        ["reddit", mockRedditSource],
      ]);
      (aggregator as any).refreshManager = {
        getCodesWithRefresh: vi.fn().mockResolvedValue({
          response: {
            codes: [...mockCodes],
            sources: {
              snelp: { count: 2, lastFetch: new Date().toISOString(), status: "success" },
              reddit: { count: 2, lastFetch: new Date().toISOString(), status: "success" },
            },
            metadata: {
              totalSources: 2,
              successfulSources: 2,
              failedSources: 0,
              deduplicationStats: { total: 4, unique: 4, duplicates: 0, merged: 0 },
              cache: { hit: false, stale: false },
              timestamp: new Date().toISOString(),
            },
          },
          isStale: false,
        }),
        getRefreshStats: vi.fn().mockReturnValue({
          aggregated_codes: {
            lastRefresh: Date.now(),
            inProgress: false,
            lastSuccess: Date.now(),
            consecutiveFailures: 0,
            autoRefresh: true,
          },
        }),
      };
    });

    it("should aggregate codes from all sources", async () => {
      const result = await aggregator.aggregateCodes();

      expect(result).toBeDefined();
      expect(result.codes).toBeDefined();
      expect(result.sources).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.totalSources).toBeGreaterThan(0);
    });

    it("should handle source failures gracefully", async () => {
      // Mock the refresh manager to call the actual fetchAndAggregate
      (aggregator as any).refreshManager.getCodesWithRefresh.mockImplementation(async () => {
        // Mock one source failing
        mockFallbackManager.executeWithFallback
          .mockResolvedValueOnce({
            codes: [],
            success: false,
            error: "Source failed",
            metadata: {
              source: "snelp",
              fetchedAt: new Date().toISOString(),
              count: 0,
              duration: 100,
              status: "failed",
            },
          })
          .mockResolvedValueOnce({
            codes: [mockCodes[2], mockCodes[3]],
            success: true,
            metadata: {
              source: "reddit",
              fetchedAt: new Date().toISOString(),
              count: 2,
              duration: 150,
              status: "success",
            },
          });

        mockFallbackManager.aggregateWithFallbacks.mockResolvedValue({
          codes: [mockCodes[2], mockCodes[3]],
          sources: [
            {
              codes: [],
              success: false,
              error: "Source failed",
              metadata: {
                source: "snelp",
                fetchedAt: new Date().toISOString(),
                count: 0,
                duration: 100,
                status: "failed",
              },
            },
            {
              codes: [mockCodes[2], mockCodes[3]],
              success: true,
              metadata: {
                source: "reddit",
                fetchedAt: new Date().toISOString(),
                count: 2,
                duration: 150,
                status: "success",
              },
            },
          ],
          hasFallbacks: false,
        });

        // Call the actual method
        const result = await (aggregator as any).fetchAndAggregate();
        return { response: result, isStale: false };
      });

      const result = await aggregator.aggregateCodes();

      expect(result).toBeDefined();
      expect(result.metadata.failedSources).toBe(1);
      expect(result.metadata.successfulSources).toBe(1);
    });

    it("should get health status", async () => {
      const health = await aggregator.getHealthStatus();

      expect(health).toBeDefined();
      expect(health.overall).toBeDefined();
      expect(health.sources).toBeDefined();
      expect(health.cache).toBeDefined();
      expect(health.refresh).toBeDefined();
    });

    it("should deduplicate codes", async () => {
      // Mock the refresh manager to call the actual fetchAndAggregate
      (aggregator as any).refreshManager.getCodesWithRefresh.mockImplementation(async () => {
        // Call the actual method which should trigger deduplication
        const result = await (aggregator as any).fetchAndAggregate();
        return { response: result, isStale: false };
      });

      const result = await aggregator.aggregateCodes();

      expect(mockDeduplicator.deduplicate).toHaveBeenCalled();
      expect(result.metadata.deduplicationStats).toBeDefined();
    });
  });

  describe("getAggregator", () => {
    it("should return singleton instance", () => {
      const agg1 = getAggregator();
      const agg2 = getAggregator();

      expect(agg1).toBe(agg2);
    });

    it("should accept configuration", () => {
      const config = { cache: { enabled: false } };
      const aggregator = getAggregator(config);

      expect(aggregator).toBeDefined();
    });
  });
});
