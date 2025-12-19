/**
 * Tests for the logger utility
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logInfo, logWarn, logError, logDebug, createLogger } from '../src/lib/logger.js';

describe('Logger', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleDebugSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('logInfo', () => {
    it('should log info messages with timestamp and level', () => {
      logInfo('Test message');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[.*\] \[INFO\] Test message/)
      );
    });

    it('should include context in log output', () => {
      logInfo('Test message', { context: 'test-context', guildId: '123' });
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Test message \{context=test-context guildId=123\}/)
      );
    });

    it('should filter out undefined context values', () => {
      logInfo('Test message', { context: 'test', userId: undefined });
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Test message \{context=test\}/)
      );
    });
  });

  describe('logWarn', () => {
    it('should log warning messages', () => {
      logWarn('Warning message');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[.*\] \[WARN\] Warning message/)
      );
    });

    it('should include context in warnings', () => {
      logWarn('Warning message', { context: 'warning-context' });
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Warning message \{context=warning-context\}/)
      );
    });
  });

  describe('logError', () => {
    it('should log error messages', () => {
      logError('Error message');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[.*\] \[ERROR\] Error message/)
      );
    });

    it('should include error details in context', () => {
      const error = new Error('Test error');
      logError('Error occurred', error);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Error occurred \{error=Test error/)
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Test error'));
    });

    it('should log stack trace separately', () => {
      const error = new Error('Test error');
      logError('Error occurred', error);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('logDebug', () => {
    it('should log debug messages in non-production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      logDebug('Debug message');
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[.*\] \[DEBUG\] Debug message/)
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should not log debug messages in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      logDebug('Debug message');
      expect(consoleDebugSpy).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('createLogger', () => {
    it('should create a logger with default context', () => {
      const logger = createLogger({ context: 'test-logger', guildId: '456' });
      logger.info('Test message');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Test message \{context=test-logger guildId=456\}/)
      );
    });

    it('should merge additional context with default context', () => {
      const logger = createLogger({ context: 'test-logger' });
      logger.info('Test message', { userId: '789' });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Test message \{context=test-logger userId=789\}/)
      );
    });

    it('should allow overriding default context', () => {
      const logger = createLogger({ context: 'default' });
      logger.info('Test message', { context: 'override' });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Test message \{context=override\}/)
      );
    });
  });
});
