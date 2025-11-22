"use strict";

process.env.DISCORD_CLIENT_ID ||= "1234567890123456789";
process.env.DISCORD_CLIENT_SECRET ||= "test-secret-with-minimum-length-requirement";
process.env.SESSION_SECRET ||= "test-session-secret-with-minimum-32-chars-required-for-security";
process.env.JWT_SECRET ||= "test-jwt-secret-with-minimum-32-characters-required-for-security";
process.env.OPENAI_API_KEY ||= "sk-test-key-for-validation";
process.env.CORS_ORIGIN ||= "http://localhost:3000";
process.env.DATABASE_URL ||= "postgresql://test:test@localhost:5432/test";

const request = require("supertest");
const express = require("express");

// Import the middlewares and handlers we want to test
const requestIdMiddleware = require("../src/middleware/request-id");
const { requestLogger } = require("../src/lib/logger");
const { errorHandler, notFoundHandler } = require("../src/middleware/error-handler");

// Create a minimal test app with just the observability features
function createTestApp() {
  const app = express();

  // Track app start time for uptime calculation (same as routes/index.js)
  const APP_START_TIME = Date.now();

  // Add our observability middlewares
  app.use(requestIdMiddleware);
  app.use(requestLogger);
  app.use(express.json());

  // Add test routes including health and status endpoints
  app.get("/api/health", (_req, res) => {
    const uptime = Math.floor((Date.now() - APP_START_TIME) / 1000);
    res.json({
      status: "ok",
      uptime,
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    });
  });

  app.get("/api/status", (_req, res) => {
    const uptime = Math.floor((Date.now() - APP_START_TIME) / 1000);
    res.json({
      status: "ok",
      uptime,
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
      subsystems: {
        database: "not_configured",
        redis: "unknown",
      },
    });
  });

  // Add a test route that throws an error
  app.get("/api/test-error", () => {
    throw new Error("Test error");
  });

  // Add error handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

const app = createTestApp();

describe("Observability Features", () => {
  describe("GET /api/health", () => {
    it("should return 200 status", async () => {
      const response = await request(app).get("/api/health");
      expect(response.status).toBe(200);
    });

    it("should return status ok", async () => {
      const response = await request(app).get("/api/health");
      expect(response.body.status).toBe("ok");
    });

    it("should return uptime in seconds", async () => {
      const response = await request(app).get("/api/health");
      expect(response.body).toHaveProperty("uptime");
      expect(typeof response.body.uptime).toBe("number");
      expect(response.body.uptime).toBeGreaterThanOrEqual(0);
    });

    it("should return timestamp in ISO format", async () => {
      const response = await request(app).get("/api/health");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it("should return version", async () => {
      const response = await request(app).get("/api/health");
      expect(response.body).toHaveProperty("version");
      expect(typeof response.body.version).toBe("string");
    });

    it("should include X-Request-ID header in response", async () => {
      const response = await request(app).get("/api/health");
      expect(response.headers["x-request-id"]).toBeDefined();
    });

    it("should use provided X-Request-ID if present", async () => {
      const testRequestId = "test-request-12345";
      const response = await request(app)
        .get("/api/health")
        .set("X-Request-ID", testRequestId);

      expect(response.headers["x-request-id"]).toBe(testRequestId);
    });
  });

  describe("GET /api/status", () => {
    it("should return 200 status", async () => {
      const response = await request(app).get("/api/status");
      expect(response.status).toBe(200);
    });

    it("should return detailed status information", async () => {
      const response = await request(app).get("/api/status");

      expect(response.body).toHaveProperty("status", "ok");
      expect(response.body).toHaveProperty("uptime");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("version");
      expect(response.body).toHaveProperty("environment");
      expect(response.body).toHaveProperty("subsystems");
    });

    it("should return subsystem status", async () => {
      const response = await request(app).get("/api/status");

      expect(response.body.subsystems).toHaveProperty("database");
      expect(response.body.subsystems).toHaveProperty("redis");
    });
  });

  describe("Error Handler", () => {
    it("should return 404 for non-existent routes", async () => {
      const response = await request(app).get("/api/non-existent-route");
      expect(response.status).toBe(404);
    });

    it("should return standardized error JSON for 404", async () => {
      const response = await request(app).get("/api/non-existent-route");

      expect(response.body).toHaveProperty("ok", false);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code");
      expect(response.body.error).toHaveProperty("message");
      expect(response.body.error).toHaveProperty("requestId");
    });

    it("should include request ID in error response", async () => {
      const testRequestId = "error-test-12345";
      const response = await request(app)
        .get("/api/non-existent-route")
        .set("X-Request-ID", testRequestId);

      expect(response.body.error.requestId).toBe(testRequestId);
    });

    it("should return error code NOT_FOUND for 404", async () => {
      const response = await request(app).get("/api/non-existent-route");
      expect(response.body.error.code).toBe("NOT_FOUND");
    });
  });

  describe("Request ID Middleware", () => {
    it("should generate request ID if not provided", async () => {
      const response = await request(app).get("/api/health");

      expect(response.headers["x-request-id"]).toBeDefined();
      expect(response.headers["x-request-id"].length).toBeGreaterThan(0);
    });

    it("should preserve request ID across middleware chain", async () => {
      const testRequestId = "preservation-test-12345";
      const response = await request(app)
        .get("/api/health")
        .set("X-Request-ID", testRequestId);

      expect(response.headers["x-request-id"]).toBe(testRequestId);
    });
  });
});
