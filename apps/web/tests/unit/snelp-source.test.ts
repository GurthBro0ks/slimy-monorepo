import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from "vitest";
import { SnelpSource } from "@/lib/codes/sources/snelp";

const originalSnelpUrl = process.env.NEXT_PUBLIC_SNELP_CODES_URL;

describe("SnelpSource", () => {
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    (SnelpSource as any).missingEnvLogged = false;
    (global as any).fetch = mockFetch;
  });

  afterEach(() => {
    if (originalSnelpUrl) {
      process.env.NEXT_PUBLIC_SNELP_CODES_URL = originalSnelpUrl;
    } else {
      delete process.env.NEXT_PUBLIC_SNELP_CODES_URL;
    }
    warnSpy.mockClear();
    (SnelpSource as any).missingEnvLogged = false;
  });

  afterAll(() => {
    warnSpy.mockRestore();
  });

  it("disables the source when NEXT_PUBLIC_SNELP_CODES_URL is missing", async () => {
    delete process.env.NEXT_PUBLIC_SNELP_CODES_URL;
    const source = new SnelpSource();

    const result = await source.fetch();

    expect(result.success).toBe(true);
    expect(result.codes).toEqual([]);
    expect(result.metadata?.status).toBe("disabled");
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      "Snelp source disabled: NEXT_PUBLIC_SNELP_CODES_URL not configured"
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("fetches codes when NEXT_PUBLIC_SNELP_CODES_URL is set", async () => {
    process.env.NEXT_PUBLIC_SNELP_CODES_URL = "https://snelp.example.dev/codes";
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        codes: [{ code: "abc123", active: true, timestamp: "2024-01-01T00:00:00Z" }],
      }),
    });

    const source = new SnelpSource();
    const result = await source.fetch();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
    expect(result.codes[0].code).toBe("ABC123");
    expect(result.metadata?.status).toBe("success");
  });
});
