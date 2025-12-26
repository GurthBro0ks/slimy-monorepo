"use strict";

const express = require("express");
const request = require("supertest");

const requestIdMiddleware = require("../src/middleware/request-id");
const { errorHandler, notFoundHandler } = require("../src/middleware/error-handler");

const settingsV0Routes = require("../src/routes/settings-v0");
const memoryV0Routes = require("../src/routes/memory-v0");
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
  app.use("/api/memory", memoryV0Routes);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

describe("settings+memory v0 bridge", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("GET /api/settings/user/:userId auto-inits canonical settings", async () => {
    const app = buildTestApp();

    const mockPrisma = {
      userSettings: {
        upsert: jest.fn(({ create }) => Promise.resolve({ userId: create.userId, data: create.data })),
        update: jest.fn(() => Promise.resolve({})),
      },
    };

    prismaDatabase.initialize.mockResolvedValue(true);
    prismaDatabase.getClient.mockReturnValue(mockPrisma);

    const res = await request(app).get("/api/settings/user/discord-user-1");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.settings).toHaveProperty("userId", "discord-user-1");
    expect(res.body.settings).toHaveProperty("prefs");
    expect(res.body.settings).toHaveProperty("updatedAt");
    expect(res.body.settings).toMatchObject({
      version: 1,
      profile: {},
      chat: {},
      snail: { personalSheet: { enabled: false, sheetId: null } },
    });
  });

  test("GET /api/settings/user/:userId forbids cross-user access", async () => {
    const app = buildTestApp();

    const res = await request(app).get("/api/settings/user/discord-user-2");
    expect(res.status).toBe(403);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toBe("forbidden");
  });

  test("PUT /api/settings/user/:userId validates schema", async () => {
    const app = buildTestApp();

    const mockPrisma = {
      userSettings: {
        upsert: jest.fn(() => Promise.resolve({ userId: "discord-user-1", data: {} })),
      },
    };

    prismaDatabase.initialize.mockResolvedValue(true);
    prismaDatabase.getClient.mockReturnValue(mockPrisma);

    const res = await request(app)
      .put("/api/settings/user/discord-user-1")
      .set("x-csrf-token", "csrf-test")
      .send({ userId: "discord-user-1" });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toBe("invalid_settings");
  });

  test("GET /api/memory/user/:scopeId forbids cross-user access", async () => {
    const app = buildTestApp();

    const res = await request(app).get("/api/memory/user/discord-user-2");
    expect(res.status).toBe(403);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toBe("forbidden");
  });

  test("POST /api/memory/user/:scopeId rejects project_state for non-admins", async () => {
    const app = buildTestApp();

    const res = await request(app)
      .post("/api/memory/user/discord-user-1")
      .set("x-csrf-token", "csrf-test")
      .send({ kind: "project_state", source: "system", content: { summary: "nope" } });

    expect(res.status).toBe(403);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toBe("kind_forbidden");
  });

  test("POST /api/memory/:scopeType/:scopeId rejects secret-like keys and oversized payloads", async () => {
    const app = buildTestApp({ role: "admin" });

    const mockPrisma = {
      memoryRecord: {
        findFirst: jest.fn(() => Promise.resolve(null)),
        create: jest.fn(({ data }) =>
          Promise.resolve({
            id: "mem-1",
            ...data,
            createdAt: new Date("2025-01-01T00:00:00.000Z"),
            updatedAt: new Date("2025-01-01T00:00:00.000Z"),
          }),
        ),
      },
    };

    prismaDatabase.initialize.mockResolvedValue(true);
    prismaDatabase.getClient.mockReturnValue(mockPrisma);

    const secretRes = await request(app)
      .post("/api/memory/user/discord-user-1")
      .set("x-csrf-token", "csrf-test")
      .send({ kind: "profile_summary", source: "system", content: { token: "nope" } });
    expect(secretRes.status).toBe(400);
    expect(secretRes.body.ok).toBe(false);

    const oversized = "x".repeat(20000);
    const sizeRes = await request(app)
      .post("/api/memory/user/discord-user-1")
      .set("x-csrf-token", "csrf-test")
      .send({ kind: "profile_summary", source: "system", content: { summary: oversized } });
    expect(sizeRes.status).toBe(400);
    expect(sizeRes.body.ok).toBe(false);

    const okRes = await request(app)
      .post("/api/memory/user/discord-user-1")
      .set("x-csrf-token", "csrf-test")
      .send({ kind: "profile_summary", source: "system", content: { summary: "hello" } });
    expect(okRes.status).toBe(201);
    expect(okRes.body.ok).toBe(true);
    expect(okRes.body.record).toMatchObject({
      scopeType: "user",
      scopeId: "discord-user-1",
      kind: "profile_summary",
      source: "system",
    });
  });
});
