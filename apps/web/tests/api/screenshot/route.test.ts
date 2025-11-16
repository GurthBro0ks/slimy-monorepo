import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies
vi.mock('fs/promises', () => ({
  writeFile: vi.fn(),
  mkdir: vi.fn(),
}));

vi.mock('@/lib/screenshot/analyzer', () => ({
  analyzeScreenshot: vi.fn(),
  analyzeScreenshots: vi.fn(),
  validateImageUrl: vi.fn(),
  isValidScreenshotType: vi.fn(),
}));

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

import { POST, GET } from '@/app/api/screenshot/route';
import { writeFile, mkdir } from 'fs/promises';
import { analyzeScreenshot, analyzeScreenshots, validateImageUrl, isValidScreenshotType } from '@/lib/screenshot/analyzer';

describe('/api/screenshot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (mkdir as any).mockResolvedValue(undefined);
    (writeFile as any).mockResolvedValue(undefined);
    (validateImageUrl as any).mockResolvedValue(true);
    (isValidScreenshotType as any).mockReturnValue(true);
    (analyzeScreenshot as any).mockResolvedValue({
      id: 'analysis-1',
      screenshotType: 'game-stats',
      timestamp: new Date(),
      imageUrl: 'http://localhost:3000/uploads/screenshots/user-123/test.png',
      analysis: {
        title: 'Test Analysis',
        description: 'Test description',
        summary: 'Test summary',
        data: { score: 100 },
        insights: ['Good performance'],
        recommendations: ['Keep it up'],
        tags: ['gaming']
      },
      metadata: {
        confidence: 0.9,
        processingTime: 1500,
        modelUsed: 'gpt-4-vision-preview'
      }
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('POST /api/screenshot', () => {
    it('should return 400 when no screenshots or URLs provided', async () => {
      const formData = new FormData();
      formData.append('userId', 'user-123');

      const mockRequest = {
        formData: () => Promise.resolve(formData),
        nextUrl: { origin: 'http://localhost:3000' },
      } as any;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(data.error).toBe('No screenshots or image URLs provided');
      expect(response.status).toBe(400);
    });

    it('should return 400 when no userId provided', async () => {
      const formData = new FormData();
      const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
      formData.append('screenshots', mockFile);

      const mockRequest = {
        formData: () => Promise.resolve(formData),
        nextUrl: { origin: 'http://localhost:3000' },
      } as any;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(data.error).toBe('User ID is required');
      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid screenshot type', async () => {
      (isValidScreenshotType as any).mockReturnValue(false);

      const formData = new FormData();
      formData.append('userId', 'user-123');
      formData.append('type', 'invalid-type');
      const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
      formData.append('screenshots', mockFile);

      const mockRequest = {
        formData: () => Promise.resolve(formData),
        nextUrl: { origin: 'http://localhost:3000' },
      } as any;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(data.error).toContain('Invalid screenshot type');
      expect(response.status).toBe(400);
    });

    it('should successfully upload and analyze screenshot', async () => {
      const formData = new FormData();
      formData.append('userId', 'user-123');
      formData.append('type', 'game-stats');
      formData.append('analyze', 'true');

      const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
      formData.append('screenshots', mockFile);

      const mockRequest = {
        formData: () => Promise.resolve(formData),
        nextUrl: { origin: 'http://localhost:3000' },
      } as any;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.uploaded).toBe(1);
      expect(data.analyzed).toBe(1);
      expect(data.results).toHaveLength(1);
      expect(data.summary.screenshotType).toBe('game-stats');
      expect(mkdir).toHaveBeenCalledWith(expect.stringContaining('user-123'), { recursive: true });
      expect(writeFile).toHaveBeenCalled();
      expect(analyzeScreenshot).toHaveBeenCalled();
    });

    it('should handle URL-based analysis', async () => {
      const formData = new FormData();
      formData.append('userId', 'user-123');
      formData.append('imageUrls', 'http://example.com/image.png');
      formData.append('analyze', 'true');

      const mockRequest = {
        formData: () => Promise.resolve(formData),
        nextUrl: { origin: 'http://localhost:3000' },
      } as any;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.uploaded).toBe(0);
      expect(data.processed).toBe(1);
      expect(analyzeScreenshot).toHaveBeenCalledWith('http://example.com/image.png', expect.any(Object));
    });

    it('should handle multiple files and URLs', async () => {
      const formData = new FormData();
      formData.append('userId', 'user-123');
      formData.append('imageUrls', 'http://example.com/image1.png');
      formData.append('imageUrls', 'http://example.com/image2.png');
      formData.append('analyze', 'true');

      const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
      formData.append('screenshots', mockFile);

      (analyzeScreenshots as any).mockResolvedValue([
        {
          id: 'analysis-1',
          screenshotType: 'game-stats',
          timestamp: new Date(),
          imageUrl: 'http://example.com/image1.png',
          analysis: { title: 'Analysis 1', description: '', summary: '', data: {}, insights: [], recommendations: [], tags: [] },
          metadata: { confidence: 0.8, processingTime: 1000, modelUsed: 'gpt-4-vision-preview' }
        },
        {
          id: 'analysis-2',
          screenshotType: 'game-stats',
          timestamp: new Date(),
          imageUrl: 'http://localhost:3000/uploads/screenshots/user-123/test.png',
          analysis: { title: 'Analysis 2', description: '', summary: '', data: {}, insights: [], recommendations: [], tags: [] },
          metadata: { confidence: 0.8, processingTime: 1000, modelUsed: 'gpt-4-vision-preview' }
        }
      ]);

      const mockRequest = {
        formData: () => Promise.resolve(formData),
        nextUrl: { origin: 'http://localhost:3000' },
      } as any;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.processed).toBe(3);
      expect(data.analyzed).toBe(2);
      expect(analyzeScreenshots).toHaveBeenCalledWith(
        expect.arrayContaining([
          'http://example.com/image1.png',
          'http://example.com/image2.png',
          'http://localhost:3000/uploads/screenshots/user-123/test.png'
        ]),
        expect.any(Object)
      );
    });

    it('should skip analysis when analyze=false', async () => {
      const formData = new FormData();
      formData.append('userId', 'user-123');
      formData.append('analyze', 'false');

      const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
      formData.append('screenshots', mockFile);

      const mockRequest = {
        formData: () => Promise.resolve(formData),
        nextUrl: { origin: 'http://localhost:3000' },
      } as any;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.analyzed).toBe(0);
      expect(data.analysisTriggered).toBe(false);
      expect(analyzeScreenshot).not.toHaveBeenCalled();
    });

    it('should handle invalid image URLs', async () => {
      (validateImageUrl as any)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      const formData = new FormData();
      formData.append('userId', 'user-123');
      formData.append('imageUrls', 'http://valid.com/image.png');
      formData.append('imageUrls', 'http://invalid.com/image.png');

      const mockRequest = {
        formData: () => Promise.resolve(formData),
        nextUrl: { origin: 'http://localhost:3000' },
      } as any;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.summary.validImages).toBe(1);
      expect(data.summary.invalidImages).toBe(1);
      expect(data.warnings).toContain('1 image(s) could not be accessed');
    });

    it('should handle custom analysis options', async () => {
      const formData = new FormData();
      formData.append('userId', 'user-123');
      formData.append('imageUrls', 'http://example.com/image.png');
      formData.append('analyze', 'true');
      formData.append('options', JSON.stringify({
        model: 'gpt-4-vision-preview',
        temperature: 0.5,
        extractText: true
      }));

      const mockRequest = {
        formData: () => Promise.resolve(formData),
        nextUrl: { origin: 'http://localhost:3000' },
      } as any;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(analyzeScreenshot).toHaveBeenCalledWith('http://example.com/image.png', {
        type: undefined,
        model: 'gpt-4-vision-preview',
        temperature: 0.5,
        extractText: true
      });
    });
  });

  describe('GET /api/screenshot', () => {
    it('should return 400 when no userId provided', async () => {
      const mockRequest = {
        url: 'http://localhost:3000/api/screenshot',
        nextUrl: new URL('http://localhost:3000/api/screenshot'),
      } as any;

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(data.error).toBe('User ID is required');
      expect(response.status).toBe(400);
    });

    it('should handle query parameters correctly', async () => {
      const mockRequest = {
        url: 'http://localhost:3000/api/screenshot?userId=user-123&type=game-stats&limit=10&offset=5&search=performance&tags=gaming,stats',
        nextUrl: new URL('http://localhost:3000/api/screenshot?userId=user-123&type=game-stats&limit=10&offset=5&search=performance&tags=gaming,stats'),
      } as any;

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(data.filters.userId).toBe('user-123');
      expect(data.filters.type).toBe('game-stats');
      expect(data.filters.limit).toBe(10);
      expect(data.filters.offset).toBe(5);
      expect(data.filters.search).toBe('performance');
      expect(data.filters.tags).toEqual(['gaming', 'stats']);
    });
  });
});
