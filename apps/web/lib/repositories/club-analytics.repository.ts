/**
 * Club Analytics Repository
 *
 * Handles database operations for club analytics
 */

import { db } from '../db';
import type { ClubAnalysis, ClubAnalysisImage, ClubMetric } from '../db';

export interface CreateClubAnalysisInput {
  guildId: string;
  userId: string;
  title?: string;
  summary: string;
  confidence: number;
  images: Array<{
    imageUrl: string;
    originalName: string;
    fileSize: number;
  }>;
  metrics: Array<{
    name: string;
    value: string | number | boolean | Record<string, unknown>;
    unit?: string;
    category: string;
  }>;
}

export interface ClubAnalysisWithRelations extends ClubAnalysis {
  images: ClubAnalysisImage[];
  metrics: ClubMetric[];
}

/**
 * Club Analytics Repository
 */
export class ClubAnalyticsRepository {
  /**
   * Create a new club analysis
   */
  async create(input: CreateClubAnalysisInput): Promise<ClubAnalysisWithRelations> {
    return await db.clubAnalysis.create({
      data: {
        guildId: input.guildId,
        userId: input.userId,
        title: input.title,
        summary: input.summary,
        confidence: input.confidence,
        images: {
          create: input.images,
        },
        metrics: {
          create: input.metrics.map((metric) => ({
            ...metric,
            value: JSON.stringify(metric.value),
          })),
        },
      },
      include: {
        images: true,
        metrics: true,
      },
    });
  }

  /**
   * Get analysis by ID
   */
  async findById(id: string): Promise<ClubAnalysisWithRelations | null> {
    return await db.clubAnalysis.findUnique({
      where: { id },
      include: {
        images: true,
        metrics: true,
      },
    });
  }

  /**
   * Get all analyses for a guild
   */
  async findByGuild(
    guildId: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<ClubAnalysisWithRelations[]> {
    return await db.clubAnalysis.findMany({
      where: { guildId },
      include: {
        images: true,
        metrics: true,
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 20,
      skip: options?.offset || 0,
    });
  }

  /**
   * Get all analyses by user
   */
  async findByUser(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<ClubAnalysisWithRelations[]> {
    return await db.clubAnalysis.findMany({
      where: { userId },
      include: {
        images: true,
        metrics: true,
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 20,
      skip: options?.offset || 0,
    });
  }

  /**
   * Delete analysis by ID
   */
  async delete(id: string): Promise<ClubAnalysis> {
    return await db.clubAnalysis.delete({
      where: { id },
    });
  }

  /**
   * Update analysis
   */
  async update(
    id: string,
    data: Partial<Pick<ClubAnalysis, 'title' | 'summary' | 'confidence'>>
  ): Promise<ClubAnalysis> {
    return await db.clubAnalysis.update({
      where: { id },
      data,
    });
  }

  /**
   * Get analysis count for guild
   */
  async countByGuild(guildId: string): Promise<number> {
    return await db.clubAnalysis.count({
      where: { guildId },
    });
  }

  /**
   * Get analysis count for user
   */
  async countByUser(userId: string): Promise<number> {
    return await db.clubAnalysis.count({
      where: { userId },
    });
  }

  /**
   * Get recent analyses across all guilds
   */
  async findRecent(limit: number = 10): Promise<ClubAnalysisWithRelations[]> {
    return await db.clubAnalysis.findMany({
      include: {
        images: true,
        metrics: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Search analyses by title or summary
   */
  async search(
    query: string,
    options?: {
      guildId?: string;
      userId?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<ClubAnalysisWithRelations[]> {
    return await db.clubAnalysis.findMany({
      where: {
        AND: [
          options?.guildId ? { guildId: options.guildId } : {},
          options?.userId ? { userId: options.userId } : {},
          {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { summary: { contains: query, mode: 'insensitive' } },
            ],
          },
        ],
      },
      include: {
        images: true,
        metrics: true,
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 20,
      skip: options?.offset || 0,
    });
  }
}

// Singleton instance
let repositoryInstance: ClubAnalyticsRepository | null = null;

/**
 * Get club analytics repository instance
 */
export function getClubAnalyticsRepository(): ClubAnalyticsRepository {
  if (!repositoryInstance) {
    repositoryInstance = new ClubAnalyticsRepository();
  }
  return repositoryInstance;
}
