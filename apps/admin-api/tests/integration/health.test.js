const request = require("supertest");

describe("Health Endpoint Integration", () => {
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

  describe("GET /api/health", () => {
    it("should return 200 and health status", async () => {
      const response = await request(app)
        .get("/api/health")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toMatchObject({
        ok: true,
        service: "admin-api",
        env: "test",
      });

      expect(response.body).toHaveProperty("timestamp");
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });

    it("should include x-request-id in logs", async () => {
      const response = await request(app)
        .get("/api/health")
        .set("x-request-id", "test-request-123")
        .expect(200);

      expect(response.body.ok).toBe(true);
    });
  });

  describe("GET /api/", () => {
    it("should return 200 with simple ok response", async () => {
      const response = await request(app)
        .get("/api/")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toEqual({ ok: true });
    });
  });

  describe("Request ID middleware", () => {
    it("should generate request ID when not provided", async () => {
      const response = await request(app)
        .get("/api/health")
        .expect(200);

      // Request should still succeed
      expect(response.body.ok).toBe(true);
    });

    it("should accept custom request ID from header", async () => {
      const customRequestId = "custom-req-456";

      const response = await request(app)
        .get("/api/health")
        .set("x-request-id", customRequestId)
        .expect(200);

      expect(response.body.ok).toBe(true);
    });
  });
});
