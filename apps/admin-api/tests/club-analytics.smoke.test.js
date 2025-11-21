"use strict";

const request = require("supertest");
const app = require("../src/app");
const { signSession, COOKIE_NAME } = require("../lib/jwt");
const { storeSession } = require("../lib/session-store");
const database = require("../lib/database");

describe("Club Analytics Endpoints", () => {
  let adminCookie;
  let clubCookie;
  let mockAnalysisId;

  beforeEach(() => {
    // Mock database responses
    mockAnalysisId = "test-analysis-123";

    // Setup admin user session
    const adminUserId = "admin-analytics-test";
    storeSession(adminUserId, {
      guilds: [{ id: "guild-123", name: "Test Guild" }],
      role: "admin",
      accessToken: "test",
      refreshToken: "test",
    });

    const adminToken = signSession({
      user: {
        id: adminUserId,
        username: "AnalyticsAdmin",
        globalName: "Analytics Admin",
        role: "admin",
        guilds: [{ id: "guild-123" }],
      },
    });
    adminCookie = `${COOKIE_NAME}=${adminToken}`;

    // Setup club user session
    const clubUserId = "club-analytics-test";
    storeSession(clubUserId, {
      guilds: [{ id: "guild-123", name: "Test Guild" }],
      role: "club",
      accessToken: "test",
      refreshToken: "test",
    });

    const clubToken = signSession({
      user: {
        id: clubUserId,
        username: "ClubUser",
        globalName: "Club User",
        role: "club",
        guilds: [{ id: "guild-123" }],
      },
    });
    clubCookie = `${COOKIE_NAME}=${clubToken}`;

    // Mock Prisma client
    const mockPrismaClient = {
      clubAnalysis: {
        create: jest.fn().mockResolvedValue({
          id: mockAnalysisId,
          guildId: "guild-123",
          userId: adminUserId,
          title: "Test Analysis",
          summary: "Test summary",
          confidence: 0.95,
          createdAt: new Date(),
          updatedAt: new Date(),
          images: [],
          metrics: [],
        }),
        findMany: jest.fn().mockResolvedValue([
          {
            id: mockAnalysisId,
            guildId: "guild-123",
            userId: adminUserId,
            title: "Test Analysis",
            summary: "Test summary",
            confidence: 0.95,
            createdAt: new Date(),
            updatedAt: new Date(),
            images: [],
            metrics: [],
            guild: { id: "guild-123", name: "Test Guild", discordId: "123" },
            user: { id: adminUserId, username: "AnalyticsAdmin" },
          },
        ]),
        findUnique: jest.fn().mockResolvedValue({
          id: mockAnalysisId,
          guildId: "guild-123",
          userId: adminUserId,
          title: "Test Analysis",
          summary: "Test summary",
          confidence: 0.95,
          createdAt: new Date(),
          updatedAt: new Date(),
          images: [],
          metrics: [],
          guild: { id: "guild-123", name: "Test Guild", discordId: "123" },
          user: { id: adminUserId, username: "AnalyticsAdmin" },
        }),
      },
    };

    database.getClient = jest.fn().mockReturnValue(mockPrismaClient);
  });

  describe("POST /api/club-analytics/analysis", () => {
    it("should create a new analysis (admin)", async () => {
      const res = await request(app)
        .post("/api/club-analytics/analysis")
        .set("Cookie", adminCookie)
        .set("X-CSRF-Token", "test-csrf-token")
        .send({
          guildId: "guild-123",
          title: "Test Analysis",
          summary: "This is a test analysis summary",
          confidence: 0.95,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("ok", true);
      expect(res.body).toHaveProperty("analysis");
      expect(res.body.analysis).toHaveProperty("id");
      expect(res.body.analysis).toHaveProperty("guildId", "guild-123");
      expect(res.body.analysis).toHaveProperty("summary");
    });

    it("should reject invalid input", async () => {
      const res = await request(app)
        .post("/api/club-analytics/analysis")
        .set("Cookie", adminCookie)
        .set("X-CSRF-Token", "test-csrf-token")
        .send({
          guildId: "guild-123",
          // Missing required 'summary' field
          confidence: 0.95,
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error", "invalid_input");
    });

    it("should reject non-admin users", async () => {
      const res = await request(app)
        .post("/api/club-analytics/analysis")
        .set("Cookie", clubCookie)
        .set("X-CSRF-Token", "test-csrf-token")
        .send({
          guildId: "guild-123",
          summary: "Test summary",
          confidence: 0.95,
        });

      expect(res.status).toBe(403);
    });

    it("should support optional images and metrics", async () => {
      const res = await request(app)
        .post("/api/club-analytics/analysis")
        .set("Cookie", adminCookie)
        .set("X-CSRF-Token", "test-csrf-token")
        .send({
          guildId: "guild-123",
          title: "Test with Images",
          summary: "Analysis with images and metrics",
          confidence: 0.88,
          images: [
            {
              imageUrl: "https://example.com/image.png",
              originalName: "screenshot.png",
              fileSize: 12345,
            },
          ],
          metrics: [
            {
              name: "totalMembers",
              value: 150,
              unit: "count",
              category: "membership",
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("ok", true);
    });
  });

  describe("GET /api/club-analytics/analyses", () => {
    it("should return list of analyses (club role)", async () => {
      const res = await request(app)
        .get("/api/club-analytics/analyses")
        .set("Cookie", clubCookie);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("ok", true);
      expect(res.body).toHaveProperty("analyses");
      expect(Array.isArray(res.body.analyses)).toBe(true);
      expect(res.body).toHaveProperty("count");
    });

    it("should support filtering by guildId", async () => {
      const res = await request(app)
        .get("/api/club-analytics/analyses?guildId=guild-123")
        .set("Cookie", clubCookie);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("ok", true);
      expect(res.body).toHaveProperty("analyses");
    });

    it("should reject unauthenticated requests", async () => {
      const res = await request(app).get("/api/club-analytics/analyses");

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/club-analytics/analyses/:id", () => {
    it("should return single analysis", async () => {
      const res = await request(app)
        .get(`/api/club-analytics/analyses/${mockAnalysisId}`)
        .set("Cookie", clubCookie);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("ok", true);
      expect(res.body).toHaveProperty("analysis");
      expect(res.body.analysis).toHaveProperty("id", mockAnalysisId);
      expect(res.body.analysis).toHaveProperty("guild");
      expect(res.body.analysis).toHaveProperty("user");
    });

    it("should return 404 for non-existent analysis", async () => {
      // Mock findUnique to return null
      database.getClient().clubAnalysis.findUnique.mockResolvedValueOnce(null);

      const res = await request(app)
        .get("/api/club-analytics/analyses/non-existent-id")
        .set("Cookie", clubCookie);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error", "not_found");
    });
  });
});
