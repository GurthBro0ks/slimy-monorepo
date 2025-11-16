import { describe, it, expect, vi } from "vitest";
import { isRateLimited } from "@/lib/rate-limiter";
import { join } from "path";
import { existsSync, unlinkSync } from "fs";

// Mock file system operations for testing
vi.mock("fs", async (importOriginal) => {
  const actual = await importOriginal();
  const store = new Map<string, string>();

  return {
    ...actual,
    readFileSync: vi.fn((path: string) => {
      if (store.has(path)) {
        return store.get(path);
      }
      throw new Error("File not found");
    }),
    writeFileSync: vi.fn((path: string, content: string) => {
      store.set(path, content);
    }),
    existsSync: vi.fn((path: string) => store.has(path) || path.endsWith("rate-limits")),
    mkdirSync: vi.fn(),
    // Helper to clear the mock store between tests
    __clearStore: () => store.clear(),
  };
});

// Mock Date.now() for time control
const mockDate = (ms: number) => vi.spyOn(Date, "now").mockReturnValue(ms);

describe("Rate Limiter", () => {
  const key = "test-user-1";
  const limit = 3;
  const windowMs = 5000; // 5 seconds

  beforeEach(() => {
    (require("fs").__clearStore as () => void)();
    vi.restoreAllMocks();
    mockDate(10000); // Start at 10 seconds
  });

  it("should allow requests within the limit", () => {
    expect(isRateLimited(key, limit, windowMs)).toBe(false); // 1st request
    expect(isRateLimited(key, limit, windowMs)).toBe(false); // 2nd request
    expect(isRateLimited(key, limit, windowMs)).toBe(false); // 3rd request
  });

  it("should rate limit after the limit is reached", () => {
    isRateLimited(key, limit, windowMs);
    isRateLimited(key, limit, windowMs);
    isRateLimited(key, limit, windowMs);
    expect(isRateLimited(key, limit, windowMs)).toBe(true); // 4th request
  });

  it("should reset the limit after the window passes", () => {
    isRateLimited(key, limit, windowMs);
    isRateLimited(key, limit, windowMs);
    isRateLimited(key, limit, windowMs);
    expect(isRateLimited(key, limit, windowMs)).toBe(true);

    // Advance time past the reset window
    mockDate(10000 + 5001);

    expect(isRateLimited(key, limit, windowMs)).toBe(false); // New window, 1st request
    expect(isRateLimited(key, limit, windowMs)).toBe(false); // New window, 2nd request
  });

  it("should handle multiple keys independently", () => {
    const key2 = "test-user-2";
    isRateLimited(key, limit, windowMs);
    isRateLimited(key, limit, windowMs);
    isRateLimited(key2, limit, windowMs);
    expect(isRateLimited(key, limit, windowMs)).toBe(false); // 3rd request for key 1
    expect(isRateLimited(key2, limit, windowMs)).toBe(false); // 2nd request for key 2
    expect(isRateLimited(key, limit, windowMs)).toBe(true); // 4th request for key 1
    expect(isRateLimited(key2, limit, windowMs)).toBe(false); // 3rd request for key 2
    expect(isRateLimited(key2, limit, windowMs)).toBe(true); // 4th request for key 2
  });
});
