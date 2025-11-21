import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { AdminApiClient } from "@/lib/api/admin-client";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("AdminApiClient", () => {
  let client: AdminApiClient;
  const testBaseUrl = "https://admin-api.test";

  beforeEach(() => {
    client = new AdminApiClient(testBaseUrl);
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe("isConfigured", () => {
    it("should return true when base URL is provided", () => {
      expect(client.isConfigured()).toBe(true);
    });

    it("should return false when base URL is empty", () => {
      const emptyClient = new AdminApiClient("");
      expect(emptyClient.isConfigured()).toBe(false);
    });

    it("should return false when base URL is not provided", () => {
      const undefinedClient = new AdminApiClient(undefined);
      expect(undefinedClient.isConfigured()).toBe(false);
    });
  });

  describe("getBaseUrl", () => {
    it("should return the configured base URL", () => {
      expect(client.getBaseUrl()).toBe(testBaseUrl);
    });
  });

  describe("request", () => {
    it("should return error when not configured", async () => {
      const unconfiguredClient = new AdminApiClient("");
      const result = await unconfiguredClient.request("/api/test");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("CONFIG_ERROR");
        expect(result.message).toContain("not configured");
      }
    });

    it("should build correct URL from path", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ data: "test" }),
      });

      await client.request("/api/usage/summary");

      expect(mockFetch).toHaveBeenCalledWith(
        `${testBaseUrl}/api/usage/summary`,
        expect.any(Object)
      );
    });

    it("should handle paths without leading slash", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ data: "test" }),
      });

      await client.request("api/test");

      expect(mockFetch).toHaveBeenCalledWith(
        `${testBaseUrl}/api/test`,
        expect.any(Object)
      );
    });
  });

  describe("get", () => {
    it("should make GET request with correct method", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ message: "success" }),
      });

      const result = await client.get("/api/test");

      expect(mockFetch).toHaveBeenCalledWith(
        `${testBaseUrl}/api/test`,
        expect.objectContaining({
          method: "GET",
        })
      );
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual({ message: "success" });
      }
    });

    it("should parse JSON response correctly", async () => {
      const mockData = { analysis: { results: [] } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => mockData,
      });

      const result = await client.get<typeof mockData>("/api/snail/screenshots/latest");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual(mockData);
      }
    });
  });

  describe("post", () => {
    it("should make POST request with JSON body", async () => {
      const payload = { level: 80, cityLevel: 45 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ tier: "S" }),
      });

      const result = await client.post("/api/snail/tier", payload);

      expect(mockFetch).toHaveBeenCalledWith(
        `${testBaseUrl}/api/snail/tier`,
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(payload),
        })
      );
      expect(result.ok).toBe(true);
    });

    it("should handle POST without body", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ ok: true }),
      });

      await client.post("/api/test");

      expect(mockFetch).toHaveBeenCalledWith(
        `${testBaseUrl}/api/test`,
        expect.objectContaining({
          method: "POST",
          body: undefined,
        })
      );
    });
  });

  describe("error handling", () => {
    it("should handle HTTP error responses", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => JSON.stringify({ code: "invalid_input", message: "Bad request" }),
      });

      const result = await client.get("/api/fail");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("invalid_input");
        expect(result.message).toBe("Bad request");
        expect(result.status).toBe(400);
      }
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await client.get("/api/test");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("NETWORK_ERROR");
        expect(result.message).toBe("Network error");
      }
    });

    it("should handle timeout with AbortError", async () => {
      const abortError = new Error("The operation was aborted");
      abortError.name = "AbortError";
      mockFetch.mockRejectedValueOnce(abortError);

      const result = await client.get("/api/test", { timeout: 100 });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("TIMEOUT_ERROR");
        expect(result.message).toContain("timed out");
      }
    });

    it("should handle malformed error responses", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => "Not JSON",
      });

      const result = await client.get("/api/test");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("UPSTREAM_ERROR");
        expect(result.status).toBe(500);
      }
    });
  });

  describe("HTTP methods", () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ ok: true }),
      });
    });

    it("should support PUT requests", async () => {
      await client.put("/api/test", { data: "updated" });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: "PUT" })
      );
    });

    it("should support PATCH requests", async () => {
      await client.patch("/api/test", { field: "value" });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: "PATCH" })
      );
    });

    it("should support DELETE requests", async () => {
      await client.delete("/api/test");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });

  describe("headers", () => {
    it("should set default Content-Type header", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({}),
      });

      await client.post("/api/test", { data: "test" });

      const callHeaders = mockFetch.mock.calls[0][1]?.headers as Headers;
      expect(callHeaders.get("Content-Type")).toBe("application/json");
    });

    it("should allow custom headers", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({}),
      });

      await client.get("/api/test", {
        headers: { "X-Custom": "header-value" },
      });

      const callHeaders = mockFetch.mock.calls[0][1]?.headers as Headers;
      expect(callHeaders.get("X-Custom")).toBe("header-value");
    });
  });
});
