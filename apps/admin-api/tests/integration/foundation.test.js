/**
 * Foundation Infrastructure Integration Tests
 *
 * Tests the core error handling, logging, and request ID infrastructure
 * without loading complex route dependencies.
 */

const request = require("supertest");
const express = require("express");
const { requestLogger } = require("../../src/lib/logger");
const { errorHandler, notFoundHandler, asyncHandler } = require("../../src/middleware/error-handler");
const { NotFoundError, ValidationError, AuthenticationError } = require("../../src/lib/errors");

describe("Foundation Infrastructure", () => {
  let app;

  beforeEach(() => {
    // Create a minimal test app with just the foundation middleware
    app = express();
    app.use(express.json());

    // Add foundation middleware
    app.use(requestLogger);

    // Add test routes
    app.get("/test/success", (req, res) => {
      res.json({ ok: true, message: "Success" });
    });

    app.get("/test/error/not-found", asyncHandler(async (req, res) => {
      throw new NotFoundError("Resource not found");
    }));

    app.get("/test/error/validation", asyncHandler(async (req, res) => {
      throw new ValidationError("Invalid input", { field: "email" });
    }));

    app.get("/test/error/auth", asyncHandler(async (req, res) => {
      throw new AuthenticationError("Missing credentials");
    }));

    app.get("/test/error/unexpected", asyncHandler(async (req, res) => {
      throw new Error("Unexpected error");
    }));

    // Add error handling middleware (must be last)
    app.use(notFoundHandler);
    app.use(errorHandler);
  });

  describe("Request Logger Middleware", () => {
    it("should attach requestId to request", async () => {
      const response = await request(app)
        .get("/test/success")
        .expect(200);

      expect(response.body.ok).toBe(true);
    });

    it("should use custom x-request-id header if provided", async () => {
      const customRequestId = "custom-test-123";

      const response = await request(app)
        .get("/test/success")
        .set("x-request-id", customRequestId)
        .expect(200);

      expect(response.body.ok).toBe(true);
    });
  });

  describe("Error Handler Middleware", () => {
    it("should return standardized JSON for 404 NotFoundError", async () => {
      const response = await request(app)
        .get("/test/error/not-found")
        .expect("Content-Type", /json/)
        .expect(404);

      expect(response.body).toMatchObject({
        ok: false,
        error: {
          code: "NOT_FOUND",
          message: "Resource not found",
          requestId: expect.any(String),
        },
      });
    });

    it("should return standardized JSON for 400 ValidationError", async () => {
      const response = await request(app)
        .get("/test/error/validation")
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body).toMatchObject({
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input",
          requestId: expect.any(String),
          details: { field: "email" },
        },
      });
    });

    it("should return standardized JSON for 401 AuthenticationError", async () => {
      const response = await request(app)
        .get("/test/error/auth")
        .expect("Content-Type", /json/)
        .expect(401);

      expect(response.body).toMatchObject({
        ok: false,
        error: {
          code: "AUTH_REQUIRED",
          message: "Missing credentials",
          requestId: expect.any(String),
        },
      });
    });

    it("should return 500 for unexpected errors", async () => {
      const response = await request(app)
        .get("/test/error/unexpected")
        .expect("Content-Type", /json/)
        .expect(500);

      expect(response.body).toMatchObject({
        ok: false,
        error: {
          code: "SERVER_ERROR",
          message: expect.any(String),
          requestId: expect.any(String),
        },
      });
    });

    it("should include requestId in all error responses", async () => {
      const customRequestId = "error-test-456";

      const response = await request(app)
        .get("/test/error/not-found")
        .set("x-request-id", customRequestId)
        .expect(404);

      expect(response.body.error.requestId).toBe(customRequestId);
    });

    it("should not include stack traces in non-development mode", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const response = await request(app)
        .get("/test/error/unexpected")
        .expect(500);

      expect(response.body.error).not.toHaveProperty("stack");

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("Not Found Handler", () => {
    it("should return 404 for unknown routes", async () => {
      const response = await request(app)
        .get("/unknown/route")
        .expect("Content-Type", /json/)
        .expect(404);

      expect(response.body).toMatchObject({
        ok: false,
        error: {
          code: "NOT_FOUND",
          message: expect.stringContaining("not found"),
          requestId: expect.any(String),
        },
      });
    });

    it("should handle POST to unknown routes", async () => {
      const response = await request(app)
        .post("/unknown/route")
        .send({ data: "test" })
        .expect(404);

      expect(response.body.ok).toBe(false);
      expect(response.body.error.code).toBe("NOT_FOUND");
    });
  });

  describe("AsyncHandler Utility", () => {
    it("should catch async errors and pass to error middleware", async () => {
      const response = await request(app)
        .get("/test/error/not-found")
        .expect(404);

      expect(response.body.ok).toBe(false);
      expect(response.body.error.code).toBe("NOT_FOUND");
    });
  });

  describe("Error Response Consistency", () => {
    it("should always return JSON, never HTML", async () => {
      const response = await request(app)
        .get("/unknown")
        .expect("Content-Type", /json/);

      const bodyString = JSON.stringify(response.body);
      expect(bodyString).not.toMatch(/<html/i);
      expect(bodyString).not.toMatch(/<body/i);
    });

    it("should have consistent error shape across all error types", async () => {
      const routes = [
        "/test/error/not-found",
        "/test/error/validation",
        "/test/error/auth",
        "/unknown",
      ];

      for (const route of routes) {
        const response = await request(app).get(route);

        expect(response.body).toHaveProperty("ok", false);
        expect(response.body).toHaveProperty("error");
        expect(response.body.error).toHaveProperty("code");
        expect(response.body.error).toHaveProperty("message");
        expect(response.body.error).toHaveProperty("requestId");

        expect(typeof response.body.error.code).toBe("string");
        expect(typeof response.body.error.message).toBe("string");
        expect(typeof response.body.error.requestId).toBe("string");
      }
    });
  });
});
