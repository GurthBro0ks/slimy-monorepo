/**
 * Club Sheet Repository
 *
 * Handles database operations for club spreadsheet data
 */

import { db } from '../db';
import type { ClubSheet } from '@prisma/client';
import type { Prisma } from '@prisma/client';

export interface UpdateClubSheetInput {
  data: Prisma.InputJsonValue;
}

/**
 * Club Sheet Repository
 */
export class ClubSheetRepository {
  /**
   * Get club sheet by guild ID
   */
  async findByGuildId(guildId: string): Promise<ClubSheet | null> {
    return await db.clubSheet.findUnique({
      where: { guildId },
    });
  }

  /**
   * Get or create club sheet with default empty data
   */
  async getOrCreate(guildId: string): Promise<ClubSheet> {
    let sheet = await this.findByGuildId(guildId);

    if (!sheet) {
      sheet = await db.clubSheet.create({
        data: {
          guildId,
          data: {},
        },
      });
    }

    return sheet;
  }

  /**
   * Update or create club sheet data
   */
  async upsert(guildId: string, data: Prisma.InputJsonValue): Promise<ClubSheet> {
    return await db.clubSheet.upsert({
      where: { guildId },
      update: { data },
      create: {
        guildId,
        data,
      },
    });
  }

  /**
   * Delete club sheet
   */
  async delete(guildId: string): Promise<ClubSheet> {
    return await db.clubSheet.delete({
      where: { guildId },
    });
  }
}

// Singleton instance
let repositoryInstance: ClubSheetRepository | null = null;

/**
 * Get club sheet repository instance
 */
export function getClubSheetRepository(): ClubSheetRepository {
  if (!repositoryInstance) {
    repositoryInstance = new ClubSheetRepository();
  }
  return repositoryInstance;
}
