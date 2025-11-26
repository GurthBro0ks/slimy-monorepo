const { requireGuildAccess } = require("../../src/middleware/rbac");
const database = require("../../src/lib/database");

jest.mock("../../src/lib/database");

describe("requireGuildAccess Middleware", () => {
  let req, res, next;
  let mockPrisma;

  beforeEach(() => {
    req = {
      params: {},
      body: {},
      query: {},
      user: { id: "discord-user-id" },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();

    mockPrisma = {
      user: {
        findUnique: jest.fn(),
      },
      userGuild: {
        findUnique: jest.fn(),
      },
    };

    database.getClient.mockReturnValue(mockPrisma);
  });

  test("should return 400 if guildId is missing", async () => {
    await requireGuildAccess(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "guildId-required" });
  });

  test("should return 401 if user is not authenticated", async () => {
    req.user = null;
    req.params.guildId = "guild-123";
    await requireGuildAccess(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "authentication-required" });
  });

  test("should return 403 if user not found in DB", async () => {
    req.params.guildId = "guild-123";
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await requireGuildAccess(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "guild-access-denied" });
  });

  test("should return 403 if user is not a member of the guild", async () => {
    req.params.guildId = "guild-123";
    mockPrisma.user.findUnique.mockResolvedValue({ id: "db-user-id" });
    mockPrisma.userGuild.findUnique.mockResolvedValue(null);

    await requireGuildAccess(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "guild-access-denied" });
  });

  test("should call next() and attach guild info if user has access", async () => {
    req.params.guildId = "guild-123";
    const mockGuild = { id: "guild-123", name: "Test Guild" };
    const mockUserGuild = { guild: mockGuild, roles: ["admin"] };

    mockPrisma.user.findUnique.mockResolvedValue({ id: "db-user-id" });
    mockPrisma.userGuild.findUnique.mockResolvedValue(mockUserGuild);

    await requireGuildAccess(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.guild).toEqual(mockGuild);
    expect(req.userRoles).toEqual(["admin"]);
  });
});
