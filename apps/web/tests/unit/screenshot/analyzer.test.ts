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
  analyzeScreenshot,
  analyzeScreenshots,
  compareScreenshotAnalyses,
  generateScreenshotId,
  calculateConfidence,
  getSupportedScreenshotTypes,
  isValidScreenshotType
} from '@/lib/screenshot/analyzer';
import { getOpenAIClient } from '@/lib/openai-client';

describe('Screenshot Analyzer', () => {
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

  describe('analyzeScreenshot', () => {
    it('should analyze a screenshot successfully', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              title: 'Game Stats Analysis',
              description: 'Player statistics from a gaming session',
              summary: 'Strong performance with high scores',
              data: {
                level: 25,
                score: 15420,
                accuracy: 87.5
              },
              insights: ['Excellent accuracy rating', 'High level achievement'],
              recommendations: ['Continue current strategy', 'Focus on score improvement'],
              tags: ['gaming', 'performance', 'stats']
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await analyzeScreenshot('http://example.com/screenshot.png', {
        type: 'game-stats'
      });

      expect(result).toBeDefined();
      expect(result.screenshotType).toBe('game-stats');
      expect(result.imageUrl).toBe('http://example.com/screenshot.png');
      expect(result.analysis.title).toBe('Game Stats Analysis');
      expect(result.analysis.data.level).toBe(25);
      expect(result.analysis.insights).toHaveLength(2);
      expect(result.metadata.confidence).toBeGreaterThan(0);
      expect(result.id).toMatch(/^screenshot_\d+_[a-z0-9]+$/);
    });

    it('should use default template for unknown types', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              title: 'Custom Screenshot',
              description: 'General screenshot analysis',
              summary: 'Analysis completed',
              data: {},
              insights: [],
              recommendations: [],
              tags: ['custom']
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await analyzeScreenshot('http://example.com/screenshot.png', {
        type: 'unknown-type' as any
      });

      expect(result.screenshotType).toBe('unknown-type');
    });

    it('should handle custom prompts', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              title: 'Custom Analysis',
              description: 'Custom analysis result',
              summary: 'Custom summary',
              data: { customField: 'value' },
              insights: ['Custom insight'],
              recommendations: ['Custom recommendation'],
              tags: ['custom']
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await analyzeScreenshot('http://example.com/screenshot.png', {
        customPrompt: 'Analyze this custom screenshot for specific requirements...'
      });

      expect(result.analysis.title).toBe('Custom Analysis');
    });

    it('should handle API errors gracefully', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('API Error'));

      await expect(analyzeScreenshot('http://example.com/screenshot.png'))
        .rejects
        .toThrow('Failed to analyze screenshot: API Error');
    });
  });

  describe('analyzeScreenshots', () => {
    it('should analyze multiple screenshots', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              title: 'Batch Analysis',
              description: 'Multiple screenshot analysis',
              summary: 'Batch processing completed',
              data: { batchId: 'test' },
              insights: ['Batch insight'],
              recommendations: ['Batch recommendation'],
              tags: ['batch']
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create
        .mockResolvedValueOnce(mockResponse)
        .mockResolvedValueOnce(mockResponse);

      const imageUrls = ['http://example.com/image1.png', 'http://example.com/image2.png'];
      const results = await analyzeScreenshots(imageUrls);

      expect(results).toHaveLength(2);
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(2);
    });

    it('should handle partial failures', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              title: 'Success',
              description: 'Successful analysis',
              summary: 'Success',
              data: {},
              insights: [],
              recommendations: [],
              tags: []
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create
        .mockResolvedValueOnce(mockResponse)
        .mockRejectedValueOnce(new Error('API Error'));

      const imageUrls = ['http://example.com/image1.png', 'http://example.com/image2.png'];
      const results = await analyzeScreenshots(imageUrls);

      expect(results).toHaveLength(1); // Only successful analysis returned
    });
  });

  describe('compareScreenshotAnalyses', () => {
    it('should compare two analyses and detect improvements', () => {
      const analysis1: any = {
        analysis: {
          data: {
            level: 20,
            score: 12000,
            accuracy: 80.0
          }
        }
      };

      const analysis2: any = {
        analysis: {
          data: {
            level: 25,
            score: 15420,
            accuracy: 87.5
          }
        }
      };

      const comparison = compareScreenshotAnalyses(analysis1, analysis2);

      expect(comparison.trend).toBe('improving');
      expect(comparison.differences.level.change).toBe('+5 (+25.0%)');
      expect(comparison.differences.score.change).toBe('+3420 (+28.5%)');
      expect(comparison.insights).toContain('Overall positive trend detected with more improvements than declines');
    });

    it('should detect declining trends', () => {
      const analysis1: any = {
        analysis: {
          data: {
            performance: 90,
            efficiency: 85
          }
        }
      };

      const analysis2: any = {
        analysis: {
          data: {
            performance: 75,
            efficiency: 70
          }
        }
      };

      const comparison = compareScreenshotAnalyses(analysis1, analysis2);

      expect(comparison.trend).toBe('declining');
    });

    it('should handle stable metrics', () => {
      const analysis1: any = {
        analysis: {
          data: {
            value: 100
          }
        }
      };

      const analysis2: any = {
        analysis: {
          data: {
            value: 100.05 // Change of 0.05, which is < 0.1 threshold
          }
        }
      };

      const comparison = compareScreenshotAnalyses(analysis1, analysis2);

      expect(comparison.trend).toBe('stable');
    });
  });

  describe('generateScreenshotId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateScreenshotId();
      const id2 = generateScreenshotId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^screenshot_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^screenshot_\d+_[a-z0-9]+$/);
    });
  });

  describe('calculateConfidence', () => {
    it('should calculate confidence based on completeness', () => {
      const completeAnalysis = {
        title: 'Complete',
        description: 'Full description',
        summary: 'Complete summary',
        data: { key: 'value' },
        insights: ['Insight'],
        recommendations: ['Recommendation'],
        tags: ['tag']
      };

      const confidence = calculateConfidence(completeAnalysis);
      expect(confidence).toBe(1.0);

      const partialAnalysis = {
        title: 'Partial',
        data: { key: 'value' } // Add data to make it count
      };

      const partialConfidence = calculateConfidence(partialAnalysis);
      expect(partialConfidence).toBeCloseTo(0.2857, 3); // title (✓) + data (✓) = 2/7
    });
  });

  describe('getSupportedScreenshotTypes', () => {
    it('should return all supported types', () => {
      const types = getSupportedScreenshotTypes();

      expect(types).toContain('game-stats');
      expect(types).toContain('leaderboard');
      expect(types).toContain('profile');
      expect(types).toContain('achievement');
      expect(types).toContain('inventory');
      expect(types).toContain('clan-guild');
      expect(types).toContain('performance');
      expect(types).toContain('social');
      expect(types).toContain('custom');
    });
  });

  describe('isValidScreenshotType', () => {
    it('should validate screenshot types', () => {
      expect(isValidScreenshotType('game-stats')).toBe(true);
      expect(isValidScreenshotType('invalid-type')).toBe(false);
    });
  });
});
