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

describe("POST /api/auth/active-guild", () => {
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

  it("rejects guilds that are not shared/connectable", async () => {
    sharedGuilds.getSharedGuildsForUser.mockResolvedValue([]);

    const res = await request(app)
      .post("/api/auth/active-guild")
      .send({ guildId: "guild-1" });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ ok: false, error: "guild_not_shared" });
    expect(sharedGuilds.getSharedGuildsForUser).toHaveBeenCalledWith({
      discordAccessToken: "access-token",
      userDiscordId: "user-123",
    });
  });

  it("returns role for primary guild based on policy logic", async () => {
    sharedGuilds.getSharedGuildsForUser.mockResolvedValue([
      { id: sharedGuilds.PRIMARY_GUILD_ID, roleLabel: "member", name: "Primary" },
    ]);
    sharedGuilds.getSlimyBotToken.mockReturnValue("bot-token");
    sharedGuilds.fetchMemberRoles.mockResolvedValue(["role-1"]);
    sharedGuilds.computeRoleLabelFromRoles.mockReturnValue("club");

    const res = await request(app)
      .post("/api/auth/active-guild")
      .send({ guildId: sharedGuilds.PRIMARY_GUILD_ID });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      ok: true,
      activeGuildId: sharedGuilds.PRIMARY_GUILD_ID,
      appRole: "club",
    });
    const setCookie = res.headers["set-cookie"] || [];
    expect(setCookie.join(";")).toContain("slimy_admin_active_guild_id=");
  });
});
