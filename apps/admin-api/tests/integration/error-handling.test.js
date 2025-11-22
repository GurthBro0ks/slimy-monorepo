const request = require("supertest");

describe("Error Handling Integration", () => {
  let app;

  beforeAll(() => {
    // Set required env vars for app initialization
    process.env.CORS_ORIGIN = "http://localhost:3000";
    process.env.NODE_ENV = "test";
    process.env.DISCORD_CLIENT_ID = "test-client-id";
    process.env.DISCORD_CLIENT_SECRET = "test-client-secret";
    process.env.SESSION_SECRET = "test-session-secret";
    process.env.JWT_SECRET = "test-jwt-secret";
    process.env.DATABASE_URL = "mysql://test:test@localhost/test";

    // Load the app
    app = require("../../src/app");
  });

  afterAll(() => {
    // Clean up
    delete process.env.CORS_ORIGIN;
  });

  describe("404 Not Found", () => {
    it("should return 404 with standardized error shape for unknown routes", async () => {
      const response = await request(app)
        .get("/api/unknown-route")
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

    it("should return 404 for POST to unknown routes", async () => {
      const response = await request(app)
        .post("/api/nonexistent")
        .send({ data: "test" })
        .expect("Content-Type", /json/)
        .expect(404);

      expect(response.body).toMatchObject({
        ok: false,
        error: {
          code: "NOT_FOUND",
          requestId: expect.any(String),
        },
      });
    });

    it("should include request ID in 404 errors", async () => {
      const customRequestId = "test-404-request";

      const response = await request(app)
        .get("/api/does-not-exist")
        .set("x-request-id", customRequestId)
        .expect(404);

      expect(response.body.error.requestId).toBe(customRequestId);
    });
  });

  describe("Error Response Shape", () => {
    it("should have consistent error shape with required fields", async () => {
      const response = await request(app)
        .get("/api/nonexistent")
        .expect(404);

      // Verify error shape matches specification
      expect(response.body).toHaveProperty("ok", false);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code");
      expect(response.body.error).toHaveProperty("message");
      expect(response.body.error).toHaveProperty("requestId");

      // Verify types
      expect(typeof response.body.error.code).toBe("string");
      expect(typeof response.body.error.message).toBe("string");
      expect(typeof response.body.error.requestId).toBe("string");
    });

    it("should not include stack traces in non-development environments", async () => {
      // Ensure we're not in development
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "test";

      const response = await request(app)
        .get("/api/unknown")
        .expect(404);

      expect(response.body.error).not.toHaveProperty("stack");

      // Restore
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("Request ID Propagation", () => {
    it("should propagate request ID from header to error response", async () => {
      const requestId = "propagate-test-123";

      const response = await request(app)
        .get("/api/missing-endpoint")
        .set("x-request-id", requestId)
        .expect(404);

      expect(response.body.error.requestId).toBe(requestId);
    });

    it("should generate request ID if not provided", async () => {
      const response = await request(app)
        .get("/api/missing-endpoint")
        .expect(404);

      expect(response.body.error.requestId).toBeTruthy();
      expect(typeof response.body.error.requestId).toBe("string");
      expect(response.body.error.requestId.length).toBeGreaterThan(0);
    });
  });

  describe("JSON Error Format", () => {
    it("should return JSON errors, not HTML", async () => {
      const response = await request(app)
        .get("/api/bad-route")
        .expect("Content-Type", /json/)
        .expect(404);

      // Should be valid JSON
      expect(() => JSON.parse(JSON.stringify(response.body))).not.toThrow();

      // Should not contain HTML tags
      const bodyString = JSON.stringify(response.body);
      expect(bodyString).not.toMatch(/<html/i);
      expect(bodyString).not.toMatch(/<body/i);
    });
  });

  describe("HTTP Methods", () => {
    it("should handle GET to unknown routes", async () => {
      await request(app)
        .get("/api/xyz")
        .expect(404);
    });

    it("should handle POST to unknown routes", async () => {
      await request(app)
        .post("/api/xyz")
        .send({})
        .expect(404);
    });

    it("should handle PUT to unknown routes", async () => {
      await request(app)
        .put("/api/xyz")
        .send({})
        .expect(404);
    });

    it("should handle DELETE to unknown routes", async () => {
      await request(app)
        .delete("/api/xyz")
        .expect(404);
    });
  });
});
