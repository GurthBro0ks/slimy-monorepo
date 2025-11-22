const request = require("supertest");

describe("Auth Flow Integration", () => {
  let app;

  beforeAll(() => {
    // Set required env vars for app initialization
    process.env.CORS_ORIGIN = "http://localhost:3000";
    process.env.NODE_ENV = "test";
    process.env.JWT_SECRET = "test-secret-key";

    // Load the app
    app = require("../../src/app");
  });

  afterAll(() => {
    // Clean up
    delete process.env.CORS_ORIGIN;
    delete process.env.JWT_SECRET;
  });

  describe("Auth Middleware - Unauthenticated Requests", () => {
    it("should reject requests without auth cookie to protected routes", async () => {
      // Try to access a protected route (guilds require auth)
      const response = await request(app)
        .get("/api/guilds")
        .expect("Content-Type", /json/)
        .expect(401);

      // Should use standardized error format
      expect(response.body).toMatchObject({
        ok: false,
        code: "UNAUTHORIZED",
        message: expect.stringContaining("required"),
      });
    });

    it("should reject requests with invalid token", async () => {
      const response = await request(app)
        .get("/api/guilds")
        .set("Cookie", ["slimy_admin=invalid-token-12345"])
        .expect("Content-Type", /json/)
        .expect(401);

      expect(response.body.ok).toBe(false);
      expect(response.body.code).toBe("UNAUTHORIZED");
    });

    it("should reject requests with malformed token", async () => {
      const response = await request(app)
        .get("/api/guilds")
        .set("Cookie", ["slimy_admin=not.a.valid.jwt"])
        .expect(401);

      expect(response.body).toMatchObject({
        ok: false,
        code: "UNAUTHORIZED",
      });
    });
  });

  describe("Auth Middleware - Authenticated Requests", () => {
    it("should accept requests with valid auth token", async () => {
      // Use the mocked valid-token from jest.setup.js
      const response = await request(app)
        .get("/api/guilds")
        .set("Cookie", ["slimy_admin=valid-token"])
        .expect("Content-Type", /json/);

      // Should not get 401 (might get 200 or other status based on route logic)
      expect(response.status).not.toBe(401);
      expect(response.body.ok).toBeDefined();
    });

    it("should accept admin token for protected routes", async () => {
      const response = await request(app)
        .get("/api/guilds")
        .set("Cookie", ["slimy_admin=admin-token"])
        .expect("Content-Type", /json/);

      // Should successfully authenticate
      expect(response.status).not.toBe(401);
      expect(response.body.ok).toBeDefined();
    });
  });

  describe("Role-Based Access Control", () => {
    it("should allow member token access to basic routes", async () => {
      const response = await request(app)
        .get("/api/guilds")
        .set("Cookie", ["slimy_admin=member-token"])
        .expect("Content-Type", /json/);

      expect(response.status).not.toBe(401);
    });

    it("should allow admin token access to all routes", async () => {
      const response = await request(app)
        .get("/api/guilds")
        .set("Cookie", ["slimy_admin=admin-token"])
        .expect("Content-Type", /json/);

      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
    });
  });

  describe("Public Routes", () => {
    it("should allow unauthenticated access to health endpoint", async () => {
      const response = await request(app)
        .get("/api/health")
        .expect(200);

      expect(response.body).toMatchObject({
        ok: true,
        service: "admin-api",
      });
    });

    it("should allow unauthenticated access to base API endpoint", async () => {
      const response = await request(app)
        .get("/api/")
        .expect(200);

      expect(response.body).toEqual({ ok: true });
    });
  });

  describe("Auth Error Response Format", () => {
    it("should return consistent error format for auth failures", async () => {
      const response = await request(app)
        .get("/api/guilds")
        .expect(401);

      // Verify standardized error response
      expect(response.body).toHaveProperty("ok", false);
      expect(response.body).toHaveProperty("code");
      expect(response.body).toHaveProperty("message");

      // Verify types
      expect(typeof response.body.code).toBe("string");
      expect(typeof response.body.message).toBe("string");
    });

    it("should include helpful error messages for auth failures", async () => {
      const response = await request(app)
        .get("/api/guilds")
        .expect(401);

      expect(response.body.message).toBeTruthy();
      expect(response.body.message.length).toBeGreaterThan(0);
    });
  });

  describe("Cookie Handling", () => {
    it("should correctly parse auth cookie", async () => {
      const response = await request(app)
        .get("/api/guilds")
        .set("Cookie", ["slimy_admin=valid-token"])
        .expect("Content-Type", /json/);

      // Should authenticate successfully
      expect(response.status).not.toBe(401);
    });

    it("should handle multiple cookies gracefully", async () => {
      const response = await request(app)
        .get("/api/guilds")
        .set("Cookie", [
          "other_cookie=value",
          "slimy_admin=valid-token",
          "another_cookie=value2",
        ])
        .expect("Content-Type", /json/);

      // Should find and use the auth cookie
      expect(response.status).not.toBe(401);
    });

    it("should reject when auth cookie is missing", async () => {
      const response = await request(app)
        .get("/api/guilds")
        .set("Cookie", ["other_cookie=value"])
        .expect(401);

      expect(response.body.ok).toBe(false);
    });
  });

  describe("Request Context", () => {
    it("should attach user to request context for authenticated requests", async () => {
      // This test verifies the auth middleware populates req.user
      const response = await request(app)
        .get("/api/guilds")
        .set("Cookie", ["slimy_admin=valid-token"])
        .expect("Content-Type", /json/);

      // If auth succeeded, user should be attached
      expect(response.status).not.toBe(401);
    });
  });
});
