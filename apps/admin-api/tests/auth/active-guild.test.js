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
  let mockUserGuilds;
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
        findUnique: jest.fn().mockResolvedValue({ id: "guild-123", name: "Test Guild" }),
      },
    };
    prismaDatabase.initialize = jest.fn().mockResolvedValue(true);
    prismaDatabase.getClient = jest.fn(() => mockPrisma);
    prismaDatabase.client = null;

    mockUserGuilds = [
      { id: "guild-1", name: "Guild One", owner: false, permissions: "32" },
      { id: "guild-123", name: "Test Guild", owner: false, permissions: "32" },
      { id: sharedGuilds.PRIMARY_GUILD_ID, name: "Primary Guild", owner: false, permissions: "32" },
    ];

    global.fetch = jest.fn(async (url) => {
      if (String(url).includes("/users/@me/guilds")) {
        return {
          ok: true,
          status: 200,
          json: async () => mockUserGuilds,
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

  it("allows selecting manageable guild even when bot not installed", async () => {
    sharedGuilds.getSlimyBotToken.mockReturnValue("bot-token");
    sharedGuilds.botInstalledInGuild.mockResolvedValue(false);

    const res = await request(app)
      .post("/api/auth/active-guild")
      .send({ guildId: "guild-1" });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      ok: true,
      activeGuildId: "guild-1",
      manageable: true,
      botInstalled: false,
    });
    expect(sharedGuilds.botInstalledInGuild).toHaveBeenCalledWith("guild-1", "bot-token");
  });

  it("allows selection when bot membership check fails (no retry-spam 400)", async () => {
    sharedGuilds.getSlimyBotToken.mockReturnValue("bot-token");
    sharedGuilds.botInstalledInGuild.mockRejectedValue(new Error("Discord API error"));

    const res = await request(app)
      .post("/api/auth/active-guild")
      .send({ guildId: "guild-1" });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true, activeGuildId: "guild-1", botInstalled: null });
  });

  it("allows selection when bot token is missing", async () => {
    sharedGuilds.getSlimyBotToken.mockReturnValue("");

    const res = await request(app)
      .post("/api/auth/active-guild")
      .send({ guildId: "guild-1" });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true, activeGuildId: "guild-1", botInstalled: null });
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
      manageable: true,
      botInstalled: true,
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
      manageable: true,
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
    mockUserGuilds = [
      ...mockUserGuilds,
      { id: "1234567890123456789", name: "Numeric Guild", owner: false, permissions: "32" },
    ];
    const res = await request(app)
      .post("/api/auth/active-guild")
      .send({ guildId: 1234567890123456789n.toString() });

    expect(res.status).toBe(200);
    expect(res.body.activeGuildId).toBe("1234567890123456789");
    expect(sharedGuilds.botInstalledInGuild).toHaveBeenCalledWith("1234567890123456789", "bot-token");
  });

  it("rejects selecting a guild not present in the user's Discord guild list", async () => {
    mockUserGuilds = [{ id: "guild-1", name: "Guild One", owner: false, permissions: "32" }];

    sharedGuilds.getSlimyBotToken.mockReturnValue("bot-token");
    sharedGuilds.botInstalledInGuild.mockResolvedValue(true);

    const res = await request(app)
      .post("/api/auth/active-guild")
      .send({ guildId: "guild-not-in-list" });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ ok: false, error: "guild_not_in_user_guilds" });
  });

  it("returns 401 when Discord access token is invalid/expired", async () => {
    global.fetch = jest.fn(async (url) => {
      if (String(url).includes("/users/@me/guilds")) {
        return { ok: false, status: 401, headers: { get: () => null }, json: async () => [] };
      }
      return { ok: false, status: 404, headers: { get: () => null }, json: async () => ({}) };
    });

    const res = await request(app)
      .post("/api/auth/active-guild")
      .send({ guildId: "guild-1" });

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ ok: false, error: "discord_token_invalid" });
  });

  it("returns 429 when Discord rate-limits and no DB fallback exists", async () => {
    global.fetch = jest.fn(async (url) => {
      if (String(url).includes("/users/@me/guilds")) {
        return {
          ok: false,
          status: 429,
          headers: { get: (k) => (String(k).toLowerCase() === "retry-after" ? "1" : null) },
          json: async () => [],
        };
      }
      return { ok: false, status: 404, headers: { get: () => null }, json: async () => ({}) };
    });

    const res = await request(app)
      .post("/api/auth/active-guild")
      .send({ guildId: "guild-1" });

    expect(res.status).toBe(429);
    expect(res.body).toMatchObject({ ok: false, error: "discord_rate_limited" });
  });

  it("allows selection when Discord rate-limits but DB fallback exists", async () => {
    mockPrisma.userGuild.findFirst.mockResolvedValue({
      userId: "db-user-id",
      guildId: "guild-1",
      roles: [],
      guild: { id: "guild-1", name: "Guild One" },
    });

    global.fetch = jest.fn(async (url) => {
      if (String(url).includes("/users/@me/guilds")) {
        return {
          ok: false,
          status: 429,
          headers: { get: (k) => (String(k).toLowerCase() === "retry-after" ? "1" : null) },
          json: async () => [],
        };
      }
      return { ok: false, status: 404, headers: { get: () => null }, json: async () => ({}) };
    });

    const res = await request(app)
      .post("/api/auth/active-guild")
      .send({ guildId: "guild-1" });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true, activeGuildId: "guild-1", manageable: true });
  });
});
