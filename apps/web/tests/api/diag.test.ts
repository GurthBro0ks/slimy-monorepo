import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/diag/route";

vi.mock("@/lib/api-client", () => {
  const get = vi.fn();
  return {
    apiClient: {
      get,
    },
  };
});

import { apiClient } from "@/lib/api-client";
const mockGet = vi.mocked(apiClient.get);

describe("/api/diag route", () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it("returns proxy data when admin-api responds", async () => {
    mockGet.mockResolvedValueOnce({
      ok: true,
      data: { status: "ok", upstream: "healthy" },
      status: 200,
      headers: new Headers(),
    });

    const response = await GET();
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload).toEqual({ status: "ok", upstream: "healthy" });
  });

  it("returns structured error when admin-api is unavailable", async () => {
    mockGet.mockResolvedValueOnce({
      ok: false,
      code: "NETWORK_ERROR",
      message: "Admin API unavailable (ECONNREFUSED 127.0.0.1:3080)",
      status: 503,
    });

    const response = await GET();
    expect(response.status).toBe(503);
    const payload = await response.json();
    expect(payload.ok).toBe(false);
    expect(payload.message).toContain("unavailable");
    expect(payload.code).toBe("NETWORK_ERROR");
  });
});
