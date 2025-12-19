const request = require("supertest");
const express = require("express");
const cookieParser = require("cookie-parser");
const authRoutes = require("../../src/routes/auth");
const prismaDatabase = require("../../src/lib/database");
const sharedGuilds = require("../../src/services/discord-shared-guilds");

jest.mock("../../src/services/discord-shared-guilds", () => ({
  PRIMARY_GUILD_ID: "primary-guild",
  getSharedGuildsForUser: jest.fn(),
  computeRoleLabelFromRoles: jest.fn(),
  fetchMemberRoles: jest.fn(),
  getSlimyBotToken: jest.fn(),
}));

describe("POST /api/auth/active-guild cookie", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    prismaDatabase.getClient = jest.fn(() => ({ user: { update: jest.fn() } }));
    prismaDatabase.client = null;

    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use((req, _res, next) => {
      req.user = { id: "user-123", discordAccessToken: "access-token" };
      next();
    });
    app.use("/api/auth", authRoutes);
  });

  it("sets slimy_admin_active_guild_id on success", async () => {
    sharedGuilds.getSharedGuildsForUser.mockResolvedValue([
      { id: "guild-123", roleLabel: "member", name: "Guild" },
    ]);

    const res = await request(app)
      .post("/api/auth/active-guild")
      .send({ guildId: "guild-123" });

    expect(res.status).toBe(200);
    const setCookie = res.headers["set-cookie"] || [];
    expect(setCookie.join(";")).toContain("slimy_admin_active_guild_id=");
  });
});
