const request = require("supertest");
const express = require("express");
const cookieParser = require("cookie-parser");
const authRoutes = require("../../src/routes/auth");
const prismaDatabase = require("../../src/lib/database");
const sharedGuilds = require("../../src/services/discord-shared-guilds");

jest.mock("../../src/services/discord-shared-guilds", () => ({
  PRIMARY_GUILD_ID: "1176605506912141444",
  computeRoleLabelFromRoles: jest.fn(),
  fetchMemberRoles: jest.fn(),
  getSlimyBotToken: jest.fn(),
  botInstalledInGuild: jest.fn(),
}));

describe("POST /api/auth/active-guild cookie", () => {
  let app;
  let mockPrisma;
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPrisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: "db-user-id",
          discordId: "user-123",
          discordAccessToken: "discord-access-token-test",
        }),
        update: jest.fn().mockResolvedValue({})
      },
      userGuild: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      guild: {
        findUnique: jest.fn().mockResolvedValue({ id: "guild-123", name: "Guild" }),
      },
    };
    prismaDatabase.initialize = jest.fn().mockResolvedValue(true);
    prismaDatabase.getClient = jest.fn(() => mockPrisma);
    prismaDatabase.client = null;

    global.fetch = jest.fn(async (url) => {
      if (String(url).includes("/users/@me/guilds")) {
        return {
          ok: true,
          status: 200,
          json: async () => [{ id: "guild-123", name: "Guild", owner: false, permissions: "32" }],
        };
      }
      return { ok: false, status: 404, json: async () => ({}) };
    });

    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use((req, _res, next) => {
      req.user = { id: "user-123" };
      next();
    });
    app.use("/api/auth", authRoutes);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("sets slimy_admin_active_guild_id on success", async () => {
    sharedGuilds.getSlimyBotToken.mockReturnValue("bot-token");
    sharedGuilds.botInstalledInGuild.mockResolvedValue(true);

    const res = await request(app)
      .post("/api/auth/active-guild")
      .send({ guildId: "guild-123" });

    expect(res.status).toBe(200);
    const setCookie = res.headers["set-cookie"] || [];
    expect(setCookie.join(";")).toContain("slimy_admin_active_guild_id=guild-123");
  });

  it("sets cookie even when bot not installed (selection is allowed)", async () => {
    sharedGuilds.getSlimyBotToken.mockReturnValue("bot-token");
    sharedGuilds.botInstalledInGuild.mockResolvedValue(false);

    const res = await request(app)
      .post("/api/auth/active-guild")
      .send({ guildId: "guild-123" });

    expect(res.status).toBe(200);
    const setCookie = res.headers["set-cookie"] || [];
    expect(setCookie.join(";")).toContain("slimy_admin_active_guild_id=guild-123");
  });
});
