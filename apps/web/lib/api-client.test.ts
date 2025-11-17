import { describe, it, expect, beforeEach, vi } from "vitest";
import { apiClient, ApiClient, type ApiSuccess, type ApiError } from "./api-client";

const mockAdminClient = vi.hoisted(() => ({
  request: vi.fn(),
}));

vi.mock("./api/admin-client", () => ({
  adminApiClient: mockAdminClient,
}));

const successResponse = <T>(data: T, overrides: Partial<ApiSuccess<T>> = {}): ApiSuccess<T> => ({
  ok: true as const,
  data,
  status: 200,
  headers: new Headers(),
  ...overrides,
});

const errorResponse = (overrides: Partial<ApiError> = {}): ApiError => ({
  ok: false as const,
  code: "NETWORK_ERROR",
  message: "Network error",
  ...overrides,
});

describe("ApiClient", () => {
  let client: ApiClient;

  beforeEach(() => {
    client = new ApiClient("https://admin.test");
    mockAdminClient.request.mockReset();
  });

  it("should create an instance", () => {
    expect(client).toBeInstanceOf(ApiClient);
  });

  it("should have default instance", () => {
    expect(apiClient).toBeInstanceOf(ApiClient);
  });

  it("should handle GET requests", async () => {
    mockAdminClient.request.mockResolvedValueOnce(successResponse({ message: "ok" }));

    const result = await client.get("/status");

    expect(result.ok).toBe(true);
    expect(result.data).toEqual({ message: "ok" });
    expect(mockAdminClient.request).toHaveBeenCalledWith(
      "/status",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("should handle caching", async () => {
    mockAdminClient.request.mockResolvedValueOnce(successResponse({ cached: true }));

    const first = await client.get("/cached", { useCache: true, cacheTtl: 1000 });
    const second = await client.get("/cached", { useCache: true, cacheTtl: 1000 });

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(second.data).toEqual(first.data);
    expect(mockAdminClient.request).toHaveBeenCalledTimes(1);
  });

  it("should handle POST requests", async () => {
    const payload = { test: "data" };
    mockAdminClient.request.mockResolvedValueOnce(successResponse({ created: true }));

    const result = await client.post("/codes", payload);

    expect(result.ok).toBe(true);
    expect(mockAdminClient.request).toHaveBeenCalledWith(
      "/codes",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(payload),
      })
    );
  });

  it("should handle network errors gracefully", async () => {
    mockAdminClient.request.mockResolvedValueOnce(
      errorResponse({ code: "NETWORK_ERROR", message: "fail" })
    );

    const result = await client.get("/fail", { retries: 0 });

    expect(result.ok).toBe(false);
    expect(result.code).toBe("NETWORK_ERROR");
  });

  it("should handle timeout errors", async () => {
    const timeoutError = Object.assign(new Error("Aborted"), { name: "AbortError" });
    mockAdminClient.request.mockRejectedValueOnce(timeoutError);

    const result = await client.get("/delay", { retries: 0 });

    expect(result.ok).toBe(false);
    expect(result.code).toBe("TIMEOUT_ERROR");
  });

  it("should support request interceptors", async () => {
    mockAdminClient.request.mockResolvedValueOnce(successResponse({}));

    client.addRequestInterceptor((config) => ({
      ...config,
      headers: {
        ...(config.headers || {}),
        "X-Test": "123",
      },
    }));

    await client.get("/with-interceptor");

    const [, requestConfig] = mockAdminClient.request.mock.calls[0];
    expect((requestConfig?.headers as Record<string, string>)["X-Test"]).toBe("123");
  });

  it("should support error interceptors", async () => {
    mockAdminClient.request.mockResolvedValueOnce(errorResponse());
    client.addErrorInterceptor((error) => ({
      ...error,
      code: "CUSTOM_ERROR",
    }));

    const result = await client.get("/error", { retries: 0 });

    expect(result.ok).toBe(false);
    expect(result.code).toBe("CUSTOM_ERROR");
  });
});
