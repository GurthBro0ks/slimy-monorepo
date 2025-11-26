"use strict";

const guildService = require("../src/services/guild.service");
const database = require("../src/lib/database");

describe("guildService.connectGuild", () => {
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
      icon: null,
      ownerId: ownerRecord.id,
      settings: {},
      createdAt: new Date("2025-02-01T00:00:00.000Z"),
      updatedAt: new Date("2025-02-01T00:00:00.000Z"),
      _count: { userGuilds: 0, chatMessages: 0 },
    };

    mockPrisma = {
      user: {
        upsert: jest.fn().mockResolvedValue(ownerRecord),
      },
      guild: {
        upsert: jest.fn().mockResolvedValue(guildRecord),
      },
      userGuild: {
        upsert: jest.fn().mockResolvedValue({
          userId: ownerRecord.id,
          guildId: guildRecord.id,
          roles: ["owner", "admin"],
        }),
      },
    };

    database.getClient.mockReturnValue(mockPrisma);
  });

  test("upserts owner by discord id and links guild to the owner", async () => {
    const result = await guildService.connectGuild(
      {
        id: "discord-user-1",
        username: "Guild Owner",
        globalName: "Guild Owner",
        avatar: null,
      },
      { guildId: "guild-1", name: "Guild One", icon: null },
    );

    expect(mockPrisma.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { discordId: "discord-user-1" },
      }),
    );
    expect(mockPrisma.guild.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "guild-1" },
        update: expect.objectContaining({ ownerId: ownerRecord.id }),
        create: expect.objectContaining({ ownerId: ownerRecord.id }),
      }),
    );
    expect(mockPrisma.userGuild.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_guildId: { userId: ownerRecord.id, guildId: guildRecord.id },
        },
      }),
    );
    expect(result.ownerId).toBe(ownerRecord.id);
    expect(result.id).toBe(guildRecord.id);
  });
});
