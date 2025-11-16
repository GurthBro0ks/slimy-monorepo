import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the file system operations
vi.mock('fs/promises', () => ({
  writeFile: vi.fn(),
  mkdir: vi.fn(),
}));

// Mock the vision analysis
vi.mock('@/lib/club/vision', () => ({
  analyzeClubScreenshots: vi.fn(),
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

import { POST } from '@/app/api/club/upload/route';
import { writeFile, mkdir } from 'fs/promises';
import { analyzeClubScreenshots } from '@/lib/club/vision';

describe('/api/club/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (mkdir as any).mockResolvedValue(undefined);
    (writeFile as any).mockResolvedValue(undefined);
    (analyzeClubScreenshots as any).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should return 400 when no screenshots provided', async () => {
    const formData = new FormData();
    formData.append('guildId', 'guild-123');

    const mockRequest = {
      formData: () => Promise.resolve(formData),
    } as any;

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(data.error).toBe('No screenshots provided');
    expect(response.status).toBe(400);
  });

  it('should return 400 when no guildId provided', async () => {
    const formData = new FormData();
    // Create a mock file
    const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
    formData.append('screenshots', mockFile);

    const mockRequest = {
      formData: () => Promise.resolve(formData),
      nextUrl: { origin: 'http://localhost:3000' },
    } as any;

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(data.error).toBe('Guild ID is required');
    expect(response.status).toBe(400);
  });

  it('should successfully upload files without analysis', async () => {
    const formData = new FormData();
    formData.append('guildId', 'guild-123');
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
    expect(data.uploaded).toBe(1);
    expect(data.files).toHaveLength(1);
    expect(data.analysisTriggered).toBe(false);
    expect(mkdir).toHaveBeenCalledWith(expect.stringContaining('guild-123'), { recursive: true });
    expect(writeFile).toHaveBeenCalled();
  });

  it('should trigger analysis when analyze=true', async () => {
    const formData = new FormData();
    formData.append('guildId', 'guild-123');
    formData.append('analyze', 'true');

    const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
    formData.append('screenshots', mockFile);

    const mockAnalysisResult = [{
      id: 'analysis-1',
      timestamp: new Date(),
      imageUrl: 'http://localhost:3000/uploads/club/guild-123/test.png',
      analysis: {
        summary: 'Test analysis',
        metrics: { totalMembers: 25 },
        insights: ['Good performance'],
        recommendations: ['Keep it up']
      },
      confidence: 0.85
    }];

    (analyzeClubScreenshots as any).mockResolvedValue(mockAnalysisResult);

    const mockRequest = {
      formData: () => Promise.resolve(formData),
      nextUrl: { origin: 'http://localhost:3000' },
    } as any;

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.analysisTriggered).toBe(true);
    expect(data.analysisResults).toEqual(mockAnalysisResult);
    expect(analyzeClubScreenshots).toHaveBeenCalledWith(
      ['http://localhost:3000/uploads/club/guild-123/test.png'],
      undefined
    );
  });

  it('should handle file upload errors gracefully', async () => {
    const formData = new FormData();
    formData.append('guildId', 'guild-123');

    const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
    formData.append('screenshots', mockFile);

    (writeFile as any).mockRejectedValue(new Error('Disk full'));

    const mockRequest = {
      formData: () => Promise.resolve(formData),
      nextUrl: { origin: 'http://localhost:3000' },
    } as any;

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(data.error).toBe('Failed to upload screenshots');
    expect(response.status).toBe(500);
  });

  it('should continue upload even if analysis fails', async () => {
    const formData = new FormData();
    formData.append('guildId', 'guild-123');
    formData.append('analyze', 'true');

    const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
    formData.append('screenshots', mockFile);

    (analyzeClubScreenshots as any).mockRejectedValue(new Error('Analysis failed'));

    const mockRequest = {
      formData: () => Promise.resolve(formData),
      nextUrl: { origin: 'http://localhost:3000' },
    } as any;

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.uploaded).toBe(1);
    expect(data.analysisTriggered).toBe(true);
    expect(data.analysisResults).toEqual([]); // Empty array when analysis fails
  });
});
