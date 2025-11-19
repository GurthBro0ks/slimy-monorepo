"use strict";

const request = require("supertest");
const app = require("../../src/app");
const { signSession } = require("../../lib/jwt");
const { storeSession, clearSession } = require("../../lib/session-store");

const COOKIE_NAME = "slimy_admin";
const TEST_USER_ID = "test-debug-user";

describe("Debug Routes", () => {
  beforeEach(() => {
    clearSession(TEST_USER_ID);
  });

  afterAll(() => {
    clearSession(TEST_USER_ID);
  });

  describe("GET /api/ping", () => {
    it("should be publicly accessible without authentication", async () => {
      const res = await request(app)
        .get("/api/ping")
        .expect(200);

      expect(res.body).toHaveProperty("ok", true);
      expect(res.body).toHaveProperty("now");
    });
  });

  describe("GET /api/auth/debug", () => {
    it("should reject unauthenticated requests with 401", async () => {
      await request(app)
        .get("/api/auth/debug")
        .expect(401);
    });

    it("should allow authenticated users to access debug info", async () => {
      // Store session
      storeSession(TEST_USER_ID, {
        guilds: [
          { id: "guild-1", name: "Test Guild 1" },
          { id: "guild-2", name: "Test Guild 2" }
        ],
        role: "member",
        accessToken: "test-access-token",
        refreshToken: "test-refresh-token",
      });

      // Create valid session token
      const token = signSession({
        user: {
          id: TEST_USER_ID,
          username: "TestDebugUser",
          globalName: "Test Debug User",
          role: "member",
        },
      });

      const res = await request(app)
        .get("/api/auth/debug")
        .set("Cookie", [`${COOKIE_NAME}=${token}`])
        .expect(200);

      expect(res.body).toHaveProperty("ok", true);
      expect(res.body).toHaveProperty("authenticated", true);
      expect(res.body).toHaveProperty("user");
      expect(res.body.user).toHaveProperty("id", TEST_USER_ID);
      expect(res.body.user).toHaveProperty("username", "TestDebugUser");
      expect(res.body.user).toHaveProperty("role", "member");
      expect(res.body).toHaveProperty("guildCount", 2);
    });

    it("should expose correct guild count for authenticated user", async () => {
      // Store session with multiple guilds
      storeSession("multi-guild-user", {
        guilds: [
          { id: "guild-1", name: "Guild 1" },
          { id: "guild-2", name: "Guild 2" },
          { id: "guild-3", name: "Guild 3" },
        ],
        role: "admin",
        accessToken: "test-access",
        refreshToken: "test-refresh",
      });

      const token = signSession({
        user: {
          id: "multi-guild-user",
          username: "MultiGuildUser",
          globalName: "Multi Guild User",
          role: "admin",
        },
      });

      const res = await request(app)
        .get("/api/auth/debug")
        .set("Cookie", [`${COOKIE_NAME}=${token}`])
        .expect(200);

      expect(res.body.guildCount).toBe(3);
      expect(res.body.user.role).toBe("admin");
      clearSession("multi-guild-user");
    });

    it("should not leak sensitive token data in response", async () => {
      storeSession("no-leak-test", {
        guilds: [],
        role: "member",
        accessToken: "super-secret-access-token",
        refreshToken: "super-secret-refresh-token",
      });

      const token = signSession({
        user: {
          id: "no-leak-test",
          username: "NoLeakTest",
          globalName: "No Leak Test",
          role: "member",
        },
      });

      const res = await request(app)
        .get("/api/auth/debug")
        .set("Cookie", [`${COOKIE_NAME}=${token}`])
        .expect(200);

      // Response should not contain tokens or sensitive session data
      const responseString = JSON.stringify(res.body);
      expect(responseString).not.toContain("super-secret-access-token");
      expect(responseString).not.toContain("super-secret-refresh-token");
      expect(res.body).not.toHaveProperty("accessToken");
      expect(res.body).not.toHaveProperty("refreshToken");

      clearSession("no-leak-test");
    });
  });
});
