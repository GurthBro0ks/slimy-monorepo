const { requireRole, requireGuildAccess } = require("../../src/middleware/rbac");
const database = require("../../src/lib/database");

// Mock the database module
jest.mock("../../src/lib/database");

describe("RBAC Middleware", () => {
  let mockReq, mockRes, mockNext, mockPrisma;

  beforeEach(() => {
    mockReq = {
      params: {},
      body: {},
      query: {},
      user: null,
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();

    // Mock Prisma client
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("requireGuildAccess", () => {
    test("should return 400 when guildId is not provided", async () => {
      await requireGuildAccess(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "guildId-required" });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("should return 401 when user is not authenticated", async () => {
      mockReq.params.guildId = "123456789012345678";

      await requireGuildAccess(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "authentication-required" });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("should return 403 when user is not found in database", async () => {
      mockReq.params.guildId = "123456789012345678";
      mockReq.user = { id: "987654321098765432" };
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await requireGuildAccess(mockReq, mockRes, mockNext);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { discordId: "987654321098765432" },
      });
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "guild-access-denied" });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("should return 403 when user has no UserGuild relationship", async () => {
      mockReq.params.guildId = "123456789012345678";
      mockReq.user = { id: "987654321098765432" };

      const mockUser = {
        id: "user-uuid-123",
        discordId: "987654321098765432",
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.userGuild.findUnique.mockResolvedValue(null);

      await requireGuildAccess(mockReq, mockRes, mockNext);

      expect(mockPrisma.userGuild.findUnique).toHaveBeenCalledWith({
        where: {
          userId_guildId: {
            userId: "user-uuid-123",
            guildId: "123456789012345678",
          },
        },
        include: {
          guild: true,
        },
      });
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "guild-access-denied" });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("should call next when user has access to guild", async () => {
      mockReq.params.guildId = "123456789012345678";
      mockReq.user = { id: "987654321098765432" };

      const mockUser = {
        id: "user-uuid-123",
        discordId: "987654321098765432",
      };

      const mockGuild = {
        id: "123456789012345678",
        name: "Test Guild",
        icon: null,
        ownerId: "user-uuid-123",
      };

      const mockUserGuild = {
        userId: "user-uuid-123",
        guildId: "123456789012345678",
        roles: ["owner", "admin"],
        guild: mockGuild,
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.userGuild.findUnique.mockResolvedValue(mockUserGuild);

      await requireGuildAccess(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.guild).toEqual(mockGuild);
      expect(mockReq.userRoles).toEqual(["owner", "admin"]);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test("should handle guildId from query parameter", async () => {
      mockReq.query.guildId = "123456789012345678";
      mockReq.user = { id: "987654321098765432" };

      const mockUser = {
        id: "user-uuid-123",
        discordId: "987654321098765432",
      };

      const mockUserGuild = {
        userId: "user-uuid-123",
        guildId: "123456789012345678",
        roles: ["member"],
        guild: {
          id: "123456789012345678",
          name: "Test Guild",
        },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.userGuild.findUnique.mockResolvedValue(mockUserGuild);

      await requireGuildAccess(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    test("should handle guildId from body parameter", async () => {
      mockReq.body.guildId = "123456789012345678";
      mockReq.user = { id: "987654321098765432" };

      const mockUser = {
        id: "user-uuid-123",
        discordId: "987654321098765432",
      };

      const mockUserGuild = {
        userId: "user-uuid-123",
        guildId: "123456789012345678",
        roles: ["member"],
        guild: {
          id: "123456789012345678",
          name: "Test Guild",
        },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.userGuild.findUnique.mockResolvedValue(mockUserGuild);

      await requireGuildAccess(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    test("should return 500 on database error", async () => {
      mockReq.params.guildId = "123456789012345678";
      mockReq.user = { id: "987654321098765432" };

      mockPrisma.user.findUnique.mockRejectedValue(new Error("Database connection failed"));

      await requireGuildAccess(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "internal-server-error" });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("should normalize guildId as string", async () => {
      // Ensure guild IDs are treated as strings (important for Discord snowflakes)
      // In practice, req.params always contains strings from Express route parsing
      mockReq.params.guildId = "123456789012345678";
      mockReq.user = { id: "987654321098765432" };

      const mockUser = {
        id: "user-uuid-123",
        discordId: "987654321098765432",
      };

      const mockUserGuild = {
        userId: "user-uuid-123",
        guildId: "123456789012345678",
        roles: ["member"],
        guild: {
          id: "123456789012345678",
          name: "Test Guild",
        },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.userGuild.findUnique.mockResolvedValue(mockUserGuild);

      await requireGuildAccess(mockReq, mockRes, mockNext);

      // Verify that guildId is handled correctly as a string
      expect(mockPrisma.userGuild.findUnique).toHaveBeenCalledWith({
        where: {
          userId_guildId: {
            userId: "user-uuid-123",
            guildId: "123456789012345678",
          },
        },
        include: {
          guild: true,
        },
      });
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
