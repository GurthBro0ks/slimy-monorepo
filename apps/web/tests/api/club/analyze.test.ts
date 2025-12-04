import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockAuthUser } from '../../utils/auth-mock';

// Mock headers/cookies to prevent issues with next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn(),
    toString: vi.fn().mockReturnValue(''),
  }),
}));

// Mock authentication
vi.mock('@/lib/auth/server', () => ({
  requireAuth: vi.fn().mockResolvedValue(mockAuthUser),
}));

// Mock the vision analysis
vi.mock('@/lib/club/vision', () => ({
  analyzeClubScreenshot: vi.fn(),
  analyzeClubScreenshots: vi.fn(),
  validateImageUrl: vi.fn(),
}));

// Mock the database
vi.mock('@/lib/club/database', () => ({
  clubDatabase: {
    storeAnalysis: vi.fn(),
    getAnalysesByGuild: vi.fn(),
    countAnalysesByGuild: vi.fn(),
  },
}));

// Mock NextRequest/NextResponse
vi.mock('next/server', () => ({
  NextRequest: class MockNextRequest {
    constructor(url: string) {
      this.url = url;
      this.nextUrl = new URL(url);
    }
    url: string;
    nextUrl: URL;
  },
  NextResponse: {
    json: vi.fn((data, options) => ({
      json: () => data,
      status: options?.status || 200,
    })),
  },
}));

import { POST, GET } from '@/app/api/club/analyze/route';
import { analyzeClubScreenshot, analyzeClubScreenshots, validateImageUrl } from '@/lib/club/vision';
import { clubDatabase } from '@/lib/club/database';
import { requireAuth } from '@/lib/auth/server';

describe('/api/club/analyze', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (requireAuth as any).mockResolvedValue(mockAuthUser);
    (validateImageUrl as any).mockResolvedValue(true);
    (analyzeClubScreenshot as any).mockResolvedValue({
      id: 'analysis-1',
      timestamp: new Date(),
      imageUrl: 'http://example.com/image.png',
      analysis: {
        summary: 'Test analysis',
        metrics: { totalMembers: 25 },
        insights: ['Good performance'],
        recommendations: ['Keep it up']
      },
      confidence: 0.85
    });
    (analyzeClubScreenshots as any).mockResolvedValue([{
      id: 'analysis-1',
      timestamp: new Date(),
      imageUrl: 'http://example.com/image.png',
      analysis: {
        summary: 'Test analysis',
        metrics: { totalMembers: 25 },
        insights: ['Good performance'],
        recommendations: ['Keep it up']
      },
      confidence: 0.85
    }]);
    (clubDatabase.storeAnalysis as any).mockResolvedValue({
      id: 'stored-1',
      guildId: 'guild-123',
      userId: mockAuthUser.id,
      summary: 'Test analysis',
      confidence: 0.85,
      createdAt: new Date(),
      metrics: [],
      images: []
    });
    (clubDatabase.getAnalysesByGuild as any).mockResolvedValue([]);
    (clubDatabase.countAnalysesByGuild as any).mockResolvedValue(0);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('POST /api/club/analyze', () => {
    it('should return 400 when no imageUrls provided', async () => {
      const mockRequest = {
        json: () => Promise.resolve({
          guildId: 'guild-123'
        }),
      } as any;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(data.code).toBe('VALIDATION_ERROR');
      expect(data.message).toBe('At least one image URL is required');
      expect(response.status).toBe(400);
    });

    it('should return 400 when no guildId provided', async () => {
      const mockRequest = {
        json: () => Promise.resolve({
          imageUrls: ['http://example.com/image.png']
        }),
      } as any;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(data.code).toBe('VALIDATION_ERROR');
      expect(data.message).toBe('Guild ID is required');
      expect(response.status).toBe(400);
    });

    it('should return 400 when no valid image URLs', async () => {
      (validateImageUrl as any).mockResolvedValue(false);

      const mockRequest = {
        json: () => Promise.resolve({
          imageUrls: ['http://invalid.com/image.png'],
          guildId: 'guild-123'
        }),
      } as any;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(data.code).toBe('VALIDATION_ERROR');
      expect(data.message).toBe('No valid image URLs provided');
      expect(response.status).toBe(400);
    });

    it('should analyze single image successfully', async () => {
      const mockRequest = {
        json: () => Promise.resolve({
          imageUrls: ['http://example.com/image.png'],
          guildId: 'guild-123'
        }),
      } as any;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.results).toHaveLength(1);
      expect(data.summary.analyzedImages).toBe(1);
      expect(analyzeClubScreenshot).toHaveBeenCalledWith('http://example.com/image.png', undefined);
      expect(clubDatabase.storeAnalysis).toHaveBeenCalledWith(
        'guild-123',
        mockAuthUser.id,  // Uses authenticated user's ID, not client-provided
        expect.anything(),
        expect.anything()
      );
    });

    it('should analyze multiple images successfully', async () => {
      const mockRequest = {
        json: () => Promise.resolve({
          imageUrls: ['http://example.com/image1.png', 'http://example.com/image2.png'],
          guildId: 'guild-123'
        }),
      } as any;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.results).toHaveLength(1);
      expect(analyzeClubScreenshots).toHaveBeenCalledWith(
        ['http://example.com/image1.png', 'http://example.com/image2.png'],
        undefined
      );
    });

    it('should pass custom options to analysis', async () => {
      const customOptions = {
        model: 'gpt-4-vision-preview',
        temperature: 0.5,
        maxTokens: 1000,
        customPrompt: 'Custom analysis prompt'
      };

      const mockRequest = {
        json: () => Promise.resolve({
          imageUrls: ['http://example.com/image.png'],
          guildId: 'guild-123',
          options: customOptions
        }),
      } as any;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(analyzeClubScreenshot).toHaveBeenCalledWith('http://example.com/image.png', customOptions);
    });

    it('should handle analysis errors gracefully', async () => {
      (analyzeClubScreenshot as any).mockRejectedValue(new Error('API Error'));

      const mockRequest = {
        json: () => Promise.resolve({
          imageUrls: ['http://example.com/image.png'],
          guildId: 'guild-123'
        }),
      } as any;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.code).toBe('INTERNAL_ERROR');
    });

    it('should return warnings for invalid URLs', async () => {
      (validateImageUrl as any)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      const mockRequest = {
        json: () => Promise.resolve({
          imageUrls: ['http://valid.com/image.png', 'http://invalid.com/image.png'],
          guildId: 'guild-123'
        }),
      } as any;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.summary.validImages).toBe(1);
      expect(data.summary.invalidImages).toBe(1);
      expect(data.warnings).toContain('1 image(s) could not be accessed');
    });
  });

  describe('GET /api/club/analyze', () => {
    it('should return 400 when no guildId provided', async () => {
      const mockRequest = {
        url: 'http://localhost:3000/api/club/analyze',
        nextUrl: new URL('http://localhost:3000/api/club/analyze'),
      } as any;

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(data.code).toBe('VALIDATION_ERROR');
      expect(data.message).toBe('Guild ID is required');
      expect(response.status).toBe(400);
    });

    it('should retrieve analyses successfully', async () => {
      const mockAnalyses = [
        {
          id: 'analysis-1',
          guildId: 'guild-123',
          userId: 'user-456',
          summary: 'Test analysis',
          confidence: 0.85,
          createdAt: '2025-11-27T11:49:24.032Z', // Response.json() serializes Dates to ISO strings
          metrics: [],
          images: []
        }
      ];

      (clubDatabase.getAnalysesByGuild as any).mockResolvedValue(mockAnalyses);

      const mockRequest = {
        url: 'http://localhost:3000/api/club/analyze?guildId=guild-123',
        nextUrl: new URL('http://localhost:3000/api/club/analyze?guildId=guild-123'),
      } as any;

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.results).toEqual(mockAnalyses);
      expect(clubDatabase.getAnalysesByGuild).toHaveBeenCalledWith('guild-123', 10, 0);
    });

    it('should handle pagination parameters', async () => {
      const mockRequest = {
        url: 'http://localhost:3000/api/club/analyze?guildId=guild-123&limit=20&offset=10',
        nextUrl: new URL('http://localhost:3000/api/club/analyze?guildId=guild-123&limit=20&offset=10'),
      } as any;

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(clubDatabase.getAnalysesByGuild).toHaveBeenCalledWith('guild-123', 20, 10);
    });
  });
});
