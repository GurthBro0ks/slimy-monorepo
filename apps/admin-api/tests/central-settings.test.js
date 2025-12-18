"use strict";

const express = require("express");
const cookieParser = require("cookie-parser");
const request = require("supertest");

const requestIdMiddleware = require("../src/middleware/request-id");
const { errorHandler, notFoundHandler } = require("../src/middleware/error-handler");

const meRoutes = require("../src/routes/me");
const guildRoutes = require("../src/routes/guilds");
const prismaDatabase = require("../src/lib/database");
jest.mock("../src/lib/database");

function buildTestApp(userOverrides = {}) {
  const app = express();
  app.use(requestIdMiddleware);
  app.use(express.json());
  app.use(cookieParser());

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

  app.use("/api/me", meRoutes);
  app.use("/api/guilds", guildRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

describe("central settings endpoints", () => {
  const originalFetch = global.fetch;

  beforeAll(() => {
    process.env.SLIMYAI_BOT_TOKEN = "test-bot-token";
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  test("GET /api/me/settings auto-creates defaults", async () => {
    const app = buildTestApp();
    const mockPrisma = {
      user: { upsert: jest.fn(() => Promise.resolve({ discordId: "discord-user-1" })) },
      userSettings: {
        upsert: jest.fn(({ create }) => Promise.resolve({ userId: create.userId, data: create.data })),
      },
    };

    prismaDatabase.initialize.mockResolvedValue(true);
    prismaDatabase.getClient.mockReturnValue(mockPrisma);

    const res = await request(app).get("/api/me/settings");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.settings).toMatchObject({
      version: 1,
      profile: {},
      chat: {},
      snail: { personalSheet: { enabled: false, sheetId: null } },
    });
  });

  test("PATCH /api/me/settings merges updates", async () => {
    const app = buildTestApp();
    const existing = {
      version: 1,
      profile: {},
      chat: {},
      snail: { personalSheet: { enabled: false, sheetId: null } },
    };
    const mockPrisma = {
      user: { upsert: jest.fn(() => Promise.resolve({ discordId: "discord-user-1" })) },
      userSettings: {
        findUnique: jest.fn(() => Promise.resolve({ userId: "discord-user-1", data: existing })),
        upsert: jest.fn(({ update }) =>
          Promise.resolve({ userId: "discord-user-1", data: update.data }),
        ),
      },
    };

    prismaDatabase.initialize.mockResolvedValue(true);
    prismaDatabase.getClient.mockReturnValue(mockPrisma);

    const res = await request(app)
      .patch("/api/me/settings")
      .set("x-csrf-token", "csrf-test")
      .send({ snail: { personalSheet: { enabled: true } } });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.settings.snail.personalSheet.enabled).toBe(true);
    expect(res.body.settings.snail.personalSheet.sheetId).toBe(null);
  });

  test("GET /api/guilds/:guildId/settings requires admin/manager", async () => {
    const app = buildTestApp();
    const mockPrisma = {
      guild: { findUnique: jest.fn(() => Promise.resolve({ id: "guild-123" })) },
      guildSettings: {
        upsert: jest.fn(({ create }) => Promise.resolve({ guildId: create.guildId, data: create.data })),
      },
    };

    prismaDatabase.initialize.mockResolvedValue(true);
    prismaDatabase.getClient.mockReturnValue(mockPrisma);
    prismaDatabase.findUserByDiscordId.mockResolvedValue({
      discordId: "discord-user-1",
      discordAccessToken: "test-access-token",
    });

    global.fetch = jest.fn(async (url) => {
      if (String(url).includes("/guilds/guild-123")) {
        return {
          ok: true,
          status: 200,
          headers: { get: () => null },
          json: async () => ({}),
        };
      }
      if (String(url).includes("/users/@me/guilds")) {
        return {
          ok: true,
          status: 200,
          json: async () => [{ id: "guild-123", owner: false, permissions: "0" }],
        };
      }
      return { ok: false, status: 500, json: async () => ({}) };
    });

    const res = await request(app).get("/api/guilds/guild-123/settings");
    expect(res.status).toBe(403);
  });

  test("PUT /api/guilds/:guildId/settings allows admin and persists", async () => {
    const app = buildTestApp();

    const existing = {
      version: 1,
      profile: {},
      chat: {},
      snail: { personalSheet: { enabled: false, sheetId: null } },
    };

    const mockPrisma = {
      guild: { findUnique: jest.fn(() => Promise.resolve({ id: "guild-123" })) },
      guildSettings: {
        findUnique: jest.fn(() => Promise.resolve({ guildId: "guild-123", data: existing })),
        upsert: jest.fn(({ update }) => Promise.resolve({ guildId: "guild-123", data: update.data })),
      },
    };

    prismaDatabase.initialize.mockResolvedValue(true);
    prismaDatabase.getClient.mockReturnValue(mockPrisma);
    prismaDatabase.findUserByDiscordId.mockResolvedValue({
      discordId: "discord-user-1",
      discordAccessToken: "test-access-token",
    });

    global.fetch = jest.fn(async (url) => {
      if (String(url).includes("/guilds/guild-123")) {
        return {
          ok: true,
          status: 200,
          headers: { get: () => null },
          json: async () => ({}),
        };
      }
      if (String(url).includes("/users/@me/guilds")) {
        return {
          ok: true,
          status: 200,
          json: async () => [{ id: "guild-123", owner: true, permissions: "0" }],
        };
      }
      return { ok: false, status: 500, json: async () => ({}) };
    });

    const res = await request(app)
      .put("/api/guilds/guild-123/settings")
      .set("x-csrf-token", "csrf-test")
      .send({ snail: { personalSheet: { enabled: true, sheetId: "sheet-1" } } });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.settings.snail.personalSheet.enabled).toBe(true);
    expect(res.body.settings.snail.personalSheet.sheetId).toBe("sheet-1");
  });
});
