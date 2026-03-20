import { describe, it, expect, vi, beforeEach } from "vitest";
import { getArtifactFreshness, getArtifactMetadata } from "./artifact-reader";
import { promises as fs } from "fs";

vi.mock("fs", () => ({
    promises: {
        stat: vi.fn(),
        readFile: vi.fn(),
    },
}));

describe("artifact-reader", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("getArtifactFreshness", () => {
        it("returns NO_DATA when summary file is missing", async () => {
            vi.mocked(fs.stat).mockRejectedValue(new Error("File not found"));

            const result = await getArtifactFreshness();
            expect(result.status).toBe("NO_DATA");
            expect(result.error_message).toContain("latest_summary.json missing");
        });

        it("returns CLOCK_SKEW when producer time is in the future", async () => {
            const futureTime = new Date(Date.now() + 10 * 60 * 1000).toISOString();
            vi.mocked(fs.stat).mockImplementation(async (p) => {
                if ((p as string).includes("latest_summary.json")) {
                    return { mtime: new Date(futureTime), size: 100 };
                }
                return Promise.reject(new Error("File not found"));
            });

            const result = await getArtifactFreshness();
            expect(result.status).toBe("CLOCK_SKEW");
            expect(result.skew_detected).toBe(true);
        });

        it("returns OK when fresh", async () => {
            const now = new Date();
            const recentTime = new Date(now.getTime() - 30 * 1000).toISOString();

            vi.mocked(fs.stat).mockImplementation(async (p) => {
                if ((p as string).includes("latest_summary.json")) {
                    return { mtime: new Date(recentTime), size: 100 };
                }
                return Promise.reject(new Error("File not found"));
            });
            vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify({ last_pull_utc: recentTime }));

            const result = await getArtifactFreshness();
            expect(result.status).toBe("OK");
            expect(result.age_seconds).toBeLessThan(60);
        });

        it("returns WARN when older than 60s", async () => {
            const now = new Date();
            const warnTime = new Date(now.getTime() - 120 * 1000).toISOString();

            vi.mocked(fs.stat).mockImplementation(async (p) => {
                if ((p as string).includes("latest_summary.json")) {
                    return { mtime: new Date(warnTime), size: 100 };
                }
                return Promise.reject(new Error("File not found"));
            });

            const result = await getArtifactFreshness();
            expect(result.status).toBe("WARN");
            expect(result.age_seconds).toBeGreaterThan(60);
            expect(result.age_seconds).toBeLessThan(300);
        });

        it("returns STALE_PRODUCER when producer is old but pull is recent", async () => {
            const now = new Date();
            const oldProducerTime = new Date(now.getTime() - 600 * 1000).toISOString();
            const recentPullTime = new Date(now.getTime() - 10 * 1000).toISOString();

            vi.mocked(fs.stat).mockImplementation(async (p) => {
                if ((p as string).includes("latest_summary.json")) {
                    return { mtime: new Date(oldProducerTime), size: 100 };
                }
                return { mtime: new Date(), size: 0 };
            });

            vi.mocked(fs.readFile).mockImplementation(async (p) => {
                if ((p as string).includes("status.json")) {
                    return JSON.stringify({ last_pull_utc: recentPullTime });
                }
                return "";
            });

            const result = await getArtifactFreshness();
            expect(result.status).toBe("STALE_PRODUCER");
        });
    });

    describe("getArtifactMetadata", () => {
        it("returns metadata when file exists", async () => {
            const mockMtime = new Date("2026-02-05T18:00:00Z");
            vi.mocked(fs.stat).mockResolvedValue({ mtime: mockMtime, size: 1234 });

            const result = await getArtifactMetadata("test_file.json");

            expect(result.exists).toBe(true);
            expect(result.filename).toBe("test_file.json");
            expect(result.mtime).toBe("2026-02-05T18:00:00.000Z");
            expect(result.size).toBe(1234);
        });

        it("returns not exists when file missing", async () => {
            vi.mocked(fs.stat).mockRejectedValue(new Error("ENOENT"));

            const result = await getArtifactMetadata("missing.json");

            expect(result.exists).toBe(false);
            expect(result.filename).toBe("missing.json");
            expect(result.mtime).toBeNull();
            expect(result.size).toBe(0);
        });
    });
});
