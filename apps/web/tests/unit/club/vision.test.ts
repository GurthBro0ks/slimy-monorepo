import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the OpenAI client
vi.mock('@/lib/openai-client', () => ({
  getOpenAIClient: vi.fn(() => ({
    chat: {
      completions: {
        create: vi.fn()
      }
    }
  }))
}));

import {
  analyzeClubScreenshot,
  analyzeClubScreenshots,
  validateImageUrl,
  generateAnalysisId,
  calculateConfidence
} from '@/lib/club/vision';
import { getOpenAIClient } from '@/lib/openai-client';

describe('Club Vision Library', () => {
  const mockOpenAI = {
    chat: {
      completions: {
        create: vi.fn()
      }
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (getOpenAIClient as any).mockReturnValue(mockOpenAI);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('analyzeClubScreenshot', () => {
    it('should analyze a single screenshot successfully', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              summary: 'Club performance analysis',
              metrics: {
                totalMembers: 25,
                activeMembers: 20,
                performanceScore: 8.5
              },
              insights: ['High member engagement', 'Good performance trends'],
              recommendations: ['Continue current strategies', 'Focus on member retention']
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await analyzeClubScreenshot('http://example.com/image.png');

      expect(result).toBeDefined();
      expect(result.imageUrl).toBe('http://example.com/image.png');
      expect(result.analysis.summary).toBe('Club performance analysis');
      expect(result.analysis.metrics.totalMembers).toBe(25);
      expect(result.analysis.insights).toHaveLength(2);
      expect(result.analysis.recommendations).toHaveLength(2);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.id).toMatch(/^analysis_\d+_[a-z0-9]+$/);
    });

    it('should use custom options when provided', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              summary: 'Custom analysis',
              metrics: {},
              insights: [],
              recommendations: []
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const customOptions = {
        model: 'gpt-4-vision-preview',
        temperature: 0.5,
        maxTokens: 1000,
        customPrompt: 'Custom analysis prompt'
      };

      await analyzeClubScreenshot('http://example.com/image.png', customOptions);

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4-vision-preview',
        messages: expect.any(Array),
        temperature: 0.5,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      });
    });

    it('should handle API errors gracefully', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('API Error'));

      await expect(analyzeClubScreenshot('http://example.com/image.png'))
        .rejects
        .toThrow('Failed to analyze screenshot: API Error');
    });

    it('should handle invalid JSON response', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'Invalid JSON response'
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      await expect(analyzeClubScreenshot('http://example.com/image.png'))
        .rejects
        .toThrow();
    });

    it('should handle empty response', async () => {
      const mockResponse = {
        choices: [{
          message: {}
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      await expect(analyzeClubScreenshot('http://example.com/image.png'))
        .rejects
        .toThrow('No response content from GPT-4 Vision');
    });
  });

  describe('analyzeClubScreenshots', () => {
    it('should analyze multiple screenshots', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              summary: 'Batch analysis',
              metrics: { totalMembers: 30 },
              insights: ['Batch insights'],
              recommendations: ['Batch recommendations']
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create
        .mockResolvedValueOnce(mockResponse)
        .mockResolvedValueOnce(mockResponse);

      const imageUrls = ['http://example.com/image1.png', 'http://example.com/image2.png'];
      const results = await analyzeClubScreenshots(imageUrls);

      expect(results).toHaveLength(2);
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(2);
    });

    it('should handle partial failures gracefully', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              summary: 'Success analysis',
              metrics: {},
              insights: [],
              recommendations: []
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create
        .mockResolvedValueOnce(mockResponse)
        .mockRejectedValueOnce(new Error('API Error'));

      const imageUrls = ['http://example.com/image1.png', 'http://example.com/image2.png'];
      const results = await analyzeClubScreenshots(imageUrls);

      expect(results).toHaveLength(1); // Only successful analysis returned
    });
  });

  describe('validateImageUrl', () => {
    it('should return true for valid URLs', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true
        } as Response)
      );

      const result = await validateImageUrl('http://example.com/image.png');
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('http://example.com/image.png', { method: 'HEAD' });
    });

    it('should return false for invalid URLs', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false
        } as Response)
      );

      const result = await validateImageUrl('http://example.com/invalid.png');
      expect(result).toBe(false);
    });

    it('should return false when fetch fails', async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

      const result = await validateImageUrl('http://example.com/image.png');
      expect(result).toBe(false);
    });
  });

  describe('generateAnalysisId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateAnalysisId();
      const id2 = generateAnalysisId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^analysis_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^analysis_\d+_[a-z0-9]+$/);
    });
  });

  describe('calculateConfidence', () => {
    it('should calculate confidence based on analysis completeness', () => {
      // Complete analysis
      const completeAnalysis = {
        summary: 'Complete summary',
        metrics: { score: 10 },
        insights: ['Insight 1', 'Insight 2'],
        recommendations: ['Recommendation 1']
      };

      const confidence = calculateConfidence(completeAnalysis);
      expect(confidence).toBe(1.0); // All 4 components present

      // Partial analysis
      const partialAnalysis = {
        summary: 'Summary only',
        metrics: {},
        insights: [],
        recommendations: []
      };

      const partialConfidence = calculateConfidence(partialAnalysis);
      expect(partialConfidence).toBe(0.25); // Only 1 component present

      // Empty analysis
      const emptyAnalysis = {};
      const emptyConfidence = calculateConfidence(emptyAnalysis);
      expect(emptyConfidence).toBe(0); // No components present
    });
  });

  describe('Message structure', () => {
    it('should send correct message structure to OpenAI', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              summary: 'Test',
              metrics: {},
              insights: [],
              recommendations: []
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      await analyzeClubScreenshot('http://example.com/image.png');

      const callArgs = mockOpenAI.chat.completions.create.mock.calls[0][0];
      expect(callArgs.messages).toHaveLength(1);
      expect(callArgs.messages[0].content).toHaveLength(2); // Text and image

      // Check text content
      expect(callArgs.messages[0].content[0].type).toBe('text');
      expect(callArgs.messages[0].content[0].text).toContain('Analyze this club/gaming screenshot');

      // Check image content
      expect(callArgs.messages[0].content[1].type).toBe('image_url');
      expect(callArgs.messages[0].content[1].image_url.url).toBe('http://example.com/image.png');
      expect(callArgs.messages[0].content[1].image_url.detail).toBe('high');
    });
  });
});
