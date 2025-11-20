"use strict";

const database = require("../../lib/database");

/**
 * Export Guild Data
 *
 * Exports all data associated with a guild including:
 * - Guild information
 * - Guild members (UserGuild relationships)
 * - Statistics
 * - Chat messages
 * - Club analyses
 * - Audit logs
 *
 * @param {string} guildId - The guild ID to export
 * @param {object} options - Export options
 * @param {number} options.maxChatMessages - Maximum chat messages to export (default: 10000)
 * @param {number} options.maxStats - Maximum stats to export (default: 10000)
 * @param {number} options.maxAuditLogs - Maximum audit logs to export (default: 5000)
 * @returns {Promise<object>} Export data object
 */
async function exportGuildData(guildId, options = {}) {
  const prisma = database.getClient();

  const {
    maxChatMessages = 10000,
    maxStats = 10000,
    maxAuditLogs = 5000,
  } = options;

  try {
    // Fetch guild information
    const guild = await prisma.guild.findUnique({
      where: { id: guildId },
      select: {
        id: true,
        discordId: true,
        name: true,
        settings: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!guild) {
      throw new Error(`Guild with ID ${guildId} not found`);
    }

    // Fetch guild members
    const members = await prisma.userGuild.findMany({
      where: { guildId },
      select: {
        id: true,
        userId: true,
        guildId: true,
        roles: true,
        user: {
          select: {
            id: true,
            discordId: true,
            username: true,
            globalName: true,
            createdAt: true,
          },
        },
      },
    });

    // Fetch statistics
    const stats = await prisma.stat.findMany({
      where: { guildId },
      select: {
        id: true,
        userId: true,
        guildId: true,
        type: true,
        value: true,
        timestamp: true,
      },
      orderBy: { timestamp: 'desc' },
      take: maxStats,
    });

    // Fetch chat messages
    const chatMessages = await prisma.chatMessage.findMany({
      where: { guildId },
      select: {
        id: true,
        conversationId: true,
        userId: true,
        guildId: true,
        text: true,
        adminOnly: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: maxChatMessages,
    });

    // Fetch club analyses
    const clubAnalyses = await prisma.clubAnalysis.findMany({
      where: { guildId },
      select: {
        id: true,
        guildId: true,
        userId: true,
        title: true,
        summary: true,
        confidence: true,
        createdAt: true,
        updatedAt: true,
        images: {
          select: {
            id: true,
            imageUrl: true,
            originalName: true,
            fileSize: true,
            uploadedAt: true,
          },
        },
        metrics: {
          select: {
            id: true,
            name: true,
            value: true,
            unit: true,
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch audit logs (only guild-related actions)
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { resourceType: 'guild', resourceId: guildId },
          { resourceType: 'chat', details: { path: ['guildId'], equals: guildId } },
        ],
      },
      select: {
        id: true,
        userId: true,
        action: true,
        resourceType: true,
        resourceId: true,
        details: true,
        ipAddress: true,
        userAgent: true,
        sessionId: true,
        requestId: true,
        timestamp: true,
        success: true,
        errorMessage: true,
      },
      orderBy: { timestamp: 'desc' },
      take: maxAuditLogs,
    });

    // Build export object
    const exportData = {
      version: "1.0.0",
      scope: "guild",
      exportedAt: new Date().toISOString(),
      guildId,

      guild: {
        id: guild.id,
        discordId: guild.discordId,
        name: guild.name,
        settings: guild.settings,
        createdAt: guild.createdAt.toISOString(),
        updatedAt: guild.updatedAt.toISOString(),
      },

      members: {
        count: members.length,
        data: members.map(m => ({
          id: m.id,
          userId: m.userId,
          roles: m.roles,
          user: {
            id: m.user.id,
            discordId: m.user.discordId,
            username: m.user.username,
            globalName: m.user.globalName,
            createdAt: m.user.createdAt.toISOString(),
          },
        })),
      },

      statistics: {
        count: stats.length,
        truncated: stats.length >= maxStats,
        data: stats.map(s => ({
          id: s.id,
          userId: s.userId,
          type: s.type,
          value: s.value,
          timestamp: s.timestamp.toISOString(),
        })),
      },

      chatMessages: {
        count: chatMessages.length,
        truncated: chatMessages.length >= maxChatMessages,
        data: chatMessages.map(msg => ({
          id: msg.id,
          conversationId: msg.conversationId,
          userId: msg.userId,
          text: msg.text,
          adminOnly: msg.adminOnly,
          createdAt: msg.createdAt.toISOString(),
        })),
      },

      clubAnalyses: {
        count: clubAnalyses.length,
        data: clubAnalyses.map(analysis => ({
          id: analysis.id,
          userId: analysis.userId,
          title: analysis.title,
          summary: analysis.summary,
          confidence: analysis.confidence,
          createdAt: analysis.createdAt.toISOString(),
          updatedAt: analysis.updatedAt.toISOString(),
          images: analysis.images.map(img => ({
            id: img.id,
            imageUrl: img.imageUrl,
            originalName: img.originalName,
            fileSize: img.fileSize,
            uploadedAt: img.uploadedAt.toISOString(),
          })),
          metrics: analysis.metrics.map(metric => ({
            id: metric.id,
            name: metric.name,
            value: metric.value,
            unit: metric.unit,
            category: metric.category,
          })),
        })),
      },

      auditLogs: {
        count: auditLogs.length,
        truncated: auditLogs.length >= maxAuditLogs,
        data: auditLogs.map(log => ({
          id: log.id,
          userId: log.userId,
          action: log.action,
          resourceType: log.resourceType,
          resourceId: log.resourceId,
          details: log.details,
          // IP and user agent excluded for privacy
          sessionId: log.sessionId,
          requestId: log.requestId,
          timestamp: log.timestamp.toISOString(),
          success: log.success,
          errorMessage: log.errorMessage,
        })),
      },

      metadata: {
        exportFormat: "JSON",
        dataIntegrity: "Complete",
        notes: [
          "Chat messages limited to most recent " + maxChatMessages,
          "Statistics limited to most recent " + maxStats,
          "Audit logs limited to most recent " + maxAuditLogs,
          "IP addresses and user agents excluded from audit logs for privacy",
        ],
      },
    };

    return exportData;
  } catch (error) {
    console.error("[guildExport] Error exporting guild data:", error);
    throw error;
  }
}

module.exports = {
  exportGuildData,
};
