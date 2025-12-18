const request = require("supertest");
const express = require("express");
const guildRouter = require("../src/routes/guilds");
const guildService = require("../src/services/guild.service");
const prismaDatabase = require("../src/lib/database");

// Mock dependencies
jest.mock("../src/middleware/auth", () => ({
  requireAuth: (req, res, next) => {
    req.user = { id: "test-user-id" };
    next();
  },
}));

jest.mock("../src/middleware/rbac", () => ({
  requireRole: () => (req, res, next) => next(),
  requireGuildAccess: (req, res, next) => next(),
}));

jest.mock("../src/middleware/validate", () => ({
  // eslint-disable-next-line no-unused-vars
  validateBody: (schema) => (req, res, next) => {
    req.validated = { body: req.body };
    next();
  },
  validateQuery: () => (req, res, next) => next(),
}));

jest.mock("../src/lib/database", () => ({
  initialize: jest.fn(),
  // eslint-disable-next-line no-unused-vars
  findUserByDiscordId: jest.fn().mockImplementation((id) => {
      return Promise.resolve(null);
  }),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock Guild Service
jest.mock("../src/services/guild.service", () => ({
  resolveUserId: jest.fn().mockReturnValue("test-user-id"),
  connectGuild: jest.fn(),
  getGuild: jest.fn(),
  checkPermission: jest.fn(),
}));

const app = express();
app.use(express.json());
app.use("/guilds", guildRouter);

describe("POST /guilds/connect", () => {
  const SLIMYAI_BOT_TOKEN = "mock-bot-token";
  const OLD_DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN;
  
  beforeAll(() => {
    process.env.SLIMYAI_BOT_TOKEN = SLIMYAI_BOT_TOKEN;
  });

  afterEach(() => {
    jest.clearAllMocks();
    process.env.DISCORD_BOT_TOKEN = OLD_DISCORD_TOKEN;
  });

  beforeEach(() => {
      // Re-apply mock implementations because resetMocks: true clears them
      guildService.resolveUserId.mockReturnValue("test-user-id");
      prismaDatabase.findUserByDiscordId.mockResolvedValue({
        id: "test-user-id",
        discordAccessToken: "mock-access-token",
      });
  });

  it("should fail if SLIMYAI_BOT_TOKEN is missing", async () => {
    delete process.env.SLIMYAI_BOT_TOKEN;
    delete process.env.DISCORD_BOT_TOKEN;
    
    // Mock user so we pass authentication
    prismaDatabase.findUserByDiscordId.mockResolvedValue({
        id: "test-user-id",
        discordAccessToken: "mock-access-token",
    });

    const res = await request(app)
      .post("/guilds/connect")
      .send({ guildId: "guild-shared", name: "Shared Guild" });
    
    expect(res.status).toBe(500);
    expect(res.body.error).toBe("MISSING_SLIMYAI_BOT_TOKEN");
    process.env.SLIMYAI_BOT_TOKEN = SLIMYAI_BOT_TOKEN;
  });

  it("should return 403 USER_NOT_IN_GUILD if user is not in guild", async () => {
    // Mock user lookup
    prismaDatabase.findUserByDiscordId.mockResolvedValue({
      id: "test-user-id",
      discordAccessToken: "mock-access-token",
    });

    const mockUserGuilds = [{ id: "guild-other" }];

    fetch.mockImplementation((url) => {
      if (url === "https://discord.com/api/v10/users/@me/guilds") {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockUserGuilds) });
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    const res = await request(app)
      .post("/guilds/connect")
      .send({ guildId: "guild-target", name: "Target Guild" });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("USER_NOT_IN_GUILD");
    expect(guildService.connectGuild).not.toHaveBeenCalled();
  });

  it("should return 403 BOT_NOT_IN_GUILD if bot is not in guild (Owned Only)", async () => {
    // Mock user lookup
    prismaDatabase.findUserByDiscordId.mockResolvedValue({
      id: "test-user-id",
      discordAccessToken: "mock-access-token",
    });

    const mockUserGuilds = [{ id: "guild-owned", owner: true }];

    fetch.mockImplementation((url) => {
      if (url === "https://discord.com/api/v10/users/@me/guilds") {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockUserGuilds) });
      }
      if (url === "https://discord.com/api/v10/guilds/guild-owned") {
        return Promise.resolve({ ok: false, status: 404 });
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    const res = await request(app)
      .post("/guilds/connect")
      .send({ guildId: "guild-owned", name: "Owned Guild" });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("BOT_NOT_IN_GUILD");
    expect(guildService.connectGuild).not.toHaveBeenCalled();
  });

  it("should succeed if guild is shared", async () => {
    // Mock user lookup
    prismaDatabase.findUserByDiscordId.mockResolvedValue({
      id: "test-user-id",
      discordAccessToken: "mock-access-token",
    });

    const mockUserGuilds = [{ id: "guild-shared", owner: true }];

    fetch.mockImplementation((url) => {
      if (url === "https://discord.com/api/v10/users/@me/guilds") {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockUserGuilds) });
      }
      if (url === "https://discord.com/api/v10/guilds/guild-shared") {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: "guild-shared" }) });
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    guildService.connectGuild.mockResolvedValue({ id: "guild-shared", name: "Shared Guild" });

    const res = await request(app)
      .post("/guilds/connect")
      .send({ guildId: "guild-shared", name: "Shared Guild" });

    expect(res.status).toBe(200);
    expect(guildService.connectGuild).toHaveBeenCalled();
  });
});
