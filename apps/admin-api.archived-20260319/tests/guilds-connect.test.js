"use strict";

const express = require("express");
const cookieParser = require("cookie-parser");
const request = require("supertest");
const guildRoutes = require("../src/routes/guilds");
const { errorHandler, notFoundHandler } = require("../src/middleware/error-handler");
const requestIdMiddleware = require("../src/middleware/request-id");
const guildService = require("../src/services/guild.service");
const database = require("../src/lib/database");

function buildTestApp(userOverrides = {}) {
  const app = express();

  app.use(requestIdMiddleware);
  app.use(express.json());
  app.use(cookieParser());

  // Pre-authenticate the request to focus tests on route behavior
  app.use((req, _res, next) => {
    req.user = {
      id: "discord-user-1",
      sub: "discord-user-1",
      username: "Guild Owner",
      globalName: "Guild Owner",
      avatar: null,
      role: "member",
      ...userOverrides,
    };
    next();
  });

  app.use("/api/guilds", guildRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

describe("POST /api/guilds/connect", () => {
  const authCookie = "slimy_admin=valid-token";
  const frontendPayload = { guildId: "guild-1", name: "Guild One", icon: "icon.png" };

  const app = buildTestApp();
  let mockPrisma;
  let ownerRecord;
  let guildRecord;

  beforeEach(() => {
    ownerRecord = {
      id: "db-admin-1",
      discordId: "discord-user-1",
      username: "Guild Owner",
      globalName: "Guild Owner",
      avatar: null,
      createdAt: new Date("2025-01-01T00:00:00.000Z"),
      updatedAt: new Date("2025-01-01T00:00:00.000Z"),
    };

    guildRecord = {
      id: "guild-1",
      name: "Guild One",
      icon: "icon.png",
      ownerId: ownerRecord.id,
      settings: {},
      createdAt: new Date("2025-02-01T00:00:00.000Z"),
      updatedAt: new Date("2025-02-01T00:00:00.000Z"),
      _count: { userGuilds: 0, chatMessages: 0 },
    };

    mockPrisma = {
      user: {
        upsert: jest.fn().mockResolvedValue(ownerRecord),
      },
      guild: {
        upsert: jest.fn().mockResolvedValue(guildRecord),
      },
      userGuild: {
        upsert: jest.fn().mockResolvedValue({
          userId: ownerRecord.id,
          guildId: guildRecord.id,
          roles: ["owner", "admin"],
        }),
      },
    };

    database.getClient.mockReturnValue(mockPrisma);
  });

  const postConnect = (payload = frontendPayload) =>
    request(app)
      .post("/api/guilds/connect")
      .set("Cookie", authCookie)
      .send(payload);

  test("should return 200 when connecting with valid frontend payload", async () => {
    const res = await postConnect();
    if (res.status !== 200) {
      // Aid debugging if the API returns an unexpected error during tests
      // eslint-disable-next-line no-console
      console.log("connect response", res.status, res.body);
    }
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: frontendPayload.guildId,
      name: frontendPayload.name,
      icon: frontendPayload.icon,
    });
  });

  test("should return 200 if guild is ALREADY connected", async () => {
    await postConnect().expect(200);
    const res = await postConnect();
    if (res.status !== 200) {
      // eslint-disable-next-line no-console
      console.log("repeat connect response", res.status, res.body);
    }
    expect(res.status).toBe(200);

    expect(res.body.id).toBe(frontendPayload.guildId);
  });

  test("should return 400 if guild ID is missing", async () => {
    const res = await postConnect({ name: "Guild One", icon: null });
    if (res.status !== 400) {
      // eslint-disable-next-line no-console
      console.log("missing guildId response", res.status, res.body);
    }
    expect(res.status).toBe(400);

    expect(res.body.error || res.body.code).toBeDefined();
  });
});

describe("guildService.connectGuild", () => {
  let mockPrisma;
  let ownerRecord;
  let guildRecord;

  beforeEach(() => {
    ownerRecord = {
      id: "db-admin-1",
      discordId: "discord-user-1",
      username: "Guild Owner",
      globalName: "Guild Owner",
      avatar: null,
      createdAt: new Date("2025-01-01T00:00:00.000Z"),
      updatedAt: new Date("2025-01-01T00:00:00.000Z"),
    };

    guildRecord = {
      id: "guild-1",
      name: "Guild One",
      icon: null,
      ownerId: ownerRecord.id,
      settings: {},
      createdAt: new Date("2025-02-01T00:00:00.000Z"),
      updatedAt: new Date("2025-02-01T00:00:00.000Z"),
      _count: { userGuilds: 0, chatMessages: 0 },
    };

    mockPrisma = {
      user: {
        upsert: jest.fn().mockResolvedValue(ownerRecord),
      },
      guild: {
        upsert: jest.fn().mockResolvedValue(guildRecord),
      },
      userGuild: {
        upsert: jest.fn().mockResolvedValue({
          userId: ownerRecord.id,
          guildId: guildRecord.id,
          roles: ["owner", "admin"],
        }),
      },
    };

    database.getClient.mockReturnValue(mockPrisma);
  });

  test("upserts owner by discord id and links guild to the owner", async () => {
    const result = await guildService.connectGuild(
      {
        id: "discord-user-1",
        username: "Guild Owner",
        globalName: "Guild Owner",
        avatar: null,
      },
      { guildId: "guild-1", name: "Guild One", icon: null },
    );

    expect(mockPrisma.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { discordId: "discord-user-1" },
      }),
    );
    expect(mockPrisma.guild.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "guild-1" },
        update: expect.objectContaining({ ownerId: ownerRecord.id }),
        create: expect.objectContaining({ ownerId: ownerRecord.id }),
      }),
    );
    expect(mockPrisma.userGuild.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_guildId: { userId: ownerRecord.id, guildId: guildRecord.id },
        },
      }),
    );
    expect(result.ownerId).toBe(ownerRecord.id);
    expect(result.id).toBe(guildRecord.id);
  });
});
