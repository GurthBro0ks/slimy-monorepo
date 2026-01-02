"use strict";

const express = require("express");
const cookieParser = require("cookie-parser");
const request = require("supertest");

const guildRoutes = require("../src/routes/guilds");
const { errorHandler, notFoundHandler } = require("../src/middleware/error-handler");
const requestIdMiddleware = require("../src/middleware/request-id");

const database = require("../src/lib/database");
const discordGuilds = require("../src/services/discord-shared-guilds");

jest.mock("../src/lib/database");
jest.mock("../src/services/discord-shared-guilds");

function buildTestApp(userOverrides = {}) {
  const app = express();

  app.use(requestIdMiddleware);
  app.use(express.json());
  app.use(cookieParser());

  app.use((req, _res, next) => {
    req.user = {
      id: "discord-user-1",
      discordId: "discord-user-1",
      username: "Test User",
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

describe("GET /api/guilds (botInstalled fallback)", () => {
  const app = buildTestApp();

  beforeEach(() => {
    database.initialize.mockResolvedValue(true);
    database.findUserByDiscordId.mockResolvedValue({
      id: "db-user-1",
      discordId: "discord-user-1",
      discordAccessToken: "discord-access-token-test",
    });
  });

  test("patches botInstalled=true for guilds present in DB", async () => {
    discordGuilds.getAllUserGuildsWithBotStatus.mockResolvedValue([
      {
        id: "guild-1",
        name: "Guild One",
        botInstalled: false,
        installed: false,
        botInGuild: false,
        connectable: false,
        manageable: true,
        roleLabel: "admin",
      },
      {
        id: "guild-2",
        name: "Guild Two",
        botInstalled: false,
        installed: false,
        botInGuild: false,
        connectable: false,
        manageable: true,
        roleLabel: "admin",
      },
    ]);

    const mockPrisma = {
      guild: {
        findMany: jest.fn().mockResolvedValue([{ id: "guild-1" }]),
      },
    };
    database.getClient.mockReturnValue(mockPrisma);

    const res = await request(app).get("/api/guilds");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.guilds)).toBe(true);

    const g1 = res.body.guilds.find((g) => g.id === "guild-1");
    const g2 = res.body.guilds.find((g) => g.id === "guild-2");

    expect(g1).toMatchObject({
      id: "guild-1",
      botInstalled: true,
      installed: true,
      botInGuild: true,
      connectable: true,
    });
    expect(g2).toMatchObject({
      id: "guild-2",
      botInstalled: false,
      installed: false,
      botInGuild: false,
      connectable: false,
    });

    expect(mockPrisma.guild.findMany).toHaveBeenCalledWith({
      where: { id: { in: ["guild-1", "guild-2"] } },
      select: { id: true },
    });
  });
});

