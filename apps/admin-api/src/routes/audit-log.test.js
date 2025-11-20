"use strict";

const request = require("supertest");
const app = require("../app");
const database = require("../lib/database");
const { signSession } = require("../lib/jwt");
const { storeSession, clearSession } = require("../lib/session-store");

const COOKIE_NAME = "slimy_admin";
const TEST_USER_ID = "user-audit-test-123";
const TEST_GUILD_ID = "guild-audit-test-456";

// Set up test environment variables
process.env.DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "test-client-id";
process.env.DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || "test-secret";
process.env.DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || "https://example.com/callback";
process.env.SESSION_SECRET = process.env.SESSION_SECRET || "test-session-secret";

describe("Audit Log Routes", () => {
  let adminCookie, memberCookie;
  let createdAuditLogId;

  beforeAll(() => {
    // Create test sessions
    storeSession("test-admin-audit", {
      guilds: [{ id: TEST_GUILD_ID, name: "Test Guild", role: "admin" }],
      role: "admin",
      accessToken: "test-access",
      refreshToken: "test-refresh",
    });

    storeSession("test-member-audit", {
      guilds: [{ id: TEST_GUILD_ID, name: "Test Guild", role: "member" }],
      role: "member",
      accessToken: "test-access",
      refreshToken: "test-refresh",
    });

    // Create auth tokens
    const adminToken = signSession({
      user: {
        id: TEST_USER_ID,
        username: "TestAdmin",
        globalName: "Test Admin",
        role: "admin",
        guilds: [{ id: TEST_GUILD_ID }],
      },
    });

    const memberToken = signSession({
      user: {
        id: "test-member-audit",
        username: "TestMember",
        globalName: "Test Member",
        role: "member",
        guilds: [{ id: TEST_GUILD_ID }],
      },
    });

    adminCookie = `${COOKIE_NAME}=${adminToken}`;
    memberCookie = `${COOKIE_NAME}=${memberToken}`;
  });

  afterAll(() => {
    clearSession("test-admin-audit");
    clearSession("test-member-audit");
  });

  describe("POST /api/audit-log", () => {
    it("should create an audit log entry when authenticated", async () => {
      // Skip if database not configured
      if (!database.isConfigured()) {
        return;
      }

      const payload = {
        action: "test.action",
        resourceType: "test_resource",
        resourceId: "test-123",
        details: {
          testField: "testValue",
        },
      };

      const res = await request(app)
        .post("/api/audit-log")
        .set("Cookie", adminCookie)
        .send(payload)
        .expect(200);

      expect(res.body.ok).toBe(true);
      expect(res.body.auditLog).toBeDefined();
      expect(res.body.auditLog.action).toBe(payload.action);
      expect(res.body.auditLog.resourceType).toBe(payload.resourceType);
      expect(res.body.auditLog.resourceId).toBe(payload.resourceId);
      expect(res.body.auditLog.id).toBeDefined();

      // Save for later tests
      createdAuditLogId = res.body.auditLog.id;
    });

    it("should reject unauthenticated requests", async () => {
      const payload = {
        action: "test.action",
        resourceType: "test_resource",
        resourceId: "test-123",
      };

      await request(app)
        .post("/api/audit-log")
        .send(payload)
        .expect(401);
    });

    it("should validate required fields", async () => {
      const payload = {
        action: "test.action",
        // Missing resourceType and resourceId
      };

      await request(app)
        .post("/api/audit-log")
        .set("Cookie", adminCookie)
        .send(payload)
        .expect(400);
    });
  });

  describe("GET /api/audit-log", () => {
    it("should list audit logs for admin users", async () => {
      // Skip if database not configured
      if (!database.isConfigured()) {
        return;
      }

      const res = await request(app)
        .get("/api/audit-log")
        .set("Cookie", adminCookie)
        .expect(200);

      expect(res.body.ok).toBe(true);
      expect(Array.isArray(res.body.logs)).toBe(true);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.limit).toBeDefined();
      expect(res.body.pagination.offset).toBeDefined();
    });

    it("should support filtering by action", async () => {
      // Skip if database not configured
      if (!database.isConfigured()) {
        return;
      }

      const res = await request(app)
        .get("/api/audit-log?action=test.action")
        .set("Cookie", adminCookie)
        .expect(200);

      expect(res.body.ok).toBe(true);
      expect(Array.isArray(res.body.logs)).toBe(true);
    });

    it("should support pagination", async () => {
      // Skip if database not configured
      if (!database.isConfigured()) {
        return;
      }

      const res = await request(app)
        .get("/api/audit-log?limit=10&offset=0")
        .set("Cookie", adminCookie)
        .expect(200);

      expect(res.body.ok).toBe(true);
      expect(res.body.pagination.limit).toBe(10);
      expect(res.body.pagination.offset).toBe(0);
    });

    it("should reject non-admin users", async () => {
      await request(app)
        .get("/api/audit-log")
        .set("Cookie", memberCookie)
        .expect(403);
    });

    it("should reject unauthenticated requests", async () => {
      await request(app)
        .get("/api/audit-log")
        .expect(401);
    });
  });

  describe("GET /api/audit-log/stats", () => {
    it("should return audit log statistics for admin users", async () => {
      // Skip if database not configured
      if (!database.isConfigured()) {
        return;
      }

      const res = await request(app)
        .get("/api/audit-log/stats")
        .set("Cookie", adminCookie)
        .expect(200);

      expect(res.body.ok).toBe(true);
      expect(res.body.stats).toBeDefined();
      expect(res.body.stats.total).toBeDefined();
      expect(res.body.stats.successful).toBeDefined();
      expect(res.body.stats.failed).toBeDefined();
      expect(res.body.stats.successRate).toBeDefined();
    });

    it("should reject non-admin users", async () => {
      await request(app)
        .get("/api/audit-log/stats")
        .set("Cookie", memberCookie)
        .expect(403);
    });
  });

  describe("GET /api/audit-log/:id", () => {
    it("should get a specific audit log entry for admin users", async () => {
      // Skip if database not configured or no ID from previous test
      if (!database.isConfigured() || !createdAuditLogId) {
        return;
      }

      const res = await request(app)
        .get(`/api/audit-log/${createdAuditLogId}`)
        .set("Cookie", adminCookie)
        .expect(200);

      expect(res.body.ok).toBe(true);
      expect(res.body.log).toBeDefined();
      expect(res.body.log.id).toBe(createdAuditLogId);
    });

    it("should return 404 for non-existent audit log", async () => {
      // Skip if database not configured
      if (!database.isConfigured()) {
        return;
      }

      await request(app)
        .get("/api/audit-log/non-existent-id-12345")
        .set("Cookie", adminCookie)
        .expect(404);
    });

    it("should reject non-admin users", async () => {
      if (!createdAuditLogId) {
        return;
      }

      await request(app)
        .get(`/api/audit-log/${createdAuditLogId}`)
        .set("Cookie", memberCookie)
        .expect(403);
    });
  });
});
