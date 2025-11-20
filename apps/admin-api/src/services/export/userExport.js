"use strict";

const database = require("../../lib/database");

/**
 * Export User Data
 *
 * Exports all data associated with a user including:
 * - User profile information
 * - Guild memberships
 * - Conversations
 * - Chat messages
 * - Statistics
 * - Screenshot analyses
 * - Club analyses
 * - Audit logs
 *
 * @param {string} userId - The user ID to export
 * @param {object} options - Export options
 * @param {number} options.maxChatMessages - Maximum chat messages to export (default: 10000)
 * @param {number} options.maxStats - Maximum stats to export (default: 10000)
 * @param {number} options.maxAuditLogs - Maximum audit logs to export (default: 5000)
 * @returns {Promise<object>} Export data object
 */
async function exportUserData(userId, options = {}) {
  const prisma = database.getClient();

  const {
    maxChatMessages = 10000,
    maxStats = 10000,
    maxAuditLogs = 5000,
  } = options;

  try {
    // Fetch user information (exclude session tokens)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        discordId: true,
        username: true,
        globalName: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    // Fetch guild memberships
    const userGuilds = await prisma.userGuild.findMany({
      where: { userId },
      select: {
        id: true,
        guildId: true,
        roles: true,
        guild: {
          select: {
            id: true,
            discordId: true,
            name: true,
            createdAt: true,
          },
        },
      },
    });

    // Fetch conversations
    const conversations = await prisma.conversation.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        messages: {
          select: {
            id: true,
            text: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Fetch chat messages
    const chatMessages = await prisma.chatMessage.findMany({
      where: { userId },
      select: {
        id: true,
        conversationId: true,
        guildId: true,
        text: true,
        adminOnly: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: maxChatMessages,
    });

    // Fetch user statistics
    const stats = await prisma.stat.findMany({
      where: { userId },
      select: {
        id: true,
        guildId: true,
        type: true,
        value: true,
        timestamp: true,
      },
      orderBy: { timestamp: 'desc' },
      take: maxStats,
    });

    // Fetch screenshot analyses
    const screenshotAnalyses = await prisma.screenshotAnalysis.findMany({
      where: { userId },
      select: {
        id: true,
        screenshotType: true,
        imageUrl: true,
        title: true,
        description: true,
        summary: true,
        confidence: true,
        processingTime: true,
        modelUsed: true,
        createdAt: true,
        updatedAt: true,
        data: {
          select: {
            id: true,
            key: true,
            value: true,
            dataType: true,
            category: true,
            confidence: true,
          },
        },
        tags: {
          select: {
            id: true,
            tag: true,
            category: true,
          },
        },
        insights: {
          select: {
            id: true,
            type: true,
            priority: true,
            title: true,
            description: true,
            confidence: true,
            actionable: true,
            createdAt: true,
          },
        },
        recommendations: {
          select: {
            id: true,
            type: true,
            priority: true,
            title: true,
            description: true,
            impact: true,
            effort: true,
            actionable: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch screenshot comparisons
    const screenshotComparisons = await prisma.screenshotComparison.findMany({
      where: { userId },
      select: {
        id: true,
        analysisId1: true,
        analysisId2: true,
        comparisonType: true,
        summary: true,
        trend: true,
        differences: true,
        insights: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch club analyses initiated by user
    const clubAnalyses = await prisma.clubAnalysis.findMany({
      where: { userId },
      select: {
        id: true,
        guildId: true,
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

    // Fetch user audit logs
    const auditLogs = await prisma.auditLog.findMany({
      where: { userId },
      select: {
        id: true,
        action: true,
        resourceType: true,
        resourceId: true,
        details: true,
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
      scope: "user",
      exportedAt: new Date().toISOString(),
      userId,

      user: {
        id: user.id,
        discordId: user.discordId,
        username: user.username,
        globalName: user.globalName,
        avatar: user.avatar,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },

      guilds: {
        count: userGuilds.length,
        data: userGuilds.map(ug => ({
          id: ug.id,
          guildId: ug.guildId,
          roles: ug.roles,
          guild: {
            id: ug.guild.id,
            discordId: ug.guild.discordId,
            name: ug.guild.name,
            createdAt: ug.guild.createdAt.toISOString(),
          },
        })),
      },

      conversations: {
        count: conversations.length,
        data: conversations.map(conv => ({
          id: conv.id,
          title: conv.title,
          createdAt: conv.createdAt.toISOString(),
          updatedAt: conv.updatedAt.toISOString(),
          messages: conv.messages.map(msg => ({
            id: msg.id,
            text: msg.text,
            createdAt: msg.createdAt.toISOString(),
          })),
        })),
      },

      chatMessages: {
        count: chatMessages.length,
        truncated: chatMessages.length >= maxChatMessages,
        data: chatMessages.map(msg => ({
          id: msg.id,
          conversationId: msg.conversationId,
          guildId: msg.guildId,
          text: msg.text,
          adminOnly: msg.adminOnly,
          createdAt: msg.createdAt.toISOString(),
        })),
      },

      statistics: {
        count: stats.length,
        truncated: stats.length >= maxStats,
        data: stats.map(s => ({
          id: s.id,
          guildId: s.guildId,
          type: s.type,
          value: s.value,
          timestamp: s.timestamp.toISOString(),
        })),
      },

      screenshotAnalyses: {
        count: screenshotAnalyses.length,
        data: screenshotAnalyses.map(analysis => ({
          id: analysis.id,
          screenshotType: analysis.screenshotType,
          imageUrl: analysis.imageUrl,
          title: analysis.title,
          description: analysis.description,
          summary: analysis.summary,
          confidence: analysis.confidence,
          processingTime: analysis.processingTime,
          modelUsed: analysis.modelUsed,
          createdAt: analysis.createdAt.toISOString(),
          updatedAt: analysis.updatedAt.toISOString(),
          data: analysis.data.map(d => ({
            id: d.id,
            key: d.key,
            value: d.value,
            dataType: d.dataType,
            category: d.category,
            confidence: d.confidence,
          })),
          tags: analysis.tags.map(t => ({
            id: t.id,
            tag: t.tag,
            category: t.category,
          })),
          insights: analysis.insights.map(i => ({
            id: i.id,
            type: i.type,
            priority: i.priority,
            title: i.title,
            description: i.description,
            confidence: i.confidence,
            actionable: i.actionable,
            createdAt: i.createdAt.toISOString(),
          })),
          recommendations: analysis.recommendations.map(r => ({
            id: r.id,
            type: r.type,
            priority: r.priority,
            title: r.title,
            description: r.description,
            impact: r.impact,
            effort: r.effort,
            actionable: r.actionable,
            createdAt: r.createdAt.toISOString(),
          })),
        })),
      },

      screenshotComparisons: {
        count: screenshotComparisons.length,
        data: screenshotComparisons.map(comp => ({
          id: comp.id,
          analysisId1: comp.analysisId1,
          analysisId2: comp.analysisId2,
          comparisonType: comp.comparisonType,
          summary: comp.summary,
          trend: comp.trend,
          differences: comp.differences,
          insights: comp.insights,
          createdAt: comp.createdAt.toISOString(),
        })),
      },

      clubAnalyses: {
        count: clubAnalyses.length,
        data: clubAnalyses.map(analysis => ({
          id: analysis.id,
          guildId: analysis.guildId,
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
          "Session tokens excluded for security",
          "Chat messages limited to most recent " + maxChatMessages,
          "Statistics limited to most recent " + maxStats,
          "Audit logs limited to most recent " + maxAuditLogs,
          "IP addresses and user agents excluded from audit logs for privacy",
        ],
      },
    };

    return exportData;
  } catch (error) {
    console.error("[userExport] Error exporting user data:", error);
    throw error;
  }
}

module.exports = {
  exportUserData,
};
