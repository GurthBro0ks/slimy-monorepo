"use strict";

const express = require("express");
const request = require("supertest");

const requestIdMiddleware = require("../src/middleware/request-id");
const { errorHandler, notFoundHandler } = require("../src/middleware/error-handler");

const settingsV0Routes = require("../src/routes/settings-v0");
const settingsChangesV0Routes = require("../src/routes/settings-changes-v0");
const prismaDatabase = require("../src/lib/database");

jest.mock("../src/lib/database");

function buildTestApp(userOverrides = {}) {
  const app = express();
  app.use(requestIdMiddleware);
  app.use(express.json());

  app.use((req, _res, next) => {
    req.user = {
      id: "discord-user-1",
      discordId: "discord-user-1",
      sub: "discord-user-1",
      username: "TestUser",
      globalName: "Test User",
      avatar: null,
      role: "member",
      csrfToken: "csrf-test",
      ...userOverrides,
    };
    next();
  });

  app.use("/api/settings", settingsV0Routes);
  app.use("/api/settings", settingsChangesV0Routes);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

describe("web-settings-auth-500-v0 regression", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("GET /api/settings/user/:userId returns settings for authed self", async () => {
    const app = buildTestApp();

    const mockPrisma = {
      userSettings: {
        upsert: jest.fn(({ create }) => Promise.resolve({ userId: create.userId, data: create.data })),
      },
    };

    prismaDatabase.initialize.mockResolvedValue(true);
    prismaDatabase.getClient.mockReturnValue(mockPrisma);

    const res = await request(app).get("/api/settings/user/discord-user-1");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.settings.userId).toBe("discord-user-1");
    expect(res.body.settings.version).toBe(1);
    expect(typeof res.body.settings.updatedAt).toBe("string");
  });

  test("GET /api/settings/user/:userId forbids cross-user reads", async () => {
    const app = buildTestApp();
    const res = await request(app).get("/api/settings/user/discord-user-2");
    expect(res.status).toBe(403);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toBe("forbidden");
  });

  test("GET /api/settings/changes-v0 returns events for authed self (user scope)", async () => {
    const app = buildTestApp();

    const mockPrisma = {
      settingsChangeEvent: {
        findMany: jest.fn(() => Promise.resolve([])),
      },
    };

    prismaDatabase.initialize.mockResolvedValue(true);
    prismaDatabase.getClient.mockReturnValue(mockPrisma);

    const res = await request(app).get("/api/settings/changes-v0?scopeType=user&scopeId=discord-user-1&sinceId=0&limit=10");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.events).toEqual([]);
    expect(res.body.nextSinceId).toBe(0);
  });

  test("GET /api/settings/changes-v0 returns events for platform admin (guild scope)", async () => {
    const app = buildTestApp({ role: "admin" });

    const mockPrisma = {
      settingsChangeEvent: {
        findMany: jest.fn(() =>
          Promise.resolve([
            {
              id: 1,
              createdAt: new Date("2025-01-01T00:00:00.000Z"),
              scopeType: "guild",
              scopeId: "guild-1",
              kind: "guild_settings_updated",
              actorUserId: "discord-user-1",
              actorIsAdmin: true,
              source: "web",
              changedKeys: ["prefs.widget.enabled"],
            },
          ]),
        ),
      },
    };

    prismaDatabase.initialize.mockResolvedValue(true);
    prismaDatabase.getClient.mockReturnValue(mockPrisma);

    const res = await request(app).get("/api/settings/changes-v0?scopeType=guild&scopeId=guild-1&sinceId=0&limit=10");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.events).toHaveLength(1);
    expect(res.body.events[0]).toMatchObject({
      id: 1,
      scopeType: "guild",
      scopeId: "guild-1",
      kind: "guild_settings_updated",
      actorUserId: "discord-user-1",
      source: "web",
    });
    expect(res.body.nextSinceId).toBe(1);
  });
});

