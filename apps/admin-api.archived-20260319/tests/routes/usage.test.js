const request = require("supertest");
const express = require("express");
const usageRouter = require("../../src/routes/usage");

describe("GET /api/usage", () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use("/api/usage", usageRouter);
    });

    test("should return 200 and correct usage data structure", async () => {
        const res = await request(app).get("/api/usage");

        expect(res.status).toBe(200);
        expect(res.body.ok).toBe(true);
        expect(res.body.data).toHaveProperty("level");
        expect(res.body.data).toHaveProperty("currentSpend");
        expect(res.body.data).toHaveProperty("limit");
        expect(res.body.data).toHaveProperty("modelProbeStatus");

        // Verify types
        expect(typeof res.body.data.level).toBe("string");
        expect(typeof res.body.data.currentSpend).toBe("number");
        expect(typeof res.body.data.limit).toBe("number");
        expect(typeof res.body.data.modelProbeStatus).toBe("string");
    });
});
