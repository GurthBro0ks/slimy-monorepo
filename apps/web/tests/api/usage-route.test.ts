import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/usage/route";
import * as usageThresholds from "@/lib/usage-thresholds";

// Mock the usage-thresholds module
vi.mock("@/lib/usage-thresholds", async () => {
  const actual = await vi.importActual<typeof usageThresholds>(
    "@/lib/usage-thresholds"
  );
  return {
    ...actual,
    getMockUsageData: vi.fn(actual.getMockUsageData),
  };
});

describe("GET /api/usage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return mock usage data with ok status", async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data).toHaveProperty("level");
    expect(data.data).toHaveProperty("currentSpend");
    expect(data.data).toHaveProperty("limit");
    expect(data.data).toHaveProperty("modelProbeStatus");
  });

  it("should return data with correct structure and types", async () => {
    const response = await GET();
    const data = await response.json();

    expect(typeof data.data.currentSpend).toBe("number");
    expect(typeof data.data.limit).toBe("number");
    expect(typeof data.data.level).toBe("string");
    expect(typeof data.data.modelProbeStatus).toBe("string");
  });

  it("should return valid model probe status", async () => {
    const response = await GET();
    const data = await response.json();

    expect(["ok", "soft_cap", "hard_cap"]).toContain(
      data.data.modelProbeStatus
    );
  });

  it("should return valid usage level", async () => {
    const response = await GET();
    const data = await response.json();

    expect(["free", "pro", "over_cap"]).toContain(data.data.level);
  });

  it("should use getMockUsageData with correct spend value", async () => {
    const mockGetMockUsageData = vi.mocked(usageThresholds.getMockUsageData);

    await GET();

    expect(mockGetMockUsageData).toHaveBeenCalledWith(950);
  });

  it("should return soft_cap status for near-limit spend (950)", async () => {
    const response = await GET();
    const data = await response.json();

    // Based on the hardcoded 950 spend in the route
    expect(data.data.currentSpend).toBe(950);
    expect(data.data.modelProbeStatus).toBe("soft_cap");
    expect(data.data.level).toBe("pro");
  });

  describe("Error handling", () => {
    it("should handle errors from getMockUsageData gracefully", async () => {
      const mockGetMockUsageData = vi.mocked(usageThresholds.getMockUsageData);
      mockGetMockUsageData.mockImplementationOnce(() => {
        throw new Error("Mock error");
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.ok).toBe(false);
      expect(data.code).toBe("USAGE_FETCH_ERROR");
      expect(data.message).toBe("Failed to fetch usage data");
    });

    it("should log errors to console", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const mockGetMockUsageData = vi.mocked(usageThresholds.getMockUsageData);
      mockGetMockUsageData.mockImplementationOnce(() => {
        throw new Error("Test error");
      });

      await GET();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Usage API error:",
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it("should return error response with correct structure", async () => {
      const mockGetMockUsageData = vi.mocked(usageThresholds.getMockUsageData);
      mockGetMockUsageData.mockImplementationOnce(() => {
        throw new Error("Test error");
      });

      const response = await GET();
      const data = await response.json();

      expect(data).toHaveProperty("ok");
      expect(data).toHaveProperty("code");
      expect(data).toHaveProperty("message");
      expect(data.ok).toBe(false);
    });
  });

  describe("Response headers and metadata", () => {
    it("should return JSON response", async () => {
      const response = await GET();
      const contentType = response.headers.get("content-type");

      expect(contentType).toContain("application/json");
    });

    it("should be parseable as JSON", async () => {
      const response = await GET();

      await expect(response.json()).resolves.toBeDefined();
    });
  });

  describe("Sandbox mode behavior", () => {
    it("should return deterministic mock data (sandbox mode)", async () => {
      // Call the endpoint multiple times
      const response1 = await GET();
      const data1 = await response1.json();

      const response2 = await GET();
      const data2 = await response2.json();

      // Should return the same data (sandbox/mock mode)
      expect(data1.data.currentSpend).toBe(data2.data.currentSpend);
      expect(data1.data.limit).toBe(data2.data.limit);
      expect(data1.data.level).toBe(data2.data.level);
      expect(data1.data.modelProbeStatus).toBe(data2.data.modelProbeStatus);
    });

    it("should not make external API calls (sandbox mode)", async () => {
      const fetchSpy = vi.spyOn(global, "fetch");

      await GET();

      // Should not have made any external fetch calls
      expect(fetchSpy).not.toHaveBeenCalled();

      fetchSpy.mockRestore();
    });

    it("should return data immediately without async delays", async () => {
      const startTime = Date.now();
      await GET();
      const endTime = Date.now();

      // Should complete quickly (< 100ms) since it's just returning mock data
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});
