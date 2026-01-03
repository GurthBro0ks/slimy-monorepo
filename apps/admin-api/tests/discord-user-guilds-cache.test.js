"use strict";

describe("discord-shared-guilds user guild list cache", () => {
  const ORIGINAL_SLIMYAI_BOT_TOKEN = process.env.SLIMYAI_BOT_TOKEN;
  const ORIGINAL_DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

  beforeAll(() => {
    process.env.SLIMYAI_BOT_TOKEN = "mock-bot-token";
    process.env.DISCORD_BOT_TOKEN = "";
  });

  afterAll(() => {
    if (ORIGINAL_SLIMYAI_BOT_TOKEN === undefined) delete process.env.SLIMYAI_BOT_TOKEN;
    else process.env.SLIMYAI_BOT_TOKEN = ORIGINAL_SLIMYAI_BOT_TOKEN;

    if (ORIGINAL_DISCORD_BOT_TOKEN === undefined) delete process.env.DISCORD_BOT_TOKEN;
    else process.env.DISCORD_BOT_TOKEN = ORIGINAL_DISCORD_BOT_TOKEN;
  });

  beforeEach(() => {
    jest.resetModules();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  test("shares a single cached Discord user guild fetch across callers", async () => {
    const svc = require("../src/services/discord-shared-guilds");

    global.fetch.mockImplementation((url) => {
      if (url === "https://discord.com/api/v10/users/@me/guilds") {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([]),
          headers: { get: () => null },
        });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    const a = await svc.getAllUserGuildsWithBotStatus({
      discordAccessToken: "token-1",
      userDiscordId: "user-1",
      concurrency: 1,
    });
    const b = await svc.getSharedGuildsForUser({
      discordAccessToken: "token-1",
      userDiscordId: "user-1",
      concurrency: 1,
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(a.__slimyMeta).toMatchObject({ source: "discord", stale: false });
    expect(b.__slimyMeta).toMatchObject({ source: "cache", stale: false });
  });

  test("serves stale cached data (200) when Discord 429s and cooldown is enforced", async () => {
    jest.useFakeTimers({ now: new Date("2026-01-03T00:00:00.000Z") });
    const svc = require("../src/services/discord-shared-guilds");

    svc.primeUserGuildsCache("user-1", [
      { id: "guild-x", name: "Guild X", owner: false, permissions: "0" },
    ]);

    jest.setSystemTime(new Date("2026-01-03T00:10:00.000Z"));

    global.fetch.mockImplementation((url) => {
      if (url === "https://discord.com/api/v10/users/@me/guilds") {
        return Promise.resolve({
          ok: false,
          status: 429,
          json: () => Promise.resolve({ retry_after: 1.0 }),
          headers: { get: (name) => (String(name).toLowerCase() === "retry-after" ? "1" : null) },
        });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    const first = await svc.getAllUserGuildsWithBotStatus({
      discordAccessToken: "token-1",
      userDiscordId: "user-1",
      concurrency: 1,
    });

    expect(first).toHaveLength(1);
    expect(first.__slimyMeta).toMatchObject({
      source: "stale",
      stale: true,
      discordRateLimited: true,
    });
    expect(typeof first.__slimyMeta.retryAfterMs).toBe("number");
    expect(first.__slimyMeta.retryAfterMs).toBeGreaterThanOrEqual(10_000);
    expect(first.__slimyMeta.cooldownRemainingMs).toBeGreaterThanOrEqual(10_000);
    expect(global.fetch).toHaveBeenCalledTimes(1);

    const second = await svc.getAllUserGuildsWithBotStatus({
      discordAccessToken: "token-1",
      userDiscordId: "user-1",
      concurrency: 1,
    });

    expect(second).toHaveLength(1);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test("coalesces in-flight Discord user guild fetches (no duplicate upstream calls)", async () => {
    const svc = require("../src/services/discord-shared-guilds");

    global.fetch.mockImplementation((url) => {
      if (url === "https://discord.com/api/v10/users/@me/guilds") {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([{ id: "g1", name: "G1", owner: false, permissions: "0" }]),
          headers: { get: () => null },
        });
      }
      if (url === "https://discord.com/api/v10/guilds/g1") {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({}),
          headers: { get: () => null },
        });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    const [a, b] = await Promise.all([
      svc.getSharedGuildsForUser({
        discordAccessToken: "token-1",
        userDiscordId: "user-1",
        concurrency: 1,
      }),
      svc.getSharedGuildsForUser({
        discordAccessToken: "token-1",
        userDiscordId: "user-1",
        concurrency: 1,
      }),
    ]);

    expect(a).toHaveLength(1);
    expect(b).toHaveLength(1);
    expect(global.fetch).toHaveBeenCalledTimes(2); // users/@me/guilds + guilds/g1
  });
});
