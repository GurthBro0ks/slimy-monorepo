"use strict";

const request = require("supertest");
const app = require("../src/app");

describe("Health Endpoints", () => {
  describe("GET /api/health", () => {
    it("should return 200 OK", async () => {
      const res = await request(app).get("/api/health");
      expect(res.status).toBe(200);
    });

    it("should return valid JSON with expected fields", async () => {
      const res = await request(app).get("/api/health");
      expect(res.body).toHaveProperty("ok", true);
      expect(res.body).toHaveProperty("service", "admin-api");
      expect(res.body).toHaveProperty("env");
      expect(res.body).toHaveProperty("timestamp");
    });

    it("should return ISO timestamp", async () => {
      const res = await request(app).get("/api/health");
      const timestamp = res.body.timestamp;
      expect(timestamp).toBeDefined();
      // Verify it's a valid ISO date string
      expect(new Date(timestamp).toISOString()).toBe(timestamp);
    });
  });

  describe("GET /api/", () => {
    it("should return 200 OK", async () => {
      const res = await request(app).get("/api/");
      expect(res.status).toBe(200);
    });

    it("should return ok: true", async () => {
      const res = await request(app).get("/api/");
      expect(res.body).toEqual({ ok: true });
    });
  });
});
