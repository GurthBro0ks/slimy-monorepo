"use strict";

const request = require("supertest");
const app = require("../../src/app");

// Set up test environment variables
process.env.SESSION_SECRET = process.env.SESSION_SECRET || "test-session-secret";

describe("Snail Screenshots API", () => {
  describe("GET /api/snail/screenshots/latest", () => {
    it("should return 200 with analysis structure", async () => {
      const response = await request(app)
        .get("/api/snail/screenshots/latest")
        .expect("Content-Type", /json/)
        .expect(200);

      // Verify response envelope
      expect(response.body).toHaveProperty("analysis");
      expect(response.body.analysis).toBeDefined();
    });

    it("should return expected analysis schema", async () => {
      const response = await request(app)
        .get("/api/snail/screenshots/latest")
        .expect(200);

      const { analysis } = response.body;

      // Verify required fields (may be null for stub data)
      expect(analysis).toHaveProperty("runId");
      expect(analysis).toHaveProperty("guildId");
      expect(analysis).toHaveProperty("userId");
      expect(analysis).toHaveProperty("results");

      // Results should be an array
      expect(Array.isArray(analysis.results)).toBe(true);
    });

    it("should return valid screenshot results structure", async () => {
      const response = await request(app)
        .get("/api/snail/screenshots/latest")
        .expect(200);

      const { analysis } = response.body;

      // Check if results array has items (stub data should have 2)
      expect(analysis.results.length).toBeGreaterThan(0);

      // Verify first result structure
      const firstResult = analysis.results[0];
      expect(firstResult).toHaveProperty("fileUrl");
      expect(firstResult).toHaveProperty("stats");
      expect(typeof firstResult.fileUrl).toBe("string");
      expect(typeof firstResult.stats).toBe("object");
    });

    it("should return stub data with expected content", async () => {
      const response = await request(app)
        .get("/api/snail/screenshots/latest")
        .expect(200);

      const { analysis } = response.body;

      // Verify stub data content
      expect(analysis.runId).toBe("2025-11-21T09:15:00.000Z");
      expect(analysis.guildId).toBe("stub-guild-id");
      expect(analysis.userId).toBe("stub-user-id");
      expect(analysis.results).toHaveLength(2);
    });

    it("should return valid stats in screenshot results", async () => {
      const response = await request(app)
        .get("/api/snail/screenshots/latest")
        .expect(200);

      const { analysis } = response.body;
      const firstResult = analysis.results[0];

      // Verify stats structure
      expect(firstResult.stats).toHaveProperty("simPower");
      expect(firstResult.stats).toHaveProperty("cityLevel");
      expect(firstResult.stats).toHaveProperty("snailLevel");
      expect(firstResult.stats).toHaveProperty("tier");

      // Verify data types
      expect(typeof firstResult.stats.simPower).toBe("number");
      expect(typeof firstResult.stats.cityLevel).toBe("number");
      expect(typeof firstResult.stats.snailLevel).toBe("number");
      expect(typeof firstResult.stats.tier).toBe("string");
    });

    it("should include optional metadata fields", async () => {
      const response = await request(app)
        .get("/api/snail/screenshots/latest")
        .expect(200);

      const { analysis } = response.body;
      const firstResult = analysis.results[0];

      // Verify optional fields are present in stub data
      expect(firstResult).toHaveProperty("uploadedBy");
      expect(firstResult).toHaveProperty("analyzedAt");
      expect(typeof firstResult.uploadedBy).toBe("string");
      expect(typeof firstResult.analyzedAt).toBe("string");
    });

    it("should accept query parameters without error", async () => {
      // Test with query params (currently ignored but shouldn't error)
      await request(app)
        .get("/api/snail/screenshots/latest")
        .query({ guildId: "test-guild", userId: "test-user" })
        .expect(200);
    });

    it("should handle multiple requests consistently", async () => {
      const response1 = await request(app)
        .get("/api/snail/screenshots/latest")
        .expect(200);

      const response2 = await request(app)
        .get("/api/snail/screenshots/latest")
        .expect(200);

      // Both should return same structure
      expect(response1.body.analysis.runId).toBe(response2.body.analysis.runId);
      expect(response1.body.analysis.results.length).toBe(
        response2.body.analysis.results.length
      );
    });

    it("should return consistent data types across results", async () => {
      const response = await request(app)
        .get("/api/snail/screenshots/latest")
        .expect(200);

      const { analysis } = response.body;

      // Verify all results have consistent structure
      analysis.results.forEach((result, index) => {
        expect(result).toHaveProperty("fileUrl");
        expect(result).toHaveProperty("stats");
        expect(typeof result.fileUrl).toBe("string");
        expect(typeof result.stats).toBe("object");

        // All should have these stats fields
        expect(result.stats).toHaveProperty("simPower");
        expect(result.stats).toHaveProperty("tier");
      });
    });
  });

  describe("Service Integration", () => {
    it("should use getLatestSnailAnalysisForUser service", async () => {
      const response = await request(app)
        .get("/api/snail/screenshots/latest")
        .expect(200);

      // Verify the service returned data through the route
      expect(response.body.analysis).toBeDefined();
      expect(response.body.analysis.results).toBeDefined();
    });

    it("should wrap service response in analysis envelope", async () => {
      const response = await request(app)
        .get("/api/snail/screenshots/latest")
        .expect(200);

      // Verify envelope structure
      const keys = Object.keys(response.body);
      expect(keys).toContain("analysis");
      expect(keys.length).toBe(1); // Only 'analysis' key at top level
    });
  });

  describe("Error Handling", () => {
    it("should not return 404 for valid endpoint", async () => {
      await request(app)
        .get("/api/snail/screenshots/latest")
        .expect((res) => {
          expect(res.status).not.toBe(404);
        });
    });

    it("should return JSON even with no data", async () => {
      const response = await request(app)
        .get("/api/snail/screenshots/latest")
        .expect(200);

      // Even if there's no data, should return valid structure
      expect(response.body.analysis).toBeDefined();
      expect(Array.isArray(response.body.analysis.results)).toBe(true);
    });
  });
});
