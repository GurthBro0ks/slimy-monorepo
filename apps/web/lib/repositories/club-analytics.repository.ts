/**
 * Club Analytics Repository
 *
 * Handles database operations for club analytics
 */

import { db, Prisma } from '../db';
import type { ClubAnalysis } from '../db';

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

const clubAnalysisInclude = Prisma.validator<Prisma.ClubAnalysisInclude>()({
  images: true,
  metrics: true,
});

export type ClubAnalysisWithRelations = Prisma.ClubAnalysisGetPayload<{
  include: typeof clubAnalysisInclude;
}>;

/**
 * Club Analytics Repository
 */
export class ClubAnalyticsRepository {
  /**
   * Create a new club analysis
   */
  async create(input: CreateClubAnalysisInput): Promise<ClubAnalysisWithRelations> {
    return db.clubAnalysis.create({
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
      include: clubAnalysisInclude,
    }) as Promise<ClubAnalysisWithRelations>;
  }

  /**
   * Get analysis by ID
   */
  async findById(id: string): Promise<ClubAnalysisWithRelations | null> {
    return db.clubAnalysis.findUnique({
      where: { id },
      include: clubAnalysisInclude,
    }) as Promise<ClubAnalysisWithRelations | null>;
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
    return db.clubAnalysis.findMany({
      where: { guildId },
      include: clubAnalysisInclude,
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 20,
      skip: options?.offset || 0,
    }) as Promise<ClubAnalysisWithRelations[]>;
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
    return db.clubAnalysis.findMany({
      where: { userId },
      include: clubAnalysisInclude,
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 20,
      skip: options?.offset || 0,
    }) as Promise<ClubAnalysisWithRelations[]>;
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
    return db.clubAnalysis.findMany({
      include: clubAnalysisInclude,
      orderBy: { createdAt: 'desc' },
      take: limit,
    }) as Promise<ClubAnalysisWithRelations[]>;
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
    return db.clubAnalysis.findMany({
      where: {
        AND: [
          options?.guildId ? { guildId: options.guildId } : {},
          options?.userId ? { userId: options.userId } : {},
          {
            OR: [
              { title: { contains: query } },
              { summary: { contains: query } },
            ],
          },
        ],
      },
      include: clubAnalysisInclude,
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 20,
      skip: options?.offset || 0,
    }) as Promise<ClubAnalysisWithRelations[]>;
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
