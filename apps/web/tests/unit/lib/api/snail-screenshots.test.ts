import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  fetchLatestSnailAnalysis,
  type SnailAnalysisPayload,
} from "@/lib/api/snail-screenshots";

// Mock admin-client
const mockAdminClient = vi.hoisted(() => ({
  isConfigured: vi.fn(),
  get: vi.fn(),
}));

vi.mock("@/lib/api/admin-client", () => ({
  adminApiClient: mockAdminClient,
}));

describe("snail-screenshots API client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default configured state
    mockAdminClient.isConfigured.mockReturnValue(true);
  });

  describe("fetchLatestSnailAnalysis - Sandbox Mode", () => {
    beforeEach(() => {
      // Set to sandbox mode (not configured)
      mockAdminClient.isConfigured.mockReturnValue(false);
    });

    it("should return sandbox data when admin-api is not configured", async () => {
      const result = await fetchLatestSnailAnalysis();

      expect(mockAdminClient.isConfigured).toHaveBeenCalled();
      expect(mockAdminClient.get).not.toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.runId).toBe("sandbox-run");
      expect(result.guildId).toBe("sandbox-guild");
      expect(result.userId).toBe("sandbox-user");
    });

    it("should include sandbox screenshot results", async () => {
      const result = await fetchLatestSnailAnalysis();

      expect(result.results).toHaveLength(2);
      expect(result.results[0]).toMatchObject({
        fileUrl: expect.stringContaining("sandbox"),
        uploadedBy: "SandboxUser#0001",
        analyzedAt: expect.any(String),
        stats: expect.objectContaining({
          simPower: expect.any(Number),
          cityLevel: expect.any(Number),
          snailLevel: expect.any(Number),
          tier: expect.any(String),
        }),
      });
    });

    it("should have valid stats structure in sandbox data", async () => {
      const result = await fetchLatestSnailAnalysis();

      const firstResult = result.results[0];
      expect(firstResult.stats.simPower).toBeGreaterThan(0);
      expect(firstResult.stats.cityLevel).toBeGreaterThan(0);
      expect(firstResult.stats.snailLevel).toBeGreaterThan(0);
      expect(["A", "B", "C", "D", "S", "F"]).toContain(firstResult.stats.tier);
    });
  });

  describe("fetchLatestSnailAnalysis - Live Mode", () => {
    beforeEach(() => {
      // Set to live mode (configured)
      mockAdminClient.isConfigured.mockReturnValue(true);
    });

    it("should call admin-api endpoint when configured", async () => {
      const mockAnalysis: SnailAnalysisPayload = {
        runId: "2025-11-21T09:15:00.000Z",
        guildId: "guild-123",
        userId: "user-456",
        results: [
          {
            fileUrl: "https://example.com/snail/screenshot1.png",
            uploadedBy: "TestUser#1234",
            analyzedAt: "2025-11-21T09:15:00.000Z",
            stats: {
              simPower: 1500000,
              cityLevel: 50,
              snailLevel: 85,
              tier: "A",
            },
          },
        ],
      };

      mockAdminClient.get.mockResolvedValueOnce({
        ok: true,
        data: { analysis: mockAnalysis },
      });

      const result = await fetchLatestSnailAnalysis();

      expect(mockAdminClient.isConfigured).toHaveBeenCalled();
      expect(mockAdminClient.get).toHaveBeenCalledWith("/api/snail/screenshots/latest");
      expect(result).toEqual(mockAnalysis);
    });

    it("should return empty structure when analysis is missing", async () => {
      mockAdminClient.get.mockResolvedValueOnce({
        ok: true,
        data: { analysis: null },
      });

      const result = await fetchLatestSnailAnalysis();

      expect(result).toEqual({
        runId: null,
        guildId: null,
        userId: null,
        results: [],
      });
    });

    it("should handle empty results array", async () => {
      const mockAnalysis: SnailAnalysisPayload = {
        runId: "run-123",
        guildId: "guild-456",
        userId: "user-789",
        results: [],
      };

      mockAdminClient.get.mockResolvedValueOnce({
        ok: true,
        data: { analysis: mockAnalysis },
      });

      const result = await fetchLatestSnailAnalysis();

      expect(result.results).toEqual([]);
      expect(result.runId).toBe("run-123");
    });

    it("should handle multiple screenshot results", async () => {
      const mockAnalysis: SnailAnalysisPayload = {
        runId: "run-multi",
        guildId: "guild-123",
        userId: "user-456",
        results: [
          {
            fileUrl: "https://example.com/s1.png",
            uploadedBy: "User1#0001",
            analyzedAt: "2025-11-21T09:15:00.000Z",
            stats: { simPower: 1000000, cityLevel: 40, snailLevel: 75, tier: "B" },
          },
          {
            fileUrl: "https://example.com/s2.png",
            uploadedBy: "User1#0001",
            analyzedAt: "2025-11-21T09:16:00.000Z",
            stats: { simPower: 1200000, cityLevel: 42, snailLevel: 78, tier: "B" },
          },
          {
            fileUrl: "https://example.com/s3.png",
            uploadedBy: "User1#0001",
            analyzedAt: "2025-11-21T09:17:00.000Z",
            stats: { simPower: 1400000, cityLevel: 44, snailLevel: 80, tier: "A" },
          },
        ],
      };

      mockAdminClient.get.mockResolvedValueOnce({
        ok: true,
        data: { analysis: mockAnalysis },
      });

      const result = await fetchLatestSnailAnalysis();

      expect(result.results).toHaveLength(3);
      expect(result.results[0].fileUrl).toBe("https://example.com/s1.png");
      expect(result.results[2].stats.tier).toBe("A");
    });
  });

  describe("fetchLatestSnailAnalysis - Error Handling", () => {
    beforeEach(() => {
      mockAdminClient.isConfigured.mockReturnValue(true);
    });

    it("should throw error when API returns error response", async () => {
      mockAdminClient.get.mockResolvedValueOnce({
        ok: false,
        code: "SERVER_ERROR",
        message: "Internal server error",
      });

      await expect(fetchLatestSnailAnalysis()).rejects.toThrow("Internal server error");
    });

    it("should throw error on network failure", async () => {
      mockAdminClient.get.mockRejectedValueOnce(new Error("Network error"));

      await expect(fetchLatestSnailAnalysis()).rejects.toThrow("Network error");
    });

    it("should handle missing data property gracefully", async () => {
      mockAdminClient.get.mockResolvedValueOnce({
        ok: true,
        data: {},
      });

      const result = await fetchLatestSnailAnalysis();

      expect(result).toEqual({
        runId: null,
        guildId: null,
        userId: null,
        results: [],
      });
    });
  });

  describe("Type Safety", () => {
    beforeEach(() => {
      mockAdminClient.isConfigured.mockReturnValue(true);
    });

    it("should handle optional fields in results", async () => {
      const mockAnalysis: SnailAnalysisPayload = {
        runId: "run-123",
        guildId: "guild-456",
        userId: "user-789",
        results: [
          {
            fileUrl: "https://example.com/minimal.png",
            stats: { simPower: 1000000 }, // Minimal stats
          },
        ],
      };

      mockAdminClient.get.mockResolvedValueOnce({
        ok: true,
        data: { analysis: mockAnalysis },
      });

      const result = await fetchLatestSnailAnalysis();

      expect(result.results[0].uploadedBy).toBeUndefined();
      expect(result.results[0].analyzedAt).toBeUndefined();
      expect(result.results[0].stats.simPower).toBe(1000000);
    });

    it("should handle arbitrary stats properties", async () => {
      const mockAnalysis: SnailAnalysisPayload = {
        runId: null,
        guildId: null,
        userId: null,
        results: [
          {
            fileUrl: "https://example.com/custom.png",
            stats: {
              simPower: 1000000,
              customField: "value",
              numericField: 123,
            },
          },
        ],
      };

      mockAdminClient.get.mockResolvedValueOnce({
        ok: true,
        data: { analysis: mockAnalysis },
      });

      const result = await fetchLatestSnailAnalysis();

      expect(result.results[0].stats).toHaveProperty("customField", "value");
      expect(result.results[0].stats).toHaveProperty("numericField", 123);
    });
  });
});
