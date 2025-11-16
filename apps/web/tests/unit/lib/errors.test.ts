/**
 * Tests for error handling
 */

import { describe, it, expect } from 'vitest';
import {
  AppError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  ExternalServiceError,
  DatabaseError,
  ConfigurationError,
  isAppError,
  toAppError,
  ErrorCode,
  createError,
} from '@/lib/errors';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create error with correct properties', () => {
      const error = new AppError('Test error', 'TEST_CODE', 500, { detail: 'test' });

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.statusCode).toBe(500);
      expect(error.details).toEqual({ detail: 'test' });
      expect(error.name).toBe('AppError');
    });

    it('should serialize to JSON correctly', () => {
      const error = new AppError('Test error', 'TEST_CODE', 400);
      const json = error.toJSON();

      expect(json).toEqual({
        ok: false,
        code: 'TEST_CODE',
        message: 'Test error',
        status: 400,
        details: undefined,
      });
    });
  });

  describe('AuthenticationError', () => {
    it('should create 401 error', () => {
      const error = new AuthenticationError();

      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.message).toBe('Authentication required');
    });
  });

  describe('AuthorizationError', () => {
    it('should create 403 error', () => {
      const error = new AuthorizationError();

      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
      expect(error.message).toBe('Insufficient permissions');
    });
  });

  describe('NotFoundError', () => {
    it('should create 404 error with resource name', () => {
      const error = new NotFoundError('User');

      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toBe('User not found');
    });
  });

  describe('ValidationError', () => {
    it('should create 400 error', () => {
      const error = new ValidationError('Invalid input', { field: 'email' });

      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toEqual({ field: 'email' });
    });
  });

  describe('RateLimitError', () => {
    it('should create 429 error with retry after', () => {
      const error = new RateLimitError('Too many requests', 60);

      expect(error.statusCode).toBe(429);
      expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(error.retryAfter).toBe(60);
    });

    it('should include retryAfter in JSON', () => {
      const error = new RateLimitError('Too many requests', 30);
      const json = error.toJSON();

      expect(json.retryAfter).toBe(30);
    });
  });

  describe('ExternalServiceError', () => {
    it('should create 502 error with service name', () => {
      const error = new ExternalServiceError('OpenAI', 'Service timeout');

      expect(error.statusCode).toBe(502);
      expect(error.code).toBe('EXTERNAL_SERVICE_ERROR');
      expect(error.message).toContain('OpenAI');
      expect(error.message).toContain('Service timeout');
    });
  });

  describe('DatabaseError', () => {
    it('should create 500 error', () => {
      const error = new DatabaseError('Connection failed');

      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('DATABASE_ERROR');
    });
  });

  describe('ConfigurationError', () => {
    it('should create 500 error', () => {
      const error = new ConfigurationError('Missing API key');

      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('CONFIGURATION_ERROR');
    });
  });
});

describe('Error Utilities', () => {
  describe('isAppError', () => {
    it('should return true for AppError instances', () => {
      const error = new AppError('Test', 'TEST', 500);
      expect(isAppError(error)).toBe(true);
    });

    it('should return false for standard errors', () => {
      const error = new Error('Test');
      expect(isAppError(error)).toBe(false);
    });

    it('should return false for non-error values', () => {
      expect(isAppError('error')).toBe(false);
      expect(isAppError(null)).toBe(false);
      expect(isAppError(undefined)).toBe(false);
    });
  });

  describe('toAppError', () => {
    it('should return AppError as-is', () => {
      const error = new AppError('Test', 'TEST', 400);
      const result = toAppError(error);

      expect(result).toBe(error);
    });

    it('should convert Error to AppError', () => {
      const error = new Error('Standard error');
      const result = toAppError(error);

      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('Standard error');
      expect(result.code).toBe('INTERNAL_ERROR');
      expect(result.statusCode).toBe(500);
    });

    it('should convert unknown values to AppError', () => {
      const result = toAppError('Something went wrong');

      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('An unknown error occurred');
      expect(result.code).toBe('UNKNOWN_ERROR');
    });
  });

  describe('createError', () => {
    it('should create error with specific code', () => {
      const error = createError(
        ErrorCode.VALIDATION_ERROR,
        'Invalid email',
        400,
        { field: 'email' }
      );

      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.message).toBe('Invalid email');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ field: 'email' });
    });
  });
});
