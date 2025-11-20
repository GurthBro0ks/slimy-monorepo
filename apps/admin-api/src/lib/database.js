const { PrismaClient } = require('@prisma/client');
const metrics = require('./monitoring/metrics');
const config = require('./config');

/**
 * Database operation modes
 * @enum {string}
 */
const DatabaseMode = {
  /** Database is not configured (no DATABASE_URL) */
  NOT_CONFIGURED: 'NOT_CONFIGURED',
  /** Database is configured but not connected */
  DISCONNECTED: 'DISCONNECTED',
  /** Database is fully connected and operational */
  CONNECTED: 'CONNECTED',
  /** Database connection failed, running in degraded mode */
  DEGRADED: 'DEGRADED',
};

/**
 * @typedef {Object} DatabaseStatus
 * @property {DatabaseMode} mode - Current database mode
 * @property {boolean} isAvailable - Whether database operations are available
 * @property {string|null} error - Last error message if any
 * @property {Date|null} lastConnectAttempt - Timestamp of last connection attempt
 */

class Database {
  constructor() {
    this.prisma = null;
    this.isInitialized = false;
    /** @type {DatabaseMode} */
    this.mode = DatabaseMode.NOT_CONFIGURED;
    /** @type {string|null} */
    this.lastError = null;
    /** @type {Date|null} */
    this.lastConnectAttempt = null;
  }

  /**
   * Initialize database connection
   * @returns {Promise<boolean>} True if connected, false if failed
   */
  async initialize() {
    if (this.isInitialized) {
      return true;
    }

    this.lastConnectAttempt = new Date();
    this.mode = DatabaseMode.DISCONNECTED;

    try {
      this.prisma = new PrismaClient({
        log: config.database.logLevel,
      });

      // Add metrics middleware
      this.prisma.$use(async (params, next) => {
        const startTime = Date.now();
        try {
          const result = await next(params);
          const duration = Date.now() - startTime;
          metrics.recordDatabaseQuery(duration);
          return result;
        } catch (error) {
          const duration = Date.now() - startTime;
          metrics.recordDatabaseQuery(duration);
          // Record database errors as application errors
          metrics.recordError();
          throw error;
        }
      });

      // Test the connection
      await this.prisma.$connect();
      metrics.recordDatabaseConnection(1); // Increment connection count
      this.isInitialized = true;
      this.mode = DatabaseMode.CONNECTED;
      this.lastError = null;

      console.log('[database] Connected to PostgreSQL database (mode: CONNECTED)');
      return true;
    } catch (err) {
      this.lastError = err.message || String(err);
      this.mode = DatabaseMode.DEGRADED;
      console.error('[database] Initialization failed - running in DEGRADED mode:', this.lastError);
      console.warn('[database] Some features may be unavailable or read-only');
      return false;
    }
  }

  /**
   * Check if database URL is configured
   * @returns {boolean}
   */
  isConfigured() {
    const configured = Boolean(config.database.url);
    if (!configured && this.mode === DatabaseMode.NOT_CONFIGURED) {
      // Already in correct state
    } else if (!configured) {
      this.mode = DatabaseMode.NOT_CONFIGURED;
    }
    return configured;
  }

  /**
   * Check if database is available for operations
   * @returns {boolean}
   */
  isAvailable() {
    return this.mode === DatabaseMode.CONNECTED;
  }

  /**
   * Get current database status
   * @returns {DatabaseStatus}
   */
  getStatus() {
    return {
      mode: this.mode,
      isAvailable: this.isAvailable(),
      error: this.lastError,
      lastConnectAttempt: this.lastConnectAttempt,
    };
  }

  /**
   * Get Prisma client with safety checks
   * @param {Object} options
   * @param {boolean} options.throwIfUnavailable - Throw error if DB unavailable (default: true)
   * @returns {PrismaClient|null}
   * @throws {Error} If database not initialized and throwIfUnavailable is true
   */
  getClient(options = { throwIfUnavailable: true }) {
    const { throwIfUnavailable = true } = options;

    if (!this.isInitialized || !this.prisma) {
      if (throwIfUnavailable) {
        const error = new Error(
          `Database not available (mode: ${this.mode}). ` +
          (this.lastError ? `Last error: ${this.lastError}` : 'Not initialized.')
        );
        error.code = 'DB_UNAVAILABLE';
        error.mode = this.mode;
        throw error;
      }
      return null;
    }
    return this.prisma;
  }

  /**
   * Close database connection
   */
  async close() {
    if (this.prisma) {
      await this.prisma.$disconnect();
      metrics.recordDatabaseConnection(-1); // Decrement connection count
      this.prisma = null;
      this.isInitialized = false;
      this.mode = DatabaseMode.DISCONNECTED;
      console.log('[database] Disconnected (mode: DISCONNECTED)');
    }
  }

  // Audit logging methods
  async createAuditLog({
    userId,
    action,
    resourceType,
    resourceId,
    details,
    ipAddress,
    userAgent,
    sessionId,
    requestId,
    success = true,
    errorMessage,
  }) {
    const prisma = this.getClient();

    return await prisma.auditLog.create({
      data: {
        userId,
        action,
        resourceType,
        resourceId,
        details: details || {},
        ipAddress,
        userAgent,
        sessionId,
        requestId,
        success,
        errorMessage,
      },
    });
  }

  async getAuditLogs(filters = {}, options = {}) {
    const prisma = this.getClient();

    const {
      userId,
      action,
      resourceType,
      resourceId,
      success,
      startDate,
      endDate,
      limit = 100,
      offset = 0,
    } = filters;

    const where = {};

    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (resourceType) where.resourceType = resourceType;
    if (resourceId) where.resourceId = resourceId;
    if (success !== undefined) where.success = success;

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    return await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            globalName: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
      skip: offset,
    });
  }

  async getAuditLogStats(filters = {}) {
    const prisma = this.getClient();

    const {
      userId,
      action,
      resourceType,
      startDate,
      endDate,
    } = filters;

    const where = {};

    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (resourceType) where.resourceType = resourceType;

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    const [totalLogs, successfulLogs, failedLogs, actionStats] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.count({ where: { ...where, success: true } }),
      prisma.auditLog.count({ where: { ...where, success: false } }),
      prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
      }),
    ]);

    return {
      total: totalLogs,
      successful: successfulLogs,
      failed: failedLogs,
      successRate: totalLogs > 0 ? (successfulLogs / totalLogs) * 100 : 0,
      actionBreakdown: actionStats.map(stat => ({
        action: stat.action,
        count: stat._count.id,
      })),
    };
  }

  // User management methods
  async findOrCreateUser(discordUser) {
    const prisma = this.getClient();

    return await prisma.user.upsert({
      where: { discordId: discordUser.id },
      update: {
        username: discordUser.username,
        globalName: discordUser.global_name || discordUser.username,
        avatar: discordUser.avatar,
      },
      create: {
        discordId: discordUser.id,
        username: discordUser.username,
        globalName: discordUser.global_name || discordUser.username,
        avatar: discordUser.avatar,
      },
    });
  }

  async findUserByDiscordId(discordId) {
    const prisma = this.getClient();

    return await prisma.user.findUnique({
      where: { discordId },
    });
  }

  async findUserById(id) {
    const prisma = this.getClient();

    return await prisma.user.findUnique({
      where: { id },
    });
  }

  // Session management methods
  async createSession(userId, token, expiresAt) {
    const prisma = this.getClient();

    return await prisma.session.create({
      data: {
        userId,
        token,
        expiresAt: new Date(expiresAt),
      },
    });
  }

  async findSessionByToken(token) {
    const prisma = this.getClient();

    return await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });
  }

  async deleteSession(token) {
    const prisma = this.getClient();

    return await prisma.session.delete({
      where: { token },
    });
  }

  async deleteExpiredSessions() {
    const prisma = this.getClient();
    const now = new Date();

    return await prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });
  }

  /**
   * Deletes expired sessions in batches to avoid large transactions
   * that could lock the database or cause performance issues.
   *
   * @param {Object} options - Cleanup options
   * @param {number} options.batchSize - Number of sessions to delete per batch (default: 1000)
   * @param {number} options.delayMs - Delay between batches in milliseconds (default: 100)
   * @param {number} options.maxAge - Delete sessions older than this many days (default: 30)
   * @param {Function} options.onProgress - Callback for progress updates (batchNum, deletedCount, totalDeleted)
   * @returns {Promise<{totalDeleted: number, batchesProcessed: number, duration: number}>}
   */
  async cleanupExpiredSessionsBatched(options = {}) {
    const {
      batchSize = 1000,
      delayMs = 100,
      maxAge = 30,
      onProgress = null,
    } = options;

    const prisma = this.getClient();
    const startTime = Date.now();
    let totalDeleted = 0;
    let batchesProcessed = 0;

    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAge);

    console.log(`[cleanup] Starting session cleanup: removing sessions older than ${cutoffDate.toISOString()}`);

    try {
      while (true) {
        // Find expired sessions (limit to batch size)
        const expiredSessions = await prisma.session.findMany({
          where: {
            expiresAt: {
              lt: cutoffDate,
            },
          },
          select: {
            id: true,
          },
          take: batchSize,
        });

        // No more expired sessions to delete
        if (expiredSessions.length === 0) {
          break;
        }

        // Extract session IDs
        const sessionIds = expiredSessions.map(s => s.id);

        // Delete this batch
        const result = await prisma.session.deleteMany({
          where: {
            id: {
              in: sessionIds,
            },
          },
        });

        totalDeleted += result.count;
        batchesProcessed++;

        // Call progress callback if provided
        if (onProgress) {
          onProgress(batchesProcessed, result.count, totalDeleted);
        }

        console.log(`[cleanup] Batch ${batchesProcessed}: deleted ${result.count} sessions (total: ${totalDeleted})`);

        // If we deleted fewer than the batch size, we're done
        if (expiredSessions.length < batchSize) {
          break;
        }

        // Delay between batches to avoid overwhelming the database
        if (delayMs > 0) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }

      const duration = Date.now() - startTime;
      console.log(`[cleanup] Session cleanup completed: ${totalDeleted} sessions deleted in ${batchesProcessed} batches (${duration}ms)`);

      return {
        totalDeleted,
        batchesProcessed,
        duration,
      };
    } catch (err) {
      const duration = Date.now() - startTime;
      console.error(`[cleanup] Session cleanup failed after ${batchesProcessed} batches (${totalDeleted} deleted):`, err.message);
      throw err;
    }
  }

  async deleteUserSessions(userId) {
    const prisma = this.getClient();

    return await prisma.session.deleteMany({
      where: { userId },
    });
  }

  // Guild management methods
  async findOrCreateGuild(discordGuild) {
    const prisma = this.getClient();

    return await prisma.guild.upsert({
      where: { discordId: discordGuild.id },
      update: {
        name: discordGuild.name,
      },
      create: {
        discordId: discordGuild.id,
        name: discordGuild.name,
      },
    });
  }

  async findGuildByDiscordId(discordId) {
    const prisma = this.getClient();

    return await prisma.guild.findUnique({
      where: { discordId },
    });
  }

  async findGuildById(id) {
    const prisma = this.getClient();

    return await prisma.guild.findUnique({
      where: { id },
    });
  }

  async listGuilds(options = {}) {
    const prisma = this.getClient();
    const { limit = 50, offset = 0, search } = options;

    const where = {};
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    return await prisma.guild.findMany({
      where,
      take: Math.min(limit, 100),
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });
  }

  async countGuilds(search) {
    const prisma = this.getClient();

    const where = {};
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    return await prisma.guild.count({ where });
  }

  async createGuild(guildData) {
    const prisma = this.getClient();
    const { discordId, name, settings = {} } = guildData;

    return await prisma.guild.create({
      data: {
        discordId,
        name,
        settings,
      },
    });
  }

  async updateGuild(id, updates) {
    const prisma = this.getClient();

    return await prisma.guild.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    });
  }

  async deleteGuild(id) {
    const prisma = this.getClient();

    return await prisma.guild.delete({
      where: { id },
    });
  }

  async updateGuildSettings(guildId, settings) {
    const prisma = this.getClient();

    return await prisma.guild.update({
      where: { id: guildId },
      data: { settings },
    });
  }

  // User-Guild relationships
  async addUserToGuild(userId, guildId, roles = []) {
    const prisma = this.getClient();

    return await prisma.userGuild.upsert({
      where: {
        userId_guildId: {
          userId,
          guildId,
        },
      },
      update: { roles },
      create: {
        userId,
        guildId,
        roles,
      },
    });
  }

  async removeUserFromGuild(userId, guildId) {
    const prisma = this.getClient();

    return await prisma.userGuild.delete({
      where: {
        userId_guildId: {
          userId,
          guildId,
        },
      },
    });
  }

  async getUserGuilds(userId) {
    const prisma = this.getClient();

    return await prisma.userGuild.findMany({
      where: { userId },
      include: {
        guild: true,
      },
    });
  }

  async getGuildMembers(guildId, options = {}) {
    const prisma = this.getClient();
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

    return await prisma.userGuild.findMany({
      where,
      take: Math.min(limit, 200),
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
  }

  async countGuildMembers(guildId, search) {
    const prisma = this.getClient();

    const where = { guildId };
    if (search) {
      where.user = {
        OR: [
          { username: { contains: search, mode: 'insensitive' } },
          { globalName: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    return await prisma.userGuild.count({ where });
  }

  async updateUserGuildRoles(userId, guildId, roles) {
    const prisma = this.getClient();

    return await prisma.userGuild.update({
      where: {
        userId_guildId: {
          userId,
          guildId,
        },
      },
      data: { roles },
    });
  }

  // Chat message methods (for the chat history API)
  async createChatMessage({ conversationId, userId, guildId, text, adminOnly = false }) {
    const prisma = this.getClient();

    return await prisma.chatMessage.create({
      data: {
        conversationId,
        userId,
        guildId,
        text,
        adminOnly,
      },
      include: {
        user: true,
        guild: true,
      },
    });
  }

  async getChatMessages(guildId, limit = 50, includeAdminOnly = false) {
    const prisma = this.getClient();

    const where = {
      guildId,
    };

    if (!includeAdminOnly) {
      where.adminOnly = false;
    }

    return await prisma.chatMessage.findMany({
      where,
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: Math.min(limit, 200), // Max 200 messages
    });
  }

  // Conversation methods
  async createConversation(userId, title = null) {
    const prisma = this.getClient();

    return await prisma.conversation.create({
      data: {
        userId,
        title,
      },
    });
  }

  async getUserConversations(userId, limit = 10) {
    const prisma = this.getClient();

    return await prisma.conversation.findMany({
      where: { userId },
      include: {
        _count: {
          select: { messages: true },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: limit,
    });
  }

  // Statistics methods
  async recordStat({ userId, guildId, type, value, timestamp }) {
    const prisma = this.getClient();

    return await prisma.stat.create({
      data: {
        userId,
        guildId,
        type,
        value,
        timestamp: timestamp ? new Date(timestamp) : undefined,
      },
    });
  }

  async getStats({ userId, guildId, type, limit = 100 }) {
    const prisma = this.getClient();

    const where = {};
    if (userId) where.userId = userId;
    if (guildId) where.guildId = guildId;
    if (type) where.type = type;

    return await prisma.stat.findMany({
      where,
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
    });
  }

  async getStatsAggregate({ userId, guildId, type, startDate, endDate }) {
    const prisma = this.getClient();

    const where = {};
    if (userId) where.userId = userId;
    if (guildId) where.guildId = guildId;
    if (type) where.type = type;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    return await prisma.stat.groupBy({
      by: ['type'],
      where,
      _count: true,
      _sum: {
        value: true, // This might need adjustment based on value types
      },
    });
  }

  // Legacy methods for backward compatibility (these can be migrated over time)
  async ensureGuildRecord(guildId, guildName = null) {
    return await this.findOrCreateGuild({ id: guildId, name: guildName });
  }

  async ensureUserRecord(userId, username = null) {
    // This is a simplified version - in practice you'd want more user data
    const existingUser = await this.findUserByDiscordId(userId);
    if (existingUser) {
      if (username && existingUser.username !== username) {
        return await this.getClient().user.update({
          where: { discordId: userId },
          data: { username },
        });
      }
      return existingUser;
    }

    return await this.getClient().user.create({
      data: {
        discordId: userId,
        username,
      },
    });
  }
}

const databaseInstance = new Database();

module.exports = databaseInstance;
module.exports.Database = Database;
module.exports.DatabaseMode = DatabaseMode;
