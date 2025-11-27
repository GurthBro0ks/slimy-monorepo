const request = require("supertest");
const express = require("express");
const statsRoutes = require("../../src/routes/stats");

// Mock config to ensure stats are enabled
jest.mock("../../src/lib/config", () => ({
    google: {
        statsSheetId: "mock-sheet-id",
        statsBaselineTitle: "Baseline"
    },
    discord: {},
    jwt: {}
}));

// Mock sheets lib
jest.mock("../../lib/sheets", () => ({
    chooseTab: jest.fn(),
    readStats: jest.fn()
}));

// Mock cache middleware
jest.mock("../../src/middleware/cache", () => ({
    cacheStats: () => (req, res, next) => next()
}));

// Mock validation schemas
jest.mock("../../src/lib/validation/schemas", () => ({
    stats: {
        summary: (req, res, next) => next()
    }
}));

describe("Stats Routes", () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use("/api/stats", statsRoutes);
    });

    it("GET /api/stats should return system metrics by default", async () => {
        const res = await request(app).get("/api/stats");
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("cpu");
        expect(res.body).toHaveProperty("memory");
        expect(res.body).toHaveProperty("uptime");
    });

    it("GET /api/stats?action=system-metrics should return metrics", async () => {
        const res = await request(app).get("/api/stats?action=system-metrics");
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("cpu");
    });

    it("GET /api/stats/events/stream should set SSE headers", () => {
        // Find the handler for /events/stream
        const layer = statsRoutes.stack.find(l => l.route && l.route.path === "/events/stream");
        expect(layer).toBeDefined();
        const handler = layer.route.stack[0].handle;

        const req = { on: jest.fn() };
        const res = {
            writeHead: jest.fn(),
            write: jest.fn(),
            on: jest.fn()
        };

        handler(req, res);

        expect(res.writeHead).toHaveBeenCalledWith(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        });
        expect(res.write).toHaveBeenCalledWith(expect.stringContaining("event: ping"));
    });
});
