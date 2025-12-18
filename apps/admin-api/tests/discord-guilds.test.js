const request = require("supertest");
const express = require("express");
const discordRouter = require("../src/routes/discord");
const prismaDatabase = require("../src/lib/database");

// Mock dependencies
jest.mock("../src/middleware/auth", () => ({
  requireAuth: (req, res, next) => {
    req.user = { id: "test-user-id" };
    next();
  },
}));

jest.mock("../src/lib/database", () => ({
  initialize: jest.fn(),
  findUserByDiscordId: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

const app = express();
app.use(express.json());
app.use("/discord", discordRouter);

describe("GET /discord/guilds", () => {
  const SLIMYAI_BOT_TOKEN = "mock-bot-token";
  
  beforeAll(() => {
    process.env.SLIMYAI_BOT_TOKEN = SLIMYAI_BOT_TOKEN;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

	  it("should return shared guilds with role labels", async () => {
    // 1. Mock Database User
    prismaDatabase.findUserByDiscordId.mockResolvedValue({
      id: "test-user-id",
      discordAccessToken: "mock-access-token",
    });

    // 2. Mock Discord API Responses
    
	    // User Guilds: A (Primary), B (Shared), C (Shared), D (User only), E (User only)
	    const mockUserGuilds = [
	      { id: "1176605506912141444", name: "Primary Guild", icon: "icon-a", permissions: "0" }, // Primary, Shared
	      { id: "guild-b", name: "Guild B", icon: "icon-b", owner: true, permissions: "0" },      // Shared, Owner -> Admin
	      { id: "guild-c", name: "Guild C", icon: "icon-c", permissions: "0" },                   // Shared, Member
	      { id: "guild-d", name: "Guild D", icon: "icon-d", owner: true, permissions: "0" },      // Owned Only -> Not Connectable
	      { id: "guild-e", name: "Guild E", icon: "icon-e", permissions: "0" },                   // Member Only -> Hidden
	    ];

    // Member details for Primary Guild (User has Admin Role)
    const mockMemberPrimary = {
      roles: ["1178129227321712701", "other-role"], // Contains Admin Role ID
    };

	    fetch.mockImplementation((url, options) => {
	      if (url === "https://discord.com/api/v10/users/@me/guilds") {
	        return Promise.resolve({
	          ok: true,
	          json: () => Promise.resolve(mockUserGuilds),
	        });
	      }
	      if (url === "https://discord.com/api/v10/guilds/1176605506912141444") {
	        if (options.headers.Authorization !== `Bot ${SLIMYAI_BOT_TOKEN}`) {
	          return Promise.resolve({ ok: false, status: 401 });
	        }
	        return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: "1176605506912141444" }) });
	      }
	      if (url === "https://discord.com/api/v10/guilds/guild-b") {
	        if (options.headers.Authorization !== `Bot ${SLIMYAI_BOT_TOKEN}`) {
	          return Promise.resolve({ ok: false, status: 401 });
	        }
	        return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: "guild-b" }) });
	      }
	      if (url === "https://discord.com/api/v10/guilds/guild-c") {
	        if (options.headers.Authorization !== `Bot ${SLIMYAI_BOT_TOKEN}`) {
	          return Promise.resolve({ ok: false, status: 401 });
	        }
	        return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: "guild-c" }) });
	      }
	      if (url === "https://discord.com/api/v10/guilds/guild-d") {
	        return Promise.resolve({ ok: false, status: 404 });
	      }
	      if (url === "https://discord.com/api/v10/guilds/guild-e") {
	        return Promise.resolve({ ok: false, status: 404 });
	      }
	      if (url.includes("/members/test-user-id")) {
	         // Verify Bot Token usage for member fetch
	         if (options.headers.Authorization !== `Bot ${SLIMYAI_BOT_TOKEN}`) {
	             return Promise.resolve({ ok: false, status: 401, text: () => "Unauthorized" });
	         }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMemberPrimary),
        });
      }
      return Promise.reject(new Error(`Unknown URL: ${url}`));
    });

	    const res = await request(app).get("/discord/guilds");

	    expect(res.status).toBe(200);
	    expect(res.body.guilds).toHaveLength(3); // A, B, C only (shared with SlimyAI bot)

    // Sort for easier assertion
    const guilds = res.body.guilds.sort((a, b) => a.id.localeCompare(b.id));
    
	    // Guild A (Primary) -> Shared, Connectable
	    expect(guilds[0].id).toBe("1176605506912141444");
	    expect(guilds[0].isPrimary).toBe(true);
	    expect(guilds[0].roleLabel).toBe("admin");
	    expect(guilds[0].roleSource).toBe("roles");
	    expect(guilds[0].botInstalled).toBe(true);
	    expect(guilds[0].connectable).toBe(true);

	    // Guild B -> Shared, Connectable
	    expect(guilds[1].id).toBe("guild-b");
	    expect(guilds[1].connectable).toBe(true);
	    expect(guilds[1].roleLabel).toBe("member");
	    expect(guilds[1].roleSource).toBe("default");

	    // Guild C -> Shared, Connectable
	    expect(guilds[2].id).toBe("guild-c");
	    expect(guilds[2].connectable).toBe(true);
	    expect(guilds[2].roleLabel).toBe("member");
	    expect(guilds[2].roleSource).toBe("default");
	  });
	});
