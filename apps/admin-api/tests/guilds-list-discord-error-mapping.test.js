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

function buildTestApp() {
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
    };
    next();
  });

  app.use("/api/guilds", guildRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

describe("GET /api/guilds (Discord failure mapping)", () => {
  const app = buildTestApp();

  beforeEach(() => {
    database.initialize.mockResolvedValue(true);
    database.findUserByDiscordId.mockResolvedValue({
      id: "db-user-1",
      discordId: "discord-user-1",
      discordAccessToken: "discord-access-token-test",
    });
  });

  test("maps Discord 401/403 to 401 discord_token_invalid", async () => {
    discordGuilds.getAllUserGuildsWithBotStatus.mockRejectedValue(
      Object.assign(new Error("discord_user_guilds_failed:401"), { status: 401 }),
    );

    const res = await request(app).get("/api/guilds");
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "discord_token_invalid" });
  });

  test("maps Discord 429 to 429 discord_rate_limited", async () => {
    discordGuilds.getAllUserGuildsWithBotStatus.mockRejectedValue(
      Object.assign(new Error("discord_user_guilds_failed:429"), { status: 429 }),
    );

    const res = await request(app).get("/api/guilds");
    expect(res.status).toBe(429);
    expect(res.body).toEqual({ error: "discord_rate_limited" });
  });
});

