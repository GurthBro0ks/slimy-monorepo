/**
 * Tests for club-analyze-context.ts — context menu command
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database module before importing the command
vi.mock('../src/lib/database', () => ({
  database: {
    isConfigured: () => true,
    initialize: vi.fn(),
    close: vi.fn(),
  },
}));

// Mock the metrics module
vi.mock('../src/lib/metrics', () => ({
  trackCommand: vi.fn(),
}));

// Mock the club-analyze-flow module
vi.mock('../src/services/club-analyze-flow', () => ({
  sessions: new Map(),
  cleanExpiredSessions: vi.fn(),
  ensureDatabase: vi.fn(),
  runAnalysis: vi.fn(),
  buildPreviewEmbed: vi.fn(() => ({
    setTitle: vi.fn().mockReturnThis(),
    setColor: vi.fn().mockReturnThis(),
    setDescription: vi.fn().mockReturnThis(),
    addFields: vi.fn().mockReturnThis(),
  })),
  buildPreviewComponents: vi.fn(() => []),
  handleButton: vi.fn(),
  BUTTON_PREFIX: 'club-analyze',
}));

describe('club-analyze-context', () => {
  let mockInteraction: any;
  let mockMessage: any;

  const createMockMessage = (attachments: { contentType: string; url: string; name: string }[]) => ({
    attachments: {
      values: () => attachments,
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();

    mockMessage = {
      attachments: {
        values: () => [],
      },
    };

    mockInteraction = {
      targetId: '123456',
      guildId: '987654',
      channelId: '111222',
      user: { id: 'user123' },
      member: null,
      deferReply: vi.fn().mockResolvedValue(undefined),
      editReply: vi.fn().mockResolvedValue(undefined),
      reply: vi.fn().mockResolvedValue(undefined),
      channel: { id: '111222', sendTyping: vi.fn().mockResolvedValue(undefined) },
      getMessage: vi.fn().mockResolvedValue(mockMessage),
    };
  });

  describe('execute', () => {
    it('should reply with error when no image attachments found', async () => {
      const { execute } = await import('../src/commands/club-analyze-context');

      mockMessage = createMockMessage([]);
      mockInteraction.getMessage = vi.fn().mockResolvedValue(mockMessage);

      await execute(mockInteraction);

      expect(mockInteraction.editReply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('No image attachments found'),
        })
      );
    });

    it('should proceed when exactly 1 image attachment', async () => {
      const { execute } = await import('../src/commands/club-analyze-context');

      mockMessage = createMockMessage([
        { contentType: 'image/png', url: 'https://example.com/img.png', name: 'img.png' },
      ]);
      mockInteraction.getMessage = vi.fn().mockResolvedValue(mockMessage);

      await execute(mockInteraction);

      expect(mockInteraction.editReply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('Found **1** screenshot'),
        })
      );
    });

    it('should proceed when exactly 10 image attachments', async () => {
      const { execute } = await import('../src/commands/club-analyze-context');

      const attachments = Array.from({ length: 10 }, (_, i) => ({
        contentType: 'image/png',
        url: `https://example.com/img${i}.png`,
        name: `img${i}.png`,
      }));
      mockMessage = createMockMessage(attachments);
      mockInteraction.getMessage = vi.fn().mockResolvedValue(mockMessage);

      await execute(mockInteraction);

      expect(mockInteraction.editReply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('Found **10** screenshots'),
        })
      );
    });

    it('should reply with error when more than 10 image attachments', async () => {
      const { execute } = await import('../src/commands/club-analyze-context');

      const attachments = Array.from({ length: 11 }, (_, i) => ({
        contentType: 'image/png',
        url: `https://example.com/img${i}.png`,
        name: `img${i}.png`,
      }));
      mockMessage = createMockMessage(attachments);
      mockInteraction.getMessage = vi.fn().mockResolvedValue(mockMessage);

      await execute(mockInteraction);

      expect(mockInteraction.editReply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('Too many attachments'),
        })
      );
    });

    it('should ignore PDF attachments and only count images', async () => {
      const { execute } = await import('../src/commands/club-analyze-context');

      mockMessage = createMockMessage([
        { contentType: 'application/pdf', url: 'https://example.com/doc.pdf', name: 'doc.pdf' },
        { contentType: 'image/png', url: 'https://example.com/img.png', name: 'img.png' },
        { contentType: 'video/mp4', url: 'https://example.com/vid.mp4', name: 'vid.mp4' },
      ]);
      mockInteraction.getMessage = vi.fn().mockResolvedValue(mockMessage);

      await execute(mockInteraction);

      // Should count only the 1 image, not the PDF or video
      expect(mockInteraction.editReply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('Found **1** screenshot'),
        })
      );
    });

    it('should include Sim Power and Total Power buttons', async () => {
      const { execute } = await import('../src/commands/club-analyze-context');

      mockMessage = createMockMessage([
        { contentType: 'image/png', url: 'https://example.com/img.png', name: 'img.png' },
      ]);
      mockInteraction.getMessage = vi.fn().mockResolvedValue(mockMessage);

      await execute(mockInteraction);

      const editReplyCall = mockInteraction.editReply.mock.calls[0][0];
      expect(editReplyCall.components).toBeDefined();
      expect(editReplyCall.components.length).toBe(1);
    });
  });

  describe('handleButton', () => {
    it('should return false for unknown button namespace', async () => {
      const { handleButton } = await import('../src/commands/club-analyze-context');

      const result = await handleButton({
        customId: 'unknown:action:sessionId',
        deferUpdate: vi.fn(),
        reply: vi.fn(),
        editReply: vi.fn(),
      });

      expect(result).toBe(false);
    });

    it('should return false for club-analyze without action', async () => {
      const { handleButton } = await import('../src/commands/club-analyze-context');

      const result = await handleButton({
        customId: 'club-analyze',
        deferUpdate: vi.fn(),
        reply: vi.fn(),
        editReply: vi.fn(),
      });

      expect(result).toBe(false);
    });

    it('should delegate approve to flow handleButton', async () => {
      const flowModule = await import('../src/services/club-analyze-flow');
      const { handleButton } = await import('../src/commands/club-analyze-context');

      await handleButton({
        customId: 'club-analyze:approve:session123',
        deferUpdate: vi.fn(),
        reply: vi.fn(),
        editReply: vi.fn(),
      });

      expect(flowModule.handleButton).toHaveBeenCalled();
    });

    it('should delegate cancel to flow handleButton', async () => {
      const flowModule = await import('../src/services/club-analyze-flow');
      const { handleButton } = await import('../src/commands/club-analyze-context');

      await handleButton({
        customId: 'club-analyze:cancel:session123',
        deferUpdate: vi.fn(),
        reply: vi.fn(),
        editReply: vi.fn(),
      });

      expect(flowModule.handleButton).toHaveBeenCalled();
    });
  });
});
