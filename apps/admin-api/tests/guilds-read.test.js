"use strict";

const express = require("express");
const cookieParser = require("cookie-parser");
const request = require("supertest");
const guildRoutes = require("../src/routes/guilds");
const { errorHandler, notFoundHandler } = require("../src/middleware/error-handler");
const requestIdMiddleware = require("../src/middleware/request-id");
const database = require("../src/lib/database");

// Mock database
jest.mock("../src/lib/database");

function buildTestApp(userOverrides = {}) {
    const app = express();

    app.use(requestIdMiddleware);
    app.use(express.json());
    app.use(cookieParser());

    // Pre-authenticate the request
    app.use((req, _res, next) => {
        req.user = {
            id: "discord-user-1",
            sub: "discord-user-1",
            username: "Guild Owner",
            globalName: "Guild Owner",
            avatar: null,
            role: "member",
            ...userOverrides,
        };
        next();
    });

    app.use("/api/guilds", guildRoutes);
    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
}

describe("GET /api/guilds/:guildId", () => {
    const app = buildTestApp();
    let mockPrisma;
    let ownerRecord;
    let guildRecord;

    beforeEach(() => {
        ownerRecord = {
            id: "db-admin-1",
            discordId: "discord-user-1",
            username: "Guild Owner",
            globalName: "Guild Owner",
            avatar: null,
            createdAt: new Date("2025-01-01T00:00:00.000Z"),
            updatedAt: new Date("2025-01-01T00:00:00.000Z"),
        };

        guildRecord = {
            id: "guild-1",
            name: "Guild One",
            icon: "icon.png",
            ownerId: ownerRecord.id,
            settings: {},
            createdAt: new Date("2025-02-01T00:00:00.000Z"),
            updatedAt: new Date("2025-02-01T00:00:00.000Z"),
            owner: ownerRecord, // Include owner as expected by getGuild
        };

        mockPrisma = {
            guild: {
                findUnique: jest.fn(),
            },
        };

        database.getClient.mockReturnValue(mockPrisma);
    });

    test("should return guild details for authenticated user", async () => {
        mockPrisma.guild.findUnique.mockResolvedValue(guildRecord);

        const res = await request(app)
            .get("/api/guilds/guild-1");

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({
            id: guildRecord.id,
            name: guildRecord.name,
            ownerId: guildRecord.ownerId,
        });
        expect(mockPrisma.guild.findUnique).toHaveBeenCalledWith({
            where: { id: "guild-1" },
            include: { owner: true },
        });
    });

    test("should return 404 for non-existent guild", async () => {
        mockPrisma.guild.findUnique.mockResolvedValue(null);

        const res = await request(app)
            .get("/api/guilds/non-existent-id");

        expect(res.status).toBe(404);
    });
});
