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

describe("POST /api/auth/active-guild", () => {
  let app;
  let mockPrisma;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPrisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({ id: "db-user-id", discordId: "user-123" }),
        update: jest.fn().mockResolvedValue({})
      },
      userGuild: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      guild: {
        findUnique: jest.fn().mockResolvedValue({ discordId: "guild-123", name: "Test Guild" }),
      },
    };
    prismaDatabase.getClient = jest.fn(() => mockPrisma);
    prismaDatabase.client = null;

    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use((req, _res, next) => {
      req.user = { id: "user-123" };
      next();
    });
    app.use("/api/auth", authRoutes);
  });

  it("rejects guilds where bot is not installed (O(1) check)", async () => {
    sharedGuilds.getSlimyBotToken.mockReturnValue("bot-token");
    sharedGuilds.botInstalledInGuild.mockResolvedValue(false);

    const res = await request(app)
      .post("/api/auth/active-guild")
      .send({ guildId: "guild-1" });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ ok: false, error: "guild_not_shared" });
    expect(sharedGuilds.botInstalledInGuild).toHaveBeenCalledWith("guild-1", "bot-token");
  });

  it("returns 503 when bot membership check fails", async () => {
    sharedGuilds.getSlimyBotToken.mockReturnValue("bot-token");
    sharedGuilds.botInstalledInGuild.mockRejectedValue(new Error("Discord API error"));

    const res = await request(app)
      .post("/api/auth/active-guild")
      .send({ guildId: "guild-1" });

    expect(res.status).toBe(503);
    expect(res.body).toMatchObject({ ok: false, error: "bot_membership_unverifiable" });
  });

  it("returns 503 when bot token is missing", async () => {
    sharedGuilds.getSlimyBotToken.mockReturnValue("");

    const res = await request(app)
      .post("/api/auth/active-guild")
      .send({ guildId: "guild-1" });

    expect(res.status).toBe(503);
    expect(res.body).toMatchObject({ ok: false, error: "bot_token_missing" });
  });

  it("succeeds when bot is installed in guild", async () => {
    sharedGuilds.getSlimyBotToken.mockReturnValue("bot-token");
    sharedGuilds.botInstalledInGuild.mockResolvedValue(true);

    const res = await request(app)
      .post("/api/auth/active-guild")
      .send({ guildId: "guild-123" });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      ok: true,
      activeGuildId: "guild-123",
      appRole: "member",
    });
    const setCookie = res.headers["set-cookie"] || [];
    expect(setCookie.join(";")).toContain("slimy_admin_active_guild_id=");
  });

  it("returns role for primary guild based on policy logic", async () => {
    sharedGuilds.getSlimyBotToken.mockReturnValue("bot-token");
    sharedGuilds.botInstalledInGuild.mockResolvedValue(true);
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
    expect(sharedGuilds.fetchMemberRoles).toHaveBeenCalledWith(
      sharedGuilds.PRIMARY_GUILD_ID,
      "user-123",
      "bot-token"
    );
  });

  it("normalizes guildId to string", async () => {
    sharedGuilds.getSlimyBotToken.mockReturnValue("bot-token");
    sharedGuilds.botInstalledInGuild.mockResolvedValue(true);

    // Send numeric-like guildId
    const res = await request(app)
      .post("/api/auth/active-guild")
      .send({ guildId: 1234567890123456789n.toString() });

    expect(res.status).toBe(200);
    expect(res.body.activeGuildId).toBe("1234567890123456789");
    expect(sharedGuilds.botInstalledInGuild).toHaveBeenCalledWith("1234567890123456789", "bot-token");
  });
});
