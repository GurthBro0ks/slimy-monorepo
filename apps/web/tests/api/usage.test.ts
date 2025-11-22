import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  fetchUsageData,
  fetchUsageDataSafe,
  UsageApiError,
} from "@/lib/api/usage";
import type { UsageData } from "@/lib/usage-thresholds";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Usage API Client", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe("fetchUsageData", () => {
    it("should successfully fetch and return usage data", async () => {
      const mockUsageData: UsageData = {
        level: "pro",
        currentSpend: 500,
        limit: 1000,
        modelProbeStatus: "ok",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ok: true, data: mockUsageData }),
      });

      const result = await fetchUsageData();

      expect(mockFetch).toHaveBeenCalledWith("/api/usage", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      expect(result).toEqual(mockUsageData);
    });

    it("should handle empty data arrays gracefully", async () => {
      const mockUsageData: UsageData = {
        level: "free",
        currentSpend: 0,
        limit: 100,
        modelProbeStatus: "ok",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ok: true, data: mockUsageData }),
      });

      const result = await fetchUsageData();
      expect(result.currentSpend).toBe(0);
    });

    it("should handle soft cap status correctly", async () => {
      const mockUsageData: UsageData = {
        level: "pro",
        currentSpend: 950,
        limit: 1000,
        modelProbeStatus: "soft_cap",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ok: true, data: mockUsageData }),
      });

      const result = await fetchUsageData();
      expect(result.modelProbeStatus).toBe("soft_cap");
    });

    it("should handle hard cap status correctly", async () => {
      const mockUsageData: UsageData = {
        level: "over_cap",
        currentSpend: 1100,
        limit: 1000,
        modelProbeStatus: "hard_cap",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ok: true, data: mockUsageData }),
      });

      const result = await fetchUsageData();
      expect(result.modelProbeStatus).toBe("hard_cap");
      expect(result.level).toBe("over_cap");
    });

    describe("HTTP errors", () => {
      it("should throw UsageApiError on 500 HTTP error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: async () => ({
            ok: false,
            code: "SERVER_ERROR",
            message: "Internal server error occurred",
          }),
        });

        const promise = fetchUsageData();
        await expect(promise).rejects.toThrow(UsageApiError);
        await expect(promise).rejects.toThrow("Internal server error occurred");
      });

      it("should throw UsageApiError on 502 Bad Gateway", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 502,
          statusText: "Bad Gateway",
          json: async () => {
            throw new Error("Not JSON");
          },
        });

        const promise = fetchUsageData();
        await expect(promise).rejects.toThrow(UsageApiError);
        await expect(promise).rejects.toThrow(/502/);
      });

      it("should throw UsageApiError on 404 Not Found", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: "Not Found",
          json: async () => ({}),
        });

        await expect(fetchUsageData()).rejects.toThrow(UsageApiError);
      });

      it("should handle non-JSON error responses", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 503,
          statusText: "Service Unavailable",
          json: async () => {
            throw new Error("Invalid JSON");
          },
        });

        try {
          await fetchUsageData();
          expect.fail("Should have thrown");
        } catch (error) {
          expect(error).toBeInstanceOf(UsageApiError);
          expect((error as UsageApiError).message).toContain("503");
        }
      });
    });

    describe("Application-level errors", () => {
      it("should throw UsageApiError when ok is false", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            ok: false,
            code: "USAGE_FETCH_ERROR",
            message: "Failed to fetch usage data",
          }),
        });

        try {
          await fetchUsageData();
          expect.fail("Should have thrown");
        } catch (error) {
          expect(error).toBeInstanceOf(UsageApiError);
          expect((error as UsageApiError).message).toBe("Failed to fetch usage data");
          expect((error as UsageApiError).code).toBe("USAGE_FETCH_ERROR");
        }
      });

      it("should handle missing data in successful response", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            // data is missing
          }),
        });

        try {
          await fetchUsageData();
          expect.fail("Should have thrown");
        } catch (error) {
          expect(error).toBeInstanceOf(UsageApiError);
          expect((error as UsageApiError).message).toContain("No usage data");
        }
      });

      it("should validate data structure and reject invalid data", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            data: {
              // Missing required fields
              level: "pro",
              // currentSpend and limit are missing
            },
          }),
        });

        try {
          await fetchUsageData();
          expect.fail("Should have thrown");
        } catch (error) {
          expect(error).toBeInstanceOf(UsageApiError);
          expect((error as UsageApiError).message).toContain("Invalid usage data");
        }
      });

      it("should reject data with wrong types", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            data: {
              level: "pro",
              currentSpend: "500", // Should be number
              limit: 1000,
              modelProbeStatus: "ok",
            },
          }),
        });

        await expect(fetchUsageData()).rejects.toThrow(UsageApiError);
      });
    });

    describe("Network errors", () => {
      it("should throw UsageApiError on network failure", async () => {
        mockFetch.mockRejectedValueOnce(
          new TypeError("Failed to fetch: Network error")
        );

        try {
          await fetchUsageData();
          expect.fail("Should have thrown");
        } catch (error) {
          expect(error).toBeInstanceOf(UsageApiError);
          expect((error as UsageApiError).message).toContain("Network error");
        }
      });

      it("should handle CORS errors", async () => {
        mockFetch.mockRejectedValueOnce(
          new TypeError("Failed to fetch: CORS error")
        );

        await expect(fetchUsageData()).rejects.toThrow(UsageApiError);
      });
    });

    describe("Edge cases", () => {
      it("should handle negative spend values", async () => {
        const mockUsageData: UsageData = {
          level: "free",
          currentSpend: -10, // Negative value (bug or test data)
          limit: 100,
          modelProbeStatus: "ok",
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ ok: true, data: mockUsageData }),
        });

        const result = await fetchUsageData();
        // API client should return the data as-is; UI handles clamping
        expect(result.currentSpend).toBe(-10);
      });

      it("should handle zero limit (edge case)", async () => {
        const mockUsageData: UsageData = {
          level: "free",
          currentSpend: 0,
          limit: 0,
          modelProbeStatus: "ok",
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ ok: true, data: mockUsageData }),
        });

        const result = await fetchUsageData();
        expect(result.limit).toBe(0);
      });

      it("should preserve unknown error details", async () => {
        mockFetch.mockRejectedValueOnce(new Error("Unexpected error"));

        try {
          await fetchUsageData();
          expect.fail("Should have thrown");
        } catch (error) {
          expect(error).toBeInstanceOf(UsageApiError);
          expect((error as UsageApiError).code).toBe("UNKNOWN_ERROR");
          expect((error as UsageApiError).message).toContain("Unexpected error");
        }
      });
    });
  });

  describe("fetchUsageDataSafe", () => {
    it("should return data on success", async () => {
      const mockUsageData: UsageData = {
        level: "pro",
        currentSpend: 500,
        limit: 1000,
        modelProbeStatus: "ok",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ok: true, data: mockUsageData }),
      });

      const result = await fetchUsageDataSafe();
      expect(result).toEqual(mockUsageData);
    });

    it("should return null on error (default fallback)", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await fetchUsageDataSafe();
      expect(result).toBeNull();
    });

    it("should return custom fallback on error", async () => {
      const fallback: UsageData = {
        level: "free",
        currentSpend: 0,
        limit: 100,
        modelProbeStatus: "ok",
      };

      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await fetchUsageDataSafe(fallback);
      expect(result).toEqual(fallback);
    });

    it("should log errors to console", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mockFetch.mockRejectedValueOnce(new Error("Test error"));

      await fetchUsageDataSafe();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to fetch usage data:",
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("UsageApiError", () => {
    it("should create error with message and code", () => {
      const error = new UsageApiError("Test error", "TEST_CODE");

      expect(error.message).toBe("Test error");
      expect(error.code).toBe("TEST_CODE");
      expect(error.name).toBe("UsageApiError");
    });

    it("should create error with status", () => {
      const error = new UsageApiError("Test error", "TEST_CODE", 500);

      expect(error.status).toBe(500);
    });

    it("should default code to UNKNOWN_ERROR", () => {
      const error = new UsageApiError("Test error");

      expect(error.code).toBe("UNKNOWN_ERROR");
    });

    it("should be instanceof Error", () => {
      const error = new UsageApiError("Test error");

      expect(error).toBeInstanceOf(Error);
    });
  });
});
