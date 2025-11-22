import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { AdminApiClient } from "@/lib/api/admin-client";

const originalFetch = global.fetch;

describe("AdminApiClient", () => {
  const fetchMock = vi.fn();
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  beforeEach(() => {
    fetchMock.mockReset();
    (global as any).fetch = fetchMock;
  });

  afterAll(() => {
    warnSpy.mockRestore();
    errorSpy.mockRestore();
    (global as any).fetch = originalFetch;
  });

  it("returns structured unavailable error when admin-api cannot be reached", async () => {
    const client = new AdminApiClient("http://127.0.0.1:3080");
    const networkError = new TypeError("fetch failed");
    (networkError as any).cause = { code: "ECONNREFUSED", address: "127.0.0.1", port: 3080 };
    fetchMock.mockRejectedValueOnce(networkError);

    const response = await client.get("/api/diag");

    expect(fetchMock).toHaveBeenCalled();
    expect(response.ok).toBe(false);
    if (response.ok) return;
    expect(response.code).toBe("NETWORK_ERROR");
    expect(response.status).toBe(503);
    expect(response.message).toContain("ECONNREFUSED 127.0.0.1:3080");
    expect(warnSpy).toHaveBeenCalledWith(
      "[AdminApiClient] admin-api unavailable (ECONNREFUSED 127.0.0.1:3080)"
    );
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
