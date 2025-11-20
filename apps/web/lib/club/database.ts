import { ClubAnalysisResult } from './vision';
import {
  createClubAnalysis,
  getClubAnalyses,
  getClubAnalysis,
  type ClubAnalysis,
} from '@/lib/api/clubAnalytics';

// Types for database operations
export interface StoredClubAnalysis {
  id: string;
  guildId: string;
  userId: string;
  title?: string;
  summary: string;
  confidence: number;
  createdAt: Date;
  updatedAt: Date;
  images: StoredClubAnalysisImage[];
  metrics: StoredClubMetric[];
}

export interface StoredClubAnalysisImage {
  id: string;
  imageUrl: string;
  originalName: string;
  fileSize: number;
  uploadedAt: Date;
}

export interface StoredClubMetric {
  id: string;
  name: string;
  value: any;
  unit?: string;
  category: string;
}

/**
 * Club Database Client
 *
 * Provides persistence layer for club analysis data.
 * All data is stored in admin-api (canonical source), not in web's local Prisma.
 * This class acts as a bridge between web components and admin-api.
 */
class ClubDatabaseClient {
  private isConnected = true;

  async connect(): Promise<void> {
    // Connection is implicit through admin-api client
    // No explicit connection needed
  }

  /**
   * Store a new analysis to admin-api
   * Called after AI analysis is completed
   */
  async storeAnalysis(
    guildId: string,
    userId: string,
    analysisResult: ClubAnalysisResult,
    imageUrls: string[]
  ): Promise<StoredClubAnalysis> {
    await this.connect();

    try {
      // Convert analysis result to admin-api format
      const response = await createClubAnalysis({
        guildId,
        userId,
        title: `Club Analysis ${new Date().toLocaleDateString()}`,
        summary: analysisResult.analysis.summary,
        confidence: analysisResult.confidence,
        imageUrls: imageUrls || [],
        metrics: Object.entries(analysisResult.analysis.metrics).map(([key, value]) => ({
          name: key,
          value,
          category: this.categorizeMetric(key),
        })),
      });

      if (!response.ok) {
        throw new Error(`Failed to store analysis: ${response.message}`);
      }

      // Fetch the full analysis data with relations
      const analysis = await this.getAnalysisById(response.data.analysis.id);
      if (!analysis) {
        throw new Error('Analysis created but could not retrieve it');
      }

      console.log('Analysis stored in admin-api:', analysis.id);
      return analysis;
    } catch (error) {
      console.error('Failed to store analysis in admin-api:', error);
      throw error;
    }
  }

  /**
   * Retrieve all analyses for a guild from admin-api
   */
  async getAnalysesByGuild(
    guildId: string,
    limit = 10,
    offset = 0
  ): Promise<StoredClubAnalysis[]> {
    await this.connect();

    try {
      const response = await getClubAnalyses(guildId, { limit, offset });

      if (!response.ok) {
        console.error('Failed to retrieve analyses:', response.message);
        return [];
      }

      return response.data.analyses as StoredClubAnalysis[];
    } catch (error) {
      console.error('Error retrieving analyses from admin-api:', error);
      return [];
    }
  }

  /**
   * Retrieve a specific analysis by ID from admin-api
   */
  async getAnalysisById(id: string): Promise<StoredClubAnalysis | null> {
    await this.connect();

    try {
      const response = await getClubAnalysis(id);

      if (!response.ok) {
        console.error('Analysis not found:', id);
        return null;
      }

      return response.data.analysis as StoredClubAnalysis;
    } catch (error) {
      console.error('Error retrieving analysis from admin-api:', error);
      return null;
    }
  }

  /**
   * Delete an analysis from admin-api (not implemented yet)
   * Will be added in Phase 3
   */
  async deleteAnalysis(id: string): Promise<boolean> {
    await this.connect();

    // TODO: Implement DELETE endpoint in admin-api
    console.warn('deleteAnalysis not yet implemented');
    return false;
  }

  /**
   * Categorize a metric based on its name
   */
  private categorizeMetric(metricName: string): string {
    const categories: Record<string, string> = {
      totalMembers: 'membership',
      activeMembers: 'activity',
      performanceScore: 'performance',
      averageScore: 'performance',
      winRate: 'performance',
      participationRate: 'activity',
    };

    return categories[metricName] || 'general';
  }
}

// Export singleton instance
export const clubDatabase = new ClubDatabaseClient();
