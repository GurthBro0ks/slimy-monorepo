/**
 * Test data factories for creating test fixtures
 * Simplifies creation of consistent test data
 */

import { PrismaClient } from '@prisma/client';
import { getTestPrismaClient } from './setupTestDb';

/**
 * Factory for creating test User records
 */
export async function createTestUser(
  overrides?: Record<string, any>
) {
  const prisma = getTestPrismaClient();
  return prisma.user.create({
    data: {
      discordId: overrides?.discordId || `discord_${Math.random().toString(36).slice(2, 9)}`,
      username: overrides?.username || 'testuser',
      globalName: overrides?.globalName || 'Test User',
      avatar: overrides?.avatar || null,
      ...overrides,
    },
  });
}

/**
 * Factory for creating test Guild records
 */
export async function createTestGuild(
  overrides?: Record<string, any>
) {
  const prisma = getTestPrismaClient();
  return prisma.guild.create({
    data: {
      discordId: overrides?.discordId || `guild_${Math.random().toString(36).slice(2, 9)}`,
      name: overrides?.name || 'Test Guild',
      settings: overrides?.settings || {},
      ...overrides,
    },
  });
}

/**
 * Factory for creating test GuildSettings records
 */
export async function createTestGuildSettings(
  guildDiscordId: string,
  overrides?: Record<string, any>
) {
  const prisma = getTestPrismaClient();
  return prisma.guildSettings.create({
    data: {
      guildId: guildDiscordId,
      sheetId: overrides?.sheetId || null,
      sheetTab: overrides?.sheetTab || null,
      viewMode: overrides?.viewMode || 'baseline',
      allowPublic: overrides?.allowPublic || false,
      screenshotChannelId: overrides?.screenshotChannelId || null,
      uploadsEnabled: overrides?.uploadsEnabled !== false,
      notes: overrides?.notes || null,
      ...overrides,
    },
  });
}

/**
 * Factory for creating test GuildPersonality records
 */
export async function createTestGuildPersonality(
  guildDiscordId: string,
  overrides?: Record<string, any>
) {
  const prisma = getTestPrismaClient();
  return prisma.guildPersonality.create({
    data: {
      guildId: guildDiscordId,
      systemPrompt: overrides?.systemPrompt || 'You are a helpful bot.',
      temperature: overrides?.temperature || 0.7,
      topP: overrides?.topP || 1.0,
      tone: overrides?.tone || 'neutral',
      ...overrides,
    },
  });
}

/**
 * Factory for creating test UserGuild records
 */
export async function createTestUserGuild(
  userId: string,
  guildId: string,
  overrides?: Record<string, any>
) {
  const prisma = getTestPrismaClient();
  return prisma.userGuild.create({
    data: {
      userId,
      guildId,
      roles: overrides?.roles || ['member'],
      ...overrides,
    },
  });
}

/**
 * Factory for creating test Session records
 */
export async function createTestSession(
  userId: string,
  overrides?: Record<string, any>
) {
  const prisma = getTestPrismaClient();
  return prisma.session.create({
    data: {
      userId,
      token: overrides?.token || `test_token_${Math.random().toString(36).slice(2, 9)}`,
      expiresAt: overrides?.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000),
      ...overrides,
    },
  });
}

/**
 * Factory for creating test Correction records
 */
export async function createTestCorrection(
  guildId: string,
  overrides?: Record<string, any>
) {
  const prisma = getTestPrismaClient();
  return prisma.correction.create({
    data: {
      guildId,
      weekId: overrides?.weekId || 'week_1',
      memberKey: overrides?.memberKey || 'member_1',
      metric: overrides?.metric || 'test_metric',
      value: overrides?.value || { corrected: true },
      reason: overrides?.reason || null,
      createdBy: overrides?.createdBy || null,
      ...overrides,
    },
  });
}

/**
 * Factory for creating test AuditLog records
 */
export async function createTestAuditLog(
  overrides?: Record<string, any>
) {
  const prisma = getTestPrismaClient();
  return prisma.auditLog.create({
    data: {
      userId: overrides?.userId || null,
      action: overrides?.action || 'test_action',
      resourceType: overrides?.resourceType || 'test',
      resourceId: overrides?.resourceId || 'test_id',
      details: overrides?.details || {},
      success: overrides?.success !== false,
      ...overrides,
    },
  });
}

/**
 * Factory for creating test ClubAnalysis records
 */
export async function createTestClubAnalysis(
  guildId: string,
  userId: string,
  overrides?: Record<string, any>
) {
  const prisma = getTestPrismaClient();
  return prisma.clubAnalysis.create({
    data: {
      guildId,
      userId,
      title: overrides?.title || 'Test Analysis',
      summary: overrides?.summary || 'Test summary of analysis',
      confidence: overrides?.confidence || 0.95,
      ...overrides,
    },
  });
}

/**
 * Factory for creating test ScreenshotAnalysis records
 */
export async function createTestScreenshotAnalysis(
  userId: string,
  overrides?: Record<string, any>
) {
  const prisma = getTestPrismaClient();
  return prisma.screenshotAnalysis.create({
    data: {
      userId,
      screenshotType: overrides?.screenshotType || 'game-stats',
      imageUrl: overrides?.imageUrl || 'https://example.com/image.png',
      title: overrides?.title || 'Test Screenshot',
      description: overrides?.description || 'Test description',
      summary: overrides?.summary || 'Test analysis summary',
      confidence: overrides?.confidence || 0.9,
      processingTime: overrides?.processingTime || 1500,
      modelUsed: overrides?.modelUsed || 'gpt-4-vision',
      ...overrides,
    },
  });
}

/**
 * Helper to create a full test suite with user, guild, and settings
 */
export async function createFullTestGuildSetup(options?: {
  userOverrides?: Record<string, any>;
  guildOverrides?: Record<string, any>;
  settingsOverrides?: Record<string, any>;
  personalityOverrides?: Record<string, any>;
}) {
  const user = await createTestUser(options?.userOverrides);
  const guild = await createTestGuild(options?.guildOverrides);
  const settings = await createTestGuildSettings(guild.discordId, options?.settingsOverrides);
  const personality = await createTestGuildPersonality(guild.discordId, options?.personalityOverrides);
  const userGuild = await createTestUserGuild(user.id, guild.id);

  return {
    user,
    guild,
    settings,
    personality,
    userGuild,
  };
}
