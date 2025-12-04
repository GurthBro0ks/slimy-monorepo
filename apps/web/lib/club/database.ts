import type { ClubAnalysisResult } from './vision';
import {
  getClubAnalyticsRepository,
  type ClubAnalysisWithRelations,
} from '@/lib/repositories/club-analytics.repository';

// Types for database operations
export interface StoredClubAnalysis {
  id: string;
  guildId: string;
  userId: string;
  title?: string | null;
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
  unit?: string | null;
  category: string | null;
}

class ClubDatabaseClient {
  private repository = getClubAnalyticsRepository();

  /**
   * Persist an analysis result for a guild/user pair
   */
  async storeAnalysis(
    guildId: string,
    userId: string,
    analysisResult: ClubAnalysisResult,
    imageUrls: string[]
  ): Promise<StoredClubAnalysis> {
    const images = (imageUrls.length ? imageUrls : [analysisResult.imageUrl]).map((url, index) => ({
      imageUrl: url,
      originalName: this.extractFilename(url, index),
      fileSize: 0,
    }));

    const metrics = Object.entries(analysisResult.analysis.metrics || {}).map(([name, value]) => ({
      name,
      value,
      category: this.categorizeMetric(name),
    }));

    const stored = await this.repository.create({
      guildId,
      userId,
      title: analysisResult.analysis.summary || `Club Analysis ${new Date().toLocaleDateString()}`,
      summary: analysisResult.analysis.summary,
      confidence: analysisResult.confidence,
      images,
      metrics,
    });

    return this.mapAnalysis(stored);
  }

  /**
   * Fetch analyses for a guild with pagination
   */
  async getAnalysesByGuild(
    guildId: string,
    limit = 10,
    offset = 0
  ): Promise<StoredClubAnalysis[]> {
    const analyses = await this.repository.findByGuild(guildId, { limit, offset });
    return analyses.map((analysis) => this.mapAnalysis(analysis));
  }

  /**
   * Count analyses for a guild
   */
  async countAnalysesByGuild(guildId: string): Promise<number> {
    return this.repository.countByGuild(guildId);
  }

  /**
   * Retrieve single analysis
   */
  async getAnalysisById(id: string): Promise<StoredClubAnalysis | null> {
    const analysis = await this.repository.findById(id);
    return analysis ? this.mapAnalysis(analysis) : null;
  }

  /**
   * Delete analysis record
   */
  async deleteAnalysis(id: string): Promise<boolean> {
    await this.repository.delete(id);
    return true;
  }

  private mapAnalysis(record: ClubAnalysisWithRelations): StoredClubAnalysis {
    return {
      id: record.id,
      guildId: record.guildId,
      userId: record.userId,
      title: record.title,
      summary: record.summary,
      confidence: record.confidence,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      images: record.images.map((image) => ({
        id: image.id,
        imageUrl: image.imageUrl,
        originalName: image.originalName,
        fileSize: image.fileSize,
        uploadedAt: image.uploadedAt,
      })),
      metrics: record.metrics.map((metric) => ({
        id: metric.id,
        name: metric.name,
        value: this.parseMetricValue(metric.value),
        unit: metric.unit,
        category: metric.category,
      })),
    };
  }

  private parseMetricValue(value: unknown) {
    if (typeof value !== 'string') return value;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  private extractFilename(url: string, index: number): string {
    const fromUrl = url.split('/').pop();
    if (fromUrl && fromUrl.trim().length > 0) {
      return fromUrl;
    }
    return `screenshot_${index + 1}.png`;
  }

  private categorizeMetric(metricName: string): string {
    const categories = {
      totalMembers: 'membership',
      activeMembers: 'activity',
      performanceScore: 'performance',
      averageScore: 'performance',
      winRate: 'performance',
      participationRate: 'activity',
    };

    return categories[metricName as keyof typeof categories] || 'general';
  }
}

export const clubDatabase = new ClubDatabaseClient();
