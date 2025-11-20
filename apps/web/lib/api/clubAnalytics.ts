/**
 * Club Analytics API Client
 *
 * Provides typed API methods for interacting with admin-api club analytics endpoints.
 * All club analysis data is stored in and retrieved from admin-api (canonical source).
 */

import { adminApiClient, type ApiResponse } from './admin-client';

export interface ClubAnalysisImage {
  id: string;
  imageUrl: string;
  originalName: string;
  fileSize: number;
  uploadedAt: Date;
}

export interface ClubMetric {
  id: string;
  name: string;
  value: any;
  unit?: string;
  category: string;
}

export interface ClubAnalysis {
  id: string;
  guildId: string;
  userId: string;
  title?: string;
  summary: string;
  confidence: number;
  createdAt: Date;
  updatedAt: Date;
  images: ClubAnalysisImage[];
  metrics: ClubMetric[];
}

export interface CreateClubAnalysisRequest {
  guildId: string;
  userId: string;
  title?: string;
  summary: string;
  confidence: number;
  imageUrls: string[];
  metrics: Array<{
    name: string;
    value: any;
    unit?: string;
    category: string;
  }>;
}

export interface ClubAnalysisResponse {
  id: string;
  guildId: string;
  userId: string;
  title?: string;
  summary: string;
  confidence: number;
  createdAt: Date;
  updatedAt: Date;
  imageCount: number;
  metricCount: number;
}

export interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Create a new club analysis
 */
export async function createClubAnalysis(
  request: CreateClubAnalysisRequest
): Promise<ApiResponse<{ analysis: ClubAnalysisResponse }>> {
  return adminApiClient.post('/club-analytics/analysis', request);
}

/**
 * Get all analyses for a guild (paginated)
 */
export async function getClubAnalyses(
  guildId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<
  ApiResponse<{
    analyses: ClubAnalysis[];
    pagination: PaginationInfo;
  }>
> {
  const limit = options.limit || 10;
  const offset = options.offset || 0;
  return adminApiClient.get(
    `/club-analytics/analyses?guildId=${guildId}&limit=${limit}&offset=${offset}`
  );
}

/**
 * Get a specific analysis by ID
 */
export async function getClubAnalysis(
  analysisId: string
): Promise<ApiResponse<{ analysis: ClubAnalysis }>> {
  return adminApiClient.get(`/club-analytics/analyses/${analysisId}`);
}

/**
 * Get the latest analyses for a guild
 */
export async function getLatestClubAnalysis(
  guildId: string
): Promise<ApiResponse<{ snapshot: any }>> {
  return adminApiClient.get(`/club-analytics/latest?guildId=${guildId}`);
}

/**
 * Get analysis history for a guild
 */
export async function getClubAnalysisHistory(
  guildId: string,
  options: { limit?: number } = {}
): Promise<ApiResponse<{ snapshots: any[] }>> {
  const limit = options.limit || 10;
  return adminApiClient.get(`/club-analytics/history?guildId=${guildId}&limit=${limit}`);
}
