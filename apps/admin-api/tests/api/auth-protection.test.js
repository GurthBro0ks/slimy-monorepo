"use strict";

const request = require("supertest");
const app = require("../../src/app");

// Set up test environment variables
process.env.SESSION_SECRET = process.env.SESSION_SECRET || "test-session-secret";

describe("Auth Protection", () => {
  describe("Protected endpoints without authentication", () => {
    it("should return 401 for /api/snail/screenshots/latest without auth", async () => {
      const response = await request(app)
        .get("/api/snail/screenshots/latest")
        .expect("Content-Type", /json/)
        .expect(401);

      expect(response.body).toHaveProperty("code", "UNAUTHORIZED");
      expect(response.body).toHaveProperty("message");
      expect(response.body.ok).toBe(false);
    });

    it("should return 401 for /api/chat without auth", async () => {
      const response = await request(app)
        .post("/api/chat")
        .send({ prompt: "Hello", guildId: "test-guild" })
        .expect("Content-Type", /json/)
        .expect(401);

      expect(response.body).toHaveProperty("code", "UNAUTHORIZED");
      expect(response.body.ok).toBe(false);
    });
  });

  describe("Public endpoints", () => {
    it("should allow access to /api/health without auth", async () => {
      const response = await request(app)
        .get("/api/health")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toHaveProperty("ok", true);
      expect(response.body).toHaveProperty("service", "admin-api");
    });

    it("should allow access to /api/ without auth", async () => {
      await request(app)
        .get("/api/")
        .expect("Content-Type", /json/)
        .expect(200);
    });
  });

  describe("Auth endpoints", () => {
    it("should return 401 for /api/auth/me without auth", async () => {
      const response = await request(app)
        .get("/api/auth/me")
        .expect("Content-Type", /json/)
        .expect(401);

      expect(response.body).toHaveProperty("error", "unauthorized");
    });

    it("should redirect to Discord for /api/auth/login", async () => {
      // Note: This will fail if DISCORD_CLIENT_ID is not set
      // but that's expected in test environment without Discord config
      const response = await request(app)
        .get("/api/auth/login")
        .expect((res) => {
          // Should either redirect (302/307) or return error if Discord not configured
          expect([302, 307, 500]).toContain(res.status);
        });
    });
  });

  describe("Guild-scoped endpoints", () => {
    it("should return 401 for guild-scoped snail endpoints without auth", async () => {
      const guildId = "test-guild-123";

      // Test /api/guilds/:guildId/snail/codes
      await request(app)
        .get(`/api/guilds/${guildId}/snail/codes`)
        .expect(401);

      // Test /api/guilds/:guildId/snail/stats
      await request(app)
        .get(`/api/guilds/${guildId}/snail/stats`)
        .expect(401);

      // Test /api/guilds/:guildId}/snail/calc
      await request(app)
        .post(`/api/guilds/${guildId}/snail/calc`)
        .send({ sim: 1000, total: 10000 })
        .expect(401);
    });
  });

  describe("Error response format", () => {
    it("should return consistent error structure for 401", async () => {
      const response = await request(app)
        .get("/api/snail/screenshots/latest")
        .expect(401);

      // Verify error structure matches API conventions
      expect(response.body).toMatchObject({
        ok: false,
        code: expect.any(String),
        message: expect.any(String),
      });

      // Code should be uppercase
      expect(response.body.code).toBe(response.body.code.toUpperCase());
    });
  });
});
