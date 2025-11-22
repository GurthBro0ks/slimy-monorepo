/**
 * Tests for the error handler utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { safeHandler, safeSyncHandler } from '../src/lib/errorHandler';

describe('Error Handler', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('safeHandler', () => {
    it('should execute handler successfully when no error occurs', async () => {
      const handler = vi.fn().mockResolvedValue('success');
      const wrapped = safeHandler(handler, 'test-handler');

      const result = await wrapped('arg1', 'arg2');

      expect(result).toBe('success');
      expect(handler).toHaveBeenCalledWith('arg1', 'arg2');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should catch and log errors without crashing', async () => {
      const error = new Error('Test error');
      const handler = vi.fn().mockRejectedValue(error);
      const wrapped = safeHandler(handler, 'test-handler');

      const result = await wrapped();

      expect(result).toBeUndefined();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Unhandled error in test-handler/)
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Test error')
      );
    });

    it('should extract guild and user context from interaction-like objects', async () => {
      const error = new Error('Test error');
      const handler = vi.fn().mockRejectedValue(error);
      const wrapped = safeHandler(handler, 'interaction-handler');

      const mockInteraction = {
        guildId: 'guild-123',
        user: { id: 'user-456' },
        channelId: 'channel-789',
      };

      await wrapped(mockInteraction);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/guildId=guild-123/)
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/userId=user-456/)
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/channelId=channel-789/)
      );
    });

    it('should extract context from message-like objects', async () => {
      const error = new Error('Test error');
      const handler = vi.fn().mockRejectedValue(error);
      const wrapped = safeHandler(handler, 'message-handler');

      const mockMessage = {
        guild: { id: 'guild-123' },
        author: { id: 'user-456' },
        channel: { id: 'channel-789' },
      };

      await wrapped(mockMessage);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/guildId=guild-123/)
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/userId=user-456/)
      );
    });

    it('should handle DM context (no guild)', async () => {
      const error = new Error('Test error');
      const handler = vi.fn().mockRejectedValue(error);
      const wrapped = safeHandler(handler, 'dm-handler');

      const mockInteraction = {
        guildId: null,
        user: { id: 'user-456' },
        channelId: 'channel-789',
      };

      await wrapped(mockInteraction);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/guildId=DM/)
      );
    });

    it('should handle non-Error thrown values', async () => {
      const handler = vi.fn().mockRejectedValue('string error');
      const wrapped = safeHandler(handler, 'test-handler');

      await wrapped();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Unhandled error in test-handler/)
      );
    });
  });

  describe('safeSyncHandler', () => {
    it('should execute sync handler successfully when no error occurs', () => {
      const handler = vi.fn().mockReturnValue('success');
      const wrapped = safeSyncHandler(handler, 'sync-handler');

      const result = wrapped('arg1', 'arg2');

      expect(result).toBe('success');
      expect(handler).toHaveBeenCalledWith('arg1', 'arg2');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should catch and log sync errors without crashing', () => {
      const error = new Error('Sync error');
      const handler = vi.fn().mockImplementation(() => {
        throw error;
      });
      const wrapped = safeSyncHandler(handler, 'sync-handler');

      const result = wrapped();

      expect(result).toBeUndefined();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Unhandled error in sync-handler/)
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Sync error')
      );
    });

    it('should handle non-Error thrown values', () => {
      const handler = vi.fn().mockImplementation(() => {
        throw 'string error';
      });
      const wrapped = safeSyncHandler(handler, 'sync-handler');

      wrapped();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Unhandled error in sync-handler/)
      );
    });
  });
});
