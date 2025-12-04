import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockAuthUser } from '../../utils/auth-mock';
import { requireAuth } from '@/lib/auth/server';

// Mock authentication
vi.mock('@/lib/auth/server', () => ({
  requireAuth: vi.fn().mockResolvedValue(mockAuthUser),
}));

// Mock the file system operations
vi.mock('fs/promises', () => {
  const mockFn = vi.fn().mockResolvedValue(undefined);
  return {
    writeFile: mockFn,
    mkdir: mockFn,
    readFile: mockFn,
    default: {
      writeFile: mockFn,
      mkdir: mockFn,
      readFile: mockFn,
    },
  };
});

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
  // Helper to create a mock File with arrayBuffer support
  const createMockFile = (content: string, name: string, type: string) => {
    const buffer = Buffer.from(content);
    const file = new File([buffer], name, { type });
    // Add arrayBuffer method that File doesn't have in test environment
    (file as any).arrayBuffer = async () => buffer.buffer;
    return file;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (requireAuth as any).mockResolvedValue(mockAuthUser);
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

    expect(data.code).toBe('VALIDATION_ERROR');
    expect(data.message).toBe('No screenshots provided');
    expect(response.status).toBe(400);
  });

  it('should return 400 when no guildId provided', async () => {
    const formData = new FormData();
    // Create a mock file
    const mockFile = createMockFile('test', 'test.png', 'image/png');
    formData.append('screenshots', mockFile);

    const mockRequest = {
      formData: () => Promise.resolve(formData),
      nextUrl: { origin: 'http://localhost:3000' },
    } as any;

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(data.code).toBe('VALIDATION_ERROR');
    expect(data.message).toBe('Guild ID is required');
    expect(response.status).toBe(400);
  });

  it('should successfully upload files without analysis', async () => {
    const formData = new FormData();
    formData.append('guildId', 'guild-123');
    formData.append('analyze', 'false');

    const mockFile = createMockFile('test', 'test.png', 'image/png');
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

    const mockFile = createMockFile('test', 'test.png', 'image/png');
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
    // Check that analyzeClubScreenshots was called with URLs containing guild-123 path
    const callArgs = (analyzeClubScreenshots as any).mock.calls[0];
    expect(callArgs[0]).toHaveLength(1);
    expect(callArgs[0][0]).toMatch(/uploads\/club\/guild-123/);
  });

  it('should handle file upload errors gracefully', async () => {
    const formData = new FormData();
    formData.append('guildId', 'guild-123');

    const mockFile = createMockFile('test', 'test.png', 'image/png');
    formData.append('screenshots', mockFile);

    (writeFile as any).mockRejectedValue(new Error('Disk full'));

    const mockRequest = {
      formData: () => Promise.resolve(formData),
      nextUrl: { origin: 'http://localhost:3000' },
    } as any;

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.code).toBe('INTERNAL_ERROR');
  });

  it('should continue upload even if analysis fails', async () => {
    const formData = new FormData();
    formData.append('guildId', 'guild-123');
    formData.append('analyze', 'true');

    const mockFile = createMockFile('test', 'test.png', 'image/png');
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
