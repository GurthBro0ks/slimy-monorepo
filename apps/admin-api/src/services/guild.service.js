"use strict";

const database = require("../lib/database");
const { BadRequestError, ValidationError, ConfigurationError } = require("../lib/errors");

class GuildService {
  /**
   * Create a new guild
   */
  async createGuild(guildData) {
    const { id, name, icon, ownerId, settings = {} } = guildData;

    if (!id || !name || !ownerId) {
      throw new Error("Missing required fields: id, name, ownerId");
    }

    try {
      const guild = await database.getClient().guild.create({
        data: {
          id,
          name,
          icon,
          ownerId,
          settings,
        },
      });

      return guild;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new Error("Guild with this ID already exists");
      }
      throw error;
    }
  }

  /**
   * Connect a guild (upsert)
   */
  async connectGuild(authUser, guildData) {
    const guildId = guildData?.guildId || guildData?.id;
    const name = guildData?.name;
    const icon = guildData?.icon ?? null;
    const userId = this.resolveUserId(authUser);

    if (!guildId || !name) {
      throw new BadRequestError("Missing required fields: guildId, name");
    }

    if (!userId) {
      throw new BadRequestError("Missing user id in session");
    }

    const normalizedGuildId = String(guildId);
    const normalizedUserId = String(userId);

    let prisma;
    try {
      prisma = database.getClient();
    } catch (err) {
      throw new ConfigurationError("Database not initialized for guild connect", {
        code: err.code || "db_not_ready",
      });
    }
    let owner;
    try {
      owner = await prisma.user.upsert({
        where: { discordId: normalizedUserId },
        update: {
          username: authUser?.username || undefined,
          globalName: authUser?.globalName || authUser?.username || undefined,
          avatar: authUser?.avatar ?? undefined,
        },
        create: {
          discordId: normalizedUserId,
          username: authUser?.username || null,
          globalName: authUser?.globalName || authUser?.username || null,
          avatar: authUser?.avatar || null,
        },
      });
    } catch (err) {
      if (err?.code) {
        const mapped = new ValidationError("Unable to resolve guild owner record", {
          code: err.code || "owner_upsert_failed",
        });
        if (err.code === "P2002") {
          mapped.statusCode = 409;
        }
        throw mapped;
      }
      throw err;
    }

    // Upsert Guild
    try {
      const guild = await prisma.guild.upsert({
        where: { id: normalizedGuildId },
        update: {
          name,
          icon,
          ownerId: owner.id,
          updatedAt: new Date(),
        },
        create: {
          id: normalizedGuildId,
          name,
          icon,
          ownerId: owner.id,
          settings: {},
        },
      });

      // Ensure UserGuild relation for owner
      await prisma.userGuild.upsert({
        where: {
          userId_guildId: {
            userId: owner.id,
            guildId: normalizedGuildId,
          },
        },
        update: {
          roles: ['owner', 'admin'],
        },
        create: {
          userId: owner.id,
          guildId: normalizedGuildId,
          roles: ['owner', 'admin'],
        },
      });

      return this.formatGuildResponse(guild);
    } catch (err) {
      if (err.code === "P2003") {
        throw new ValidationError("Owner record missing for guild connect", {
          code: err.code,
        });
      }
      if (err.code === "P2002") {
        const conflict = new ValidationError("Guild already exists", { code: err.code });
        conflict.statusCode = 409;
        throw conflict;
      }
      if (err?.code) {
        throw new ValidationError("Unable to connect guild", { code: err.code });
      }
      throw err;
    }
  }

  /**
   * Get guild by ID
   */
  async getGuildById(id) {
    const guild = await database.getClient().guild.findUnique({
      where: { id },
      include: {
        userGuilds: {
          include: {
            user: {
              select: {
                id: true,
                discordId: true,
                username: true,
                globalName: true,
                avatar: true,
                createdAt: true,
              },
            },
          },
        },
        _count: {
          select: {
            userGuilds: true,
            chatMessages: true,
          },
        },
      },
    });

    if (!guild) {
      throw new Error("Guild not found");
    }

    return this.formatGuildResponse(guild);
  }

  /**
   * Get guild by Discord ID
   */
  /**
   * Get guild by Discord ID (alias for getGuildById since id is now discordId)
   */
  async getGuildByDiscordId(discordId) {
    return this.getGuildById(discordId);
  }

  /**
   * List all guilds with pagination
   */
  async listGuilds(options = {}) {
    const {
      limit = 50,
      offset = 0,
      search,
      includeMembers = false,
    } = options;

    const where = {};
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const guilds = await database.getClient().guild.findMany({
      where,
      take: Math.min(limit, 100), // Max 100 per page
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: includeMembers ? {
        userGuilds: {
          include: {
            user: {
              select: {
                id: true,
                discordId: true,
                username: true,
                globalName: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            userGuilds: true,
            chatMessages: true,
          },
        },
      } : {
        _count: {
          select: {
            userGuilds: true,
            chatMessages: true,
          },
        },
      },
    });

    const total = await database.getClient().guild.count({ where });

    return {
      guilds: guilds.map(guild => this.formatGuildResponse(guild, !includeMembers)),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  /**
   * Update guild
   */
  async updateGuild(id, updates) {
    const { name, settings } = updates;

    if (!name && !settings) {
      throw new Error("No valid fields to update");
    }

    try {
      const guild = await database.getClient().guild.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(settings && { settings }),
          updatedAt: new Date(),
        },
        include: {
          userGuilds: {
            include: {
              user: {
                select: {
                  id: true,
                  discordId: true,
                  username: true,
                  globalName: true,
                  avatar: true,
                },
              },
            },
          },
          _count: {
            select: {
              userGuilds: true,
              chatMessages: true,
            },
          },
        },
      });

      return this.formatGuildResponse(guild);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error("Guild not found");
      }
      throw error;
    }
  }

  /**
   * Delete guild
   */
  async deleteGuild(id) {
    try {
      // This will cascade delete userGuilds due to schema relations
      await database.getClient().guild.delete({
        where: { id },
      });

      return { success: true };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error("Guild not found");
      }
      throw error;
    }
  }

  /**
   * Add member to guild
   */
  async addMember(guildId, userId, roles = []) {
    // Validate roles
    if (!Array.isArray(roles)) {
      throw new Error("Roles must be an array");
    }

    // Check if user exists
    const user = await database.findUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if guild exists
    const guild = await database.findGuildById(guildId);
    if (!guild) {
      throw new Error("Guild not found");
    }

    try {
      const userGuild = await database.getClient().userGuild.create({
        data: {
          userId,
          guildId,
          roles,
        },
        include: {
          user: {
            select: {
              id: true,
              discordId: true,
              username: true,
              globalName: true,
              avatar: true,
            },
          },
          guild: {
            select: {
              id: true,
              discordId: true,
              name: true,
            },
          },
        },
      });

      return this.formatUserGuildResponse(userGuild);
    } catch (error) {
      if (error.code === 'P2002') {
        throw new Error("User is already a member of this guild");
      }
      throw error;
    }
  }

  /**
   * Update member roles
   */
  async updateMemberRoles(guildId, userId, roles) {
    if (!Array.isArray(roles)) {
      throw new Error("Roles must be an array");
    }

    try {
      const userGuild = await database.getClient().userGuild.update({
        where: {
          userId_guildId: {
            userId,
            guildId,
          },
        },
        data: { roles },
        include: {
          user: {
            select: {
              id: true,
              discordId: true,
              username: true,
              globalName: true,
              avatar: true,
            },
          },
          guild: {
            select: {
              id: true,
              discordId: true,
              name: true,
            },
          },
        },
      });

      return this.formatUserGuildResponse(userGuild);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error("User is not a member of this guild");
      }
      throw error;
    }
  }

  /**
   * Remove member from guild
   */
  async removeMember(guildId, userId) {
    try {
      await database.getClient().userGuild.delete({
        where: {
          userId_guildId: {
            userId,
            guildId,
          },
        },
      });

      return { success: true };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error("User is not a member of this guild");
      }
      throw error;
    }
  }

  /**
   * Get guild members
   */
  async getGuildMembers(guildId, options = {}) {
    const { limit = 50, offset = 0, search } = options;

    const where = { guildId };
    if (search) {
      where.user = {
        OR: [
          { username: { contains: search, mode: 'insensitive' } },
          { globalName: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const userGuilds = await database.getClient().userGuild.findMany({
      where,
      take: Math.min(limit, 200), // Max 200 per page
      skip: offset,
      orderBy: { user: { username: 'asc' } },
      include: {
        user: {
          select: {
            id: true,
            discordId: true,
            username: true,
            globalName: true,
            avatar: true,
            createdAt: true,
          },
        },
      },
    });

    const total = await database.getClient().userGuild.count({ where });

    return {
      members: userGuilds.map(ug => this.formatUserGuildResponse(ug)),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  /**
   * Get user guilds
   */
  async getUserGuilds(userId) {
    const userGuilds = await database.getClient().userGuild.findMany({
      where: { userId },
      include: {
        guild: {
          include: {
            _count: {
              select: {
                userGuilds: true,
                chatMessages: true,
              },
            },
          },
        },
      },
      orderBy: { guild: { name: 'asc' } },
    });

    return userGuilds.map(ug => ({
      ...this.formatGuildResponse(ug.guild),
      userRoles: ug.roles,
      joinedAt: ug.createdAt,
    }));
  }

  /**
   * Bulk add members
   */
  async bulkAddMembers(guildId, members) {
    if (!Array.isArray(members)) {
      throw new Error("Members must be an array");
    }

    const results = [];
    const errors = [];

    for (const member of members) {
      try {
        const result = await this.addMember(guildId, member.userId, member.roles || []);
        results.push(result);
      } catch (error) {
        errors.push({
          userId: member.userId,
          error: error.message,
        });
      }
    }

    return { results, errors };
  }

  /**
   * Bulk update member roles
   */
  async bulkUpdateMemberRoles(guildId, updates) {
    if (!Array.isArray(updates)) {
      throw new Error("Updates must be an array");
    }

    const results = [];
    const errors = [];

    for (const update of updates) {
      try {
        const result = await this.updateMemberRoles(guildId, update.userId, update.roles);
        results.push(result);
      } catch (error) {
        errors.push({
          userId: update.userId,
          error: error.message,
        });
      }
    }

    return { results, errors };
  }

  /**
   * Bulk remove members
   */
  async bulkRemoveMembers(guildId, userIds) {
    if (!Array.isArray(userIds)) {
      throw new Error("User IDs must be an array");
    }

    const results = [];
    const errors = [];

    for (const userId of userIds) {
      try {
        await this.removeMember(guildId, userId);
        results.push({ userId, success: true });
      } catch (error) {
        errors.push({
          userId,
          error: error.message,
        });
      }
    }

    return { results, errors };
  }

  /**
   * Check if user has permission for action
   */
  async checkPermission(userId, guildId, action, requiredRole = null) {
    // Get user's role in guild
    const userGuild = await database.getClient().userGuild.findUnique({
      where: {
        userId_guildId: {
          userId,
          guildId,
        },
      },
    });

    if (!userGuild) {
      return false;
    }

    const userRoles = userGuild.roles || [];

    // Check specific role requirement
    if (requiredRole && !userRoles.includes(requiredRole)) {
      return false;
    }

    // Define role hierarchy for actions
    const roleHierarchy = {
      'manage_guild': ['admin', 'owner'],
      'manage_members': ['admin', 'owner', 'moderator'],
      'view_members': ['admin', 'owner', 'moderator', 'member'],
    };

    const allowedRoles = roleHierarchy[action];
    if (!allowedRoles) {
      return true; // Action doesn't require specific permissions
    }

    return allowedRoles.some(role => userRoles.includes(role));
  }

  /**
   * Format guild response
   */
  formatGuildResponse(guild, includeMembers = true) {
    const response = {
      id: guild.id,
      discordId: guild.id, // id is now the discordId
      name: guild.name,
      icon: guild.icon,
      ownerId: guild.ownerId,
      settings: guild.settings || {},
      memberCount: guild._count?.userGuilds || 0,
      messageCount: guild._count?.chatMessages || 0,
      createdAt: guild.createdAt,
      updatedAt: guild.updatedAt,
    };

    if (includeMembers && guild.userGuilds) {
      response.members = guild.userGuilds.map(ug => this.formatUserGuildResponse(ug));
    }

    return response;
  }

  resolveUserId(authUser) {
    return (
      authUser?.id ||
      authUser?.sub ||
      authUser?.discordId ||
      authUser?.discord_id ||
      null
    );
  }

  /**
   * Format user-guild relationship response
   */
  formatUserGuildResponse(userGuild) {
    return {
      userId: userGuild.user.id,
      discordId: userGuild.user.discordId,
      username: userGuild.user.username,
      globalName: userGuild.user.globalName,
      avatar: userGuild.user.avatar,
      roles: userGuild.roles || [],
      joinedAt: userGuild.createdAt,
      userCreatedAt: userGuild.user.createdAt,
    };
  }
}

module.exports = new GuildService();
