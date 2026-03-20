const request = require("supertest");
const express = require("express");
const cookieParser = require("cookie-parser");
const prismaDatabase = require("../../src/lib/database");
const { getSession } = require("../../lib/session-store");
const authRoutes = require("../../src/routes/auth");

// Mock dependencies
jest.mock("../../src/lib/database");
jest.mock("../../lib/session-store");
jest.mock("../../src/middleware/auth", () => {
    return {
        readAuth: (req, res, next) => {
            req.user = {
                id: "test-user-id",
                username: "TestUser",
                role: "member",
                guilds: []
            };
            next();
        },
        resolveUser: jest.fn(),
        requireAuth: (req, res, next) => next(),
        requireRole: () => (req, res, next) => next(),
        requireGuildMember: () => (req, res, next) => next(),
        attachSession: (req, res, next) => next(),
    };
});

// Mock config to avoid missing env vars warning
jest.mock("../../src/config", () => ({
    discord: {
        clientId: "mock",
        clientSecret: "mock",
        redirectUri: "mock",
        scopes: "mock"
    },
    jwt: {
        secret: "mock",
        cookieName: "mock"
    }
}));

const { readAuth } = require("../../src/middleware/auth");

describe("GET /api/auth/me Context Hydration", () => {
    let app;

    beforeEach(() => {
        jest.clearAllMocks();
        app = express();
        app.use(express.json());
        app.use(cookieParser());
        app.use(readAuth);
        // Mount auth routes
        app.use("/api/auth", authRoutes);
    });

    it("should include lastActiveGuild from DB", async () => {
        // Mock Prisma response
        prismaDatabase.client = {
            user: {
                findUnique: jest.fn().mockResolvedValue({
                    id: "test-user-id",
                    lastActiveGuild: {
                        id: "guild-123",
                        name: "Test Guild",
                        icon: "icon-hash"
                    }
                })
            }
        };

        const res = await request(app).get("/api/auth/me");

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({
            id: "test-user-id",
            lastActiveGuild: {
                id: "guild-123",
                name: "Test Guild"
            }
        });
        expect(prismaDatabase.client.user.findUnique).toHaveBeenCalledWith({
            where: { id: "test-user-id" },
            include: { lastActiveGuild: true }
        });
    });

    it("should handle DB errors gracefully", async () => {
        prismaDatabase.client = {
            user: {
                findUnique: jest.fn().mockRejectedValue(new Error("DB Error"))
            }
        };

        const res = await request(app).get("/api/auth/me");

        expect(res.status).toBe(200);
        expect(res.body.id).toBe("test-user-id");
        // Should not crash, just missing lastActiveGuild
        expect(res.body.lastActiveGuild).toBeUndefined();
    });
});
