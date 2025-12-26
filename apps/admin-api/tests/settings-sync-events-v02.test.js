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

describe("settings sync events v0.2", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("PUT /api/settings/user/:userId writes a settings change event", async () => {
    const app = buildTestApp();
    const now = new Date().toISOString();

    const mockPrisma = {
      userSettings: {
        findUnique: jest.fn(() => Promise.resolve({ userId: "discord-user-1", data: { userId: "discord-user-1", version: 1, updatedAt: now, prefs: { chat: { markdown: false } } } })),
        upsert: jest.fn(({ update }) => Promise.resolve({ userId: "discord-user-1", data: update.data })),
      },
      settingsChangeEvent: {
        create: jest.fn(() => Promise.resolve({ id: 1 })),
      },
      $transaction: jest.fn((ops) => Promise.all(ops)),
    };

    prismaDatabase.initialize.mockResolvedValue(true);
    prismaDatabase.getClient.mockReturnValue(mockPrisma);

    const next = { userId: "discord-user-1", version: 1, updatedAt: now, prefs: { chat: { markdown: true } } };

    const res = await request(app)
      .put("/api/settings/user/discord-user-1")
      .set("x-csrf-token", "csrf-test")
      .set("x-slimy-client", "discord")
      .send(next);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    expect(mockPrisma.settingsChangeEvent.create).toHaveBeenCalledTimes(1);
    const eventData = mockPrisma.settingsChangeEvent.create.mock.calls[0][0].data;
    expect(eventData).toMatchObject({
      scopeType: "user",
      scopeId: "discord-user-1",
      kind: "user_settings_updated",
      actorUserId: "discord-user-1",
      source: "discord",
    });
    expect(Array.isArray(eventData.changedKeys)).toBe(true);
    expect(eventData.changedKeys).toContain("prefs.chat.markdown");
  });

  test("GET /api/settings/changes-v0 returns events for the caller's user scope", async () => {
    const app = buildTestApp();

    const mockPrisma = {
      settingsChangeEvent: {
        findMany: jest.fn(() =>
          Promise.resolve([
            {
              id: 42,
              createdAt: new Date("2025-01-01T00:00:00.000Z"),
              scopeType: "user",
              scopeId: "discord-user-1",
              kind: "user_settings_updated",
              actorUserId: "discord-user-1",
              actorIsAdmin: false,
              source: "discord",
              changedKeys: ["prefs.chat.markdown"],
            },
          ]),
        ),
      },
    };

    prismaDatabase.initialize.mockResolvedValue(true);
    prismaDatabase.getClient.mockReturnValue(mockPrisma);

    const res = await request(app).get("/api/settings/changes-v0?scopeType=user&scopeId=discord-user-1&sinceId=0");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.events).toHaveLength(1);
    expect(res.body.events[0]).toMatchObject({
      id: 42,
      scopeType: "user",
      scopeId: "discord-user-1",
      kind: "user_settings_updated",
      actorUserId: "discord-user-1",
      source: "discord",
    });
    expect(res.body.nextSinceId).toBe(42);
  });

  test("GET /api/settings/changes-v0 forbids cross-user reads", async () => {
    const app = buildTestApp();
    const res = await request(app).get("/api/settings/changes-v0?scopeType=user&scopeId=discord-user-2&sinceId=0");
    expect(res.status).toBe(403);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toBe("forbidden");
  });

  test("PUT /api/settings/guild/:guildId writes a settings change event (internal bot authz)", async () => {
    const app = buildTestApp({
      authType: "internal_bot",
      interaction: { guildId: "guild-1", permissions: "32" },
    });
    const now = new Date().toISOString();

    const mockPrisma = {
      guild: {
        findUnique: jest.fn(() => Promise.resolve({ id: "guild-1", name: "Guild", ownerId: "owner-1" })),
      },
      guildSettings: {
        findUnique: jest.fn(() => Promise.resolve({ guildId: "guild-1", data: { guildId: "guild-1", version: 1, updatedAt: now, prefs: { widget: { enabled: false } } } })),
        upsert: jest.fn(({ update }) => Promise.resolve({ guildId: "guild-1", data: update.data })),
      },
      settingsChangeEvent: {
        create: jest.fn(() => Promise.resolve({ id: 2 })),
      },
      $transaction: jest.fn((ops) => Promise.all(ops)),
    };

    prismaDatabase.initialize.mockResolvedValue(true);
    prismaDatabase.getClient.mockReturnValue(mockPrisma);

    const next = { guildId: "guild-1", version: 1, updatedAt: now, prefs: { widget: { enabled: true } } };

    const res = await request(app)
      .put("/api/settings/guild/guild-1")
      .set("x-csrf-token", "csrf-test")
      .set("x-slimy-client", "discord")
      .send(next);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    expect(mockPrisma.settingsChangeEvent.create).toHaveBeenCalledTimes(1);
    const eventData = mockPrisma.settingsChangeEvent.create.mock.calls[0][0].data;
    expect(eventData).toMatchObject({
      scopeType: "guild",
      scopeId: "guild-1",
      kind: "guild_settings_updated",
      actorUserId: "discord-user-1",
      source: "discord",
    });
    expect(Array.isArray(eventData.changedKeys)).toBe(true);
    expect(eventData.changedKeys).toContain("prefs.widget.enabled");
  });

  test("GET /api/settings/changes-v0 returns guild-scoped events for authorized internal bot context", async () => {
    const app = buildTestApp({
      authType: "internal_bot",
      interaction: { guildId: "guild-1", permissions: "32" },
    });

    const mockPrisma = {
      settingsChangeEvent: {
        findMany: jest.fn(() =>
          Promise.resolve([
            {
              id: 7,
              createdAt: new Date("2025-01-01T00:00:00.000Z"),
              scopeType: "guild",
              scopeId: "guild-1",
              kind: "guild_settings_updated",
              actorUserId: "discord-user-1",
              actorIsAdmin: false,
              source: "discord",
              changedKeys: ["prefs.widget.enabled"],
            },
          ]),
        ),
      },
    };

    prismaDatabase.initialize.mockResolvedValue(true);
    prismaDatabase.getClient.mockReturnValue(mockPrisma);

    const res = await request(app).get("/api/settings/changes-v0?scopeType=guild&scopeId=guild-1&sinceId=0");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.events).toHaveLength(1);
    expect(res.body.events[0]).toMatchObject({ scopeType: "guild", scopeId: "guild-1", kind: "guild_settings_updated" });
    expect(res.body.nextSinceId).toBe(7);
  });

  test("GET /api/settings/changes-v0 forbids cross-guild reads for internal bot context", async () => {
    const app = buildTestApp({
      authType: "internal_bot",
      interaction: { guildId: "guild-1", permissions: "32" },
    });

    const res = await request(app).get("/api/settings/changes-v0?scopeType=guild&scopeId=guild-2&sinceId=0");
    expect(res.status).toBe(403);
    expect(res.body.ok).toBe(false);
  });

  test("GET /api/settings/changes-v0 rejects invalid kind filter", async () => {
    const app = buildTestApp();
    const res = await request(app).get("/api/settings/changes-v0?scopeType=user&scopeId=discord-user-1&kind=nope");
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toBe("invalid_kind");
  });
});

