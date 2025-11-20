"use strict";

const request = require("supertest");
const app = require("../src/app");
const { signSession } = require("../lib/jwt");
const { storeSession, clearSession } = require("../lib/session-store");

const COOKIE_NAME = "slimy_admin";
const TEST_GUILD_ID = "123456789012345678"; // Valid Discord snowflake
const TEST_USER_ID = "user-123456789";

// Set up test environment variables
process.env.DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "test-client-id";
process.env.DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || "test-secret";
process.env.DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || "https://example.com/callback";
process.env.SESSION_SECRET = process.env.SESSION_SECRET || "test-session-secret";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret";

describe("Input Validation Tests", () => {
  let adminCookie, editorCookie, memberCookie, csrfToken;

  beforeAll(() => {
    // Create test sessions
    storeSession("test-admin", {
      guilds: [{ id: TEST_GUILD_ID, name: "Test Guild", role: "admin" }],
      role: "admin",
      accessToken: "test-access",
      refreshToken: "test-refresh",
    });

    storeSession("test-editor", {
      guilds: [{ id: TEST_GUILD_ID, name: "Test Guild", role: "editor" }],
      role: "editor",
      accessToken: "test-access",
      refreshToken: "test-refresh",
    });

    storeSession("test-member", {
      guilds: [{ id: TEST_GUILD_ID, name: "Test Guild", role: "member" }],
      role: "member",
      accessToken: "test-access",
      refreshToken: "test-refresh",
    });

    // Create auth tokens
    const adminToken = signSession({
      user: {
        id: "test-admin",
        sub: "test-admin",
        username: "TestAdmin",
        globalName: "Test Admin",
        role: "admin",
        guilds: [{ id: TEST_GUILD_ID, role: "admin" }],
      },
    });

    const editorToken = signSession({
      user: {
        id: "test-editor",
        sub: "test-editor",
        username: "TestEditor",
        globalName: "Test Editor",
        role: "editor",
        guilds: [{ id: TEST_GUILD_ID, role: "editor" }],
      },
    });

    const memberToken = signSession({
      user: {
        id: "test-member",
        sub: "test-member",
        username: "TestMember",
        globalName: "Test Member",
        role: "member",
        guilds: [{ id: TEST_GUILD_ID, role: "member" }],
      },
    });

    adminCookie = `${COOKIE_NAME}=${adminToken}`;
    editorCookie = `${COOKIE_NAME}=${editorToken}`;
    memberCookie = `${COOKIE_NAME}=${memberToken}`;

    // Mock CSRF token (in a real app, this would be obtained from a GET request)
    csrfToken = "test-csrf-token";
  });

  afterAll(() => {
    clearSession("test-admin");
    clearSession("test-editor");
    clearSession("test-member");
  });

  describe("GET /api/auth/callback - OAuth Callback Validation", () => {
    it("should reject request with missing code parameter", async () => {
      const res = await request(app)
        .get("/api/auth/callback")
        .query({ state: "valid-state" })
        .expect(400);

      expect(res.body).toHaveProperty("ok", false);
      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toHaveProperty("code", "INVALID_REQUEST");
      expect(res.body.error).toHaveProperty("message");
      expect(res.body.error).toHaveProperty("details");
      expect(Array.isArray(res.body.error.details)).toBe(true);
    });

    it("should reject request with missing state parameter", async () => {
      const res = await request(app)
        .get("/api/auth/callback")
        .query({ code: "valid-code" })
        .expect(400);

      expect(res.body).toHaveProperty("ok", false);
      expect(res.body.error).toHaveProperty("code", "INVALID_REQUEST");
    });

    it("should reject request with empty code parameter", async () => {
      const res = await request(app)
        .get("/api/auth/callback")
        .query({ code: "", state: "valid-state" })
        .expect(400);

      expect(res.body).toHaveProperty("ok", false);
      expect(res.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: expect.stringContaining("code"),
          })
        ])
      );
    });

    it("should accept valid code and state parameters", async () => {
      // This will fail at state validation (no cookie set), but input validation passes
      await request(app)
        .get("/api/auth/callback")
        .query({ code: "valid-code", state: "valid-state" })
        .expect(302); // Redirects on validation failure
    });
  });

  describe("GET /api/auth/login - Login Validation", () => {
    it("should accept request with no query parameters", async () => {
      const res = await request(app)
        .get("/api/auth/login")
        .expect(302); // Redirects to Discord

      expect(res.headers.location).toMatch(/discord\.com/);
    });

    it("should accept request with valid redirect parameter", async () => {
      const res = await request(app)
        .get("/api/auth/login")
        .query({ redirect: "/dashboard" })
        .expect(302);

      expect(res.headers.location).toMatch(/discord\.com/);
    });

    it("should reject invalid format parameter", async () => {
      const res = await request(app)
        .get("/api/auth/login")
        .query({ format: "xml" }) // Only "json" is allowed
        .expect(400);

      expect(res.body).toHaveProperty("ok", false);
      expect(res.body.error).toHaveProperty("code", "INVALID_REQUEST");
    });
  });

  describe("DELETE /api/guilds/:guildId/corrections/:correctionId - Correction Delete Validation", () => {
    it("should reject non-numeric correction ID", async () => {
      const res = await request(app)
        .delete(`/api/guilds/${TEST_GUILD_ID}/corrections/not-a-number`)
        .set("Cookie", editorCookie)
        .set("X-CSRF-Token", csrfToken)
        .expect(400);

      expect(res.body).toHaveProperty("ok", false);
      expect(res.body.error).toHaveProperty("code", "INVALID_REQUEST");
      expect(res.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: expect.stringContaining("correctionId"),
            message: expect.stringContaining("positive integer"),
          })
        ])
      );
    });

    it("should reject negative correction ID", async () => {
      const res = await request(app)
        .delete(`/api/guilds/${TEST_GUILD_ID}/corrections/-123`)
        .set("Cookie", editorCookie)
        .set("X-CSRF-Token", csrfToken)
        .expect(400);

      expect(res.body).toHaveProperty("ok", false);
      expect(res.body.error).toHaveProperty("code", "INVALID_REQUEST");
    });

    it("should accept valid numeric correction ID", async () => {
      // This will fail at the service layer (correction not found), but validation passes
      const res = await request(app)
        .delete(`/api/guilds/${TEST_GUILD_ID}/corrections/123`)
        .set("Cookie", editorCookie)
        .set("X-CSRF-Token", csrfToken);

      // Either 404 (not found) or 204 (deleted), but not 400 (validation error)
      expect([204, 404, 403]).toContain(res.status);
    });

    it("should reject invalid guild ID format", async () => {
      const res = await request(app)
        .delete("/api/guilds/invalid-guild/corrections/123")
        .set("Cookie", editorCookie)
        .set("X-CSRF-Token", csrfToken)
        .expect(400);

      expect(res.body).toHaveProperty("ok", false);
      expect(res.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: expect.stringContaining("guildId"),
          })
        ])
      );
    });
  });

  describe("POST /api/snail/:guildId/analyze - Snail Analyze Validation", () => {
    it("should reject prompt exceeding maximum length", async () => {
      const longPrompt = "a".repeat(1001); // Max is 1000

      const res = await request(app)
        .post(`/api/snail/${TEST_GUILD_ID}/analyze`)
        .set("Cookie", memberCookie)
        .set("X-CSRF-Token", csrfToken)
        .send({ prompt: longPrompt })
        .expect(400);

      expect(res.body).toHaveProperty("ok", false);
      expect(res.body.error).toHaveProperty("code", "INVALID_REQUEST");
      expect(res.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: expect.stringContaining("prompt"),
            message: expect.stringContaining("too long"),
          })
        ])
      );
    });

    it("should accept valid prompt within length limit", async () => {
      const validPrompt = "Please analyze this screenshot";

      const res = await request(app)
        .post(`/api/snail/${TEST_GUILD_ID}/analyze`)
        .set("Cookie", memberCookie)
        .set("X-CSRF-Token", csrfToken)
        .send({ prompt: validPrompt });

      // Will fail at file upload check, but validation passes
      expect([400, 403, 413]).toContain(res.status);

      // If it's 400, it should be about missing images, not validation
      if (res.status === 400 && res.body.error) {
        expect(res.body.error.code || res.body.error).not.toBe("INVALID_REQUEST");
      }
    });

    it("should accept request with no prompt (optional field)", async () => {
      const res = await request(app)
        .post(`/api/snail/${TEST_GUILD_ID}/analyze`)
        .set("Cookie", memberCookie)
        .set("X-CSRF-Token", csrfToken)
        .send({});

      // Will fail at file upload check, but validation passes
      expect([400, 403, 413]).toContain(res.status);
    });

    it("should reject invalid guild ID format", async () => {
      const res = await request(app)
        .post("/api/snail/invalid-guild-id/analyze")
        .set("Cookie", memberCookie)
        .set("X-CSRF-Token", csrfToken)
        .send({ prompt: "test" })
        .expect(400);

      expect(res.body).toHaveProperty("ok", false);
      expect(res.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: expect.stringContaining("guildId"),
          })
        ])
      );
    });
  });

  describe("Validation Error Response Format", () => {
    it("should return consistent error format across all endpoints", async () => {
      const res = await request(app)
        .get("/api/auth/callback")
        .query({ code: "" }) // Invalid: empty code
        .expect(400);

      // Validate response structure
      expect(res.body).toMatchObject({
        ok: false,
        error: {
          code: expect.any(String),
          message: expect.any(String),
          details: expect.any(Array),
        },
      });

      // Validate details structure
      res.body.error.details.forEach(detail => {
        expect(detail).toHaveProperty("field");
        expect(detail).toHaveProperty("message");
      });
    });
  });
});
