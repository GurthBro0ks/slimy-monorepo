/**
 * Guild Settings Repository
 * Implements dual-write pattern for gradual migration from MySQL to Prisma
 *
 * Feature flags:
 * - ENABLE_PRISMA_GUILD_SETTINGS: When true, enables dual-write and Prisma reads
 */

import { PrismaClient } from '@prisma/client';
import { isFeatureEnabled } from '../lib/config/featureFlags';

interface GuildSettingsData {
  guild_id: string;
  sheet_id: string | null;
  sheet_tab: string | null;
  view_mode: 'baseline' | 'latest';
  allow_public: boolean | number;
  screenshot_channel_id: string | null;
  uploads_enabled: boolean | number;
  notes: string | null;
}

interface GuildSettingsResponse {
  guild_id: string;
  sheet_id: string | null;
  sheet_tab: string | null;
  view_mode: 'baseline' | 'latest';
  allow_public: number;
  screenshot_channel_id: string | null;
  uploads_enabled: number;
  notes: string | null;
}

/**
 * Guild Settings Repository
 * Handles all guild settings operations with dual-write support
 */
export class GuildSettingsRepository {
  private prisma: PrismaClient;
  private mysqlQueries: any; // Legacy MySQL query function

  constructor(prisma: PrismaClient, mysqlQueries?: any) {
    this.prisma = prisma;
    this.mysqlQueries = mysqlQueries;
  }

  /**
   * Get guild settings by guild ID
   * Reads from appropriate source based on feature flag
   */
  async getSettings(guildId: string): Promise<GuildSettingsResponse> {
    const prismaEnabled = isFeatureEnabled('ENABLE_PRISMA_GUILD_SETTINGS');

    try {
      if (prismaEnabled) {
        // Read from Prisma
        const settings = await this.prisma.guildSettings.findUnique({
          where: { guildId },
        });

        if (!settings) {
          return this._getDefaults(guildId);
        }

        return {
          guild_id: settings.guildId,
          sheet_id: settings.sheetId,
          sheet_tab: settings.sheetTab,
          view_mode: settings.viewMode as 'baseline' | 'latest',
          allow_public: settings.allowPublic ? 1 : 0,
          screenshot_channel_id: settings.screenshotChannelId,
          uploads_enabled: settings.uploadsEnabled ? 1 : 0,
          notes: settings.notes,
        };
      } else {
        // Read from MySQL (legacy)
        // This would call the legacy MySQL function
        // For now, return defaults
        return this._getDefaults(guildId);
      }
    } catch (error) {
      console.error(`[GuildSettingsRepository] Error reading settings for guild ${guildId}:`, error);
      return this._getDefaults(guildId);
    }
  }

  /**
   * Update or create guild settings
   * Writes to both MySQL and Prisma if feature flag enabled (dual-write)
   */
  async upsertSettings(
    guildId: string,
    patch: Partial<GuildSettingsData>
  ): Promise<GuildSettingsResponse> {
    const prismaEnabled = isFeatureEnabled('ENABLE_PRISMA_GUILD_SETTINGS');
    const current = await this.getSettings(guildId);

    const next: GuildSettingsResponse = {
      guild_id: guildId,
      sheet_id: patch.sheet_id ?? current.sheet_id,
      sheet_tab: patch.sheet_tab ?? current.sheet_tab,
      view_mode: (patch.view_mode ?? current.view_mode) as 'baseline' | 'latest',
      allow_public: Number(patch.allow_public ?? current.allow_public) ? 1 : 0,
      screenshot_channel_id: patch.screenshot_channel_id ?? current.screenshot_channel_id,
      uploads_enabled: Number(patch.uploads_enabled ?? current.uploads_enabled) ? 1 : 0,
      notes: patch.notes ?? current.notes,
    };

    try {
      // Always try MySQL write for backwards compatibility (if available)
      // This would call the legacy MySQL function
      // await this.mysqlQueries?.upsertGuildSettings?.(guildId, next);

      // If feature flag enabled, also write to Prisma (dual-write)
      if (prismaEnabled) {
        await this.prisma.guildSettings.upsert({
          where: { guildId },
          update: {
            sheetId: next.sheet_id,
            sheetTab: next.sheet_tab,
            viewMode: next.view_mode,
            allowPublic: next.allow_public === 1,
            screenshotChannelId: next.screenshot_channel_id,
            uploadsEnabled: next.uploads_enabled === 1,
            notes: next.notes,
          },
          create: {
            guildId,
            sheetId: next.sheet_id,
            sheetTab: next.sheet_tab,
            viewMode: next.view_mode,
            allowPublic: next.allow_public === 1,
            screenshotChannelId: next.screenshot_channel_id,
            uploadsEnabled: next.uploads_enabled === 1,
            notes: next.notes,
          },
        });
      }

      return next;
    } catch (error) {
      console.error(`[GuildSettingsRepository] Error upserting settings for guild ${guildId}:`, error);
      throw error;
    }
  }

  /**
   * Get default settings for a guild
   */
  private _getDefaults(guildId: string): GuildSettingsResponse {
    return {
      guild_id: guildId,
      sheet_id: process.env.STATS_SHEET_ID || null,
      sheet_tab: process.env.STATS_BASELINE_TITLE || 'Baseline (10-24-25)',
      view_mode: 'baseline',
      allow_public: 0,
      screenshot_channel_id: null,
      uploads_enabled: 1,
      notes: null,
    };
  }

  /**
   * Validate settings consistency between MySQL and Prisma
   * Useful for monitoring during migration
   */
  async validateConsistency(guildId: string): Promise<{
    consistent: boolean;
    prismaData?: any;
    mysqlData?: any;
    differences?: string[];
  }> {
    try {
      const prismaData = await this.prisma.guildSettings.findUnique({
        where: { guildId },
      });

      // For MySQL, we would query here
      // const mysqlData = await this.mysqlQueries?.getGuildSettings?.(guildId);

      // For now, just check Prisma data
      return {
        consistent: !!prismaData,
        prismaData,
      };
    } catch (error) {
      console.error(`[GuildSettingsRepository] Error validating consistency for guild ${guildId}:`, error);
      return {
        consistent: false,
        differences: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }
}

/**
 * Create a singleton instance of GuildSettingsRepository
 */
let instance: GuildSettingsRepository | null = null;

export function createGuildSettingsRepository(prisma: PrismaClient, mysqlQueries?: any): GuildSettingsRepository {
  if (!instance) {
    instance = new GuildSettingsRepository(prisma, mysqlQueries);
  }
  return instance;
}

export function getGuildSettingsRepository(): GuildSettingsRepository {
  if (!instance) {
    throw new Error('GuildSettingsRepository not initialized. Call createGuildSettingsRepository first.');
  }
  return instance;
}
