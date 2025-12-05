import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  validateEmail,
  validatePassword,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  sanitizeInput,
  generateToken,
  parseJWTPayload,
  isTokenExpired,
} from './index';

describe('validateEmail', () => {
  it('should return true for valid email addresses', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('test.user@domain.co.uk')).toBe(true);
    expect(validateEmail('user+tag@example.com')).toBe(true);
    expect(validateEmail('user_name@example-domain.com')).toBe(true);
  });

  it('should return false for invalid email addresses', () => {
    expect(validateEmail('invalid')).toBe(false);
    expect(validateEmail('invalid@')).toBe(false);
    expect(validateEmail('@example.com')).toBe(false);
    expect(validateEmail('user@.com')).toBe(false);
    expect(validateEmail('user @example.com')).toBe(false);
    expect(validateEmail('user@example')).toBe(false);
  });

  it('should handle edge cases', () => {
    expect(validateEmail('')).toBe(false);
    expect(validateEmail('   ')).toBe(false);
    expect(validateEmail(null as any)).toBe(false);
    expect(validateEmail(undefined as any)).toBe(false);
    expect(validateEmail(123 as any)).toBe(false);
  });

  it('should trim whitespace before validation', () => {
    expect(validateEmail('  user@example.com  ')).toBe(true);
  });
});

describe('validatePassword', () => {
  it('should return true for valid passwords', () => {
    expect(validatePassword('Password123')).toBe(true);
    expect(validatePassword('Secure1Pass')).toBe(true);
    expect(validatePassword('MyP@ssw0rd')).toBe(true);
    expect(validatePassword('Abcdefgh1')).toBe(true);
  });

  it('should return false for passwords without uppercase letters', () => {
    expect(validatePassword('password123')).toBe(false);
    expect(validatePassword('lowercase1')).toBe(false);
  });

  it('should return false for passwords without lowercase letters', () => {
    expect(validatePassword('PASSWORD123')).toBe(false);
    expect(validatePassword('UPPERCASE1')).toBe(false);
  });

  it('should return false for passwords without numbers', () => {
    expect(validatePassword('PasswordOnly')).toBe(false);
    expect(validatePassword('NoNumbers')).toBe(false);
  });

  it('should return false for passwords shorter than 8 characters', () => {
    expect(validatePassword('Pass1')).toBe(false);
    expect(validatePassword('Abc123')).toBe(false);
    expect(validatePassword('Short1')).toBe(false);
  });

  it('should handle edge cases', () => {
    expect(validatePassword('')).toBe(false);
    expect(validatePassword(null as any)).toBe(false);
    expect(validatePassword(undefined as any)).toBe(false);
    expect(validatePassword(123 as any)).toBe(false);
  });
});

describe('hasPermission', () => {
  it('should return true when user has the required permission', () => {
    const permissions = ['read', 'write', 'delete'];
    expect(hasPermission(permissions, 'read')).toBe(true);
    expect(hasPermission(permissions, 'write')).toBe(true);
    expect(hasPermission(permissions, 'delete')).toBe(true);
  });

  it('should return false when user does not have the required permission', () => {
    const permissions = ['read', 'write'];
    expect(hasPermission(permissions, 'delete')).toBe(false);
    expect(hasPermission(permissions, 'admin')).toBe(false);
  });

  it('should handle empty permission arrays', () => {
    expect(hasPermission([], 'read')).toBe(false);
  });

  it('should handle edge cases', () => {
    expect(hasPermission(null as any, 'read')).toBe(false);
    expect(hasPermission(undefined as any, 'read')).toBe(false);
    expect(hasPermission(['read'], null as any)).toBe(false);
    expect(hasPermission(['read'], undefined as any)).toBe(false);
    expect(hasPermission(['read'], '' as any)).toBe(false);
  });
});

describe('hasAnyPermission', () => {
  it('should return true when user has at least one required permission', () => {
    const permissions = ['read', 'write'];
    expect(hasAnyPermission(permissions, ['read', 'admin'])).toBe(true);
    expect(hasAnyPermission(permissions, ['write', 'delete'])).toBe(true);
    expect(hasAnyPermission(permissions, ['read', 'write'])).toBe(true);
  });

  it('should return false when user has none of the required permissions', () => {
    const permissions = ['read', 'write'];
    expect(hasAnyPermission(permissions, ['delete', 'admin'])).toBe(false);
    expect(hasAnyPermission(permissions, ['execute'])).toBe(false);
  });

  it('should handle empty arrays', () => {
    expect(hasAnyPermission([], ['read'])).toBe(false);
    expect(hasAnyPermission(['read'], [])).toBe(false);
    expect(hasAnyPermission([], [])).toBe(false);
  });

  it('should handle edge cases', () => {
    expect(hasAnyPermission(null as any, ['read'])).toBe(false);
    expect(hasAnyPermission(['read'], null as any)).toBe(false);
    expect(hasAnyPermission(undefined as any, undefined as any)).toBe(false);
  });
});

describe('hasAllPermissions', () => {
  it('should return true when user has all required permissions', () => {
    const permissions = ['read', 'write', 'delete'];
    expect(hasAllPermissions(permissions, ['read', 'write'])).toBe(true);
    expect(hasAllPermissions(permissions, ['read'])).toBe(true);
    expect(hasAllPermissions(permissions, ['read', 'write', 'delete'])).toBe(true);
  });

  it('should return false when user is missing any required permission', () => {
    const permissions = ['read', 'write'];
    expect(hasAllPermissions(permissions, ['read', 'write', 'delete'])).toBe(false);
    expect(hasAllPermissions(permissions, ['admin'])).toBe(false);
  });

  it('should handle empty arrays', () => {
    expect(hasAllPermissions(['read'], [])).toBe(true);
    expect(hasAllPermissions([], ['read'])).toBe(false);
    expect(hasAllPermissions([], [])).toBe(true);
  });

  it('should handle edge cases', () => {
    expect(hasAllPermissions(null as any, ['read'])).toBe(false);
    expect(hasAllPermissions(['read'], null as any)).toBe(false);
    expect(hasAllPermissions(undefined as any, undefined as any)).toBe(false);
  });
});

describe('sanitizeInput', () => {
  it('should remove HTML tags', () => {
    expect(sanitizeInput('<div>Hello</div>')).toBe('Hello');
    expect(sanitizeInput('<p>Test <span>content</span></p>')).toBe('Test content');
    expect(sanitizeInput('<a href="link">Click</a>')).toBe('Click');
  });

  it('should remove script tags and content', () => {
    expect(sanitizeInput('<script>alert("xss")</script>Hello')).toBe('Hello');
    expect(sanitizeInput('Safe<script>dangerous()</script>Text')).toBe('SafeText');
  });

  it('should trim whitespace', () => {
    expect(sanitizeInput('  Hello  ')).toBe('Hello');
    expect(sanitizeInput('\n\tTest\n\t')).toBe('Test');
  });

  it('should handle plain text', () => {
    expect(sanitizeInput('Plain text')).toBe('Plain text');
    expect(sanitizeInput('No tags here')).toBe('No tags here');
  });

  it('should handle edge cases', () => {
    expect(sanitizeInput('')).toBe('');
    expect(sanitizeInput('   ')).toBe('');
    expect(sanitizeInput(null as any)).toBe('');
    expect(sanitizeInput(undefined as any)).toBe('');
    expect(sanitizeInput(123 as any)).toBe('');
  });
});

describe('generateToken', () => {
  it('should generate a token of specified length', () => {
    expect(generateToken(10)).toHaveLength(10);
    expect(generateToken(32)).toHaveLength(32);
    expect(generateToken(64)).toHaveLength(64);
  });

  it('should generate different tokens on each call', () => {
    const token1 = generateToken(32);
    const token2 = generateToken(32);
    expect(token1).not.toBe(token2);
  });

  it('should use default length of 32 when no argument provided', () => {
    expect(generateToken()).toHaveLength(32);
  });

  it('should only contain alphanumeric characters', () => {
    const token = generateToken(100);
    expect(token).toMatch(/^[A-Za-z0-9]+$/);
  });

  it('should throw error for invalid lengths', () => {
    expect(() => generateToken(0)).toThrow('Length must be a positive integer');
    expect(() => generateToken(-5)).toThrow('Length must be a positive integer');
    expect(() => generateToken(3.5)).toThrow('Length must be a positive integer');
  });
});

describe('parseJWTPayload', () => {
  it('should parse a valid JWT token', () => {
    // Create a simple JWT: header.payload.signature
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
    const payload = Buffer.from(JSON.stringify({ userId: '123', name: 'Test User' })).toString('base64');
    const signature = 'fake-signature';
    const token = `${header}.${payload}.${signature}`;

    const result = parseJWTPayload(token);
    expect(result).toEqual({ userId: '123', name: 'Test User' });
  });

  it('should return null for invalid token format', () => {
    expect(parseJWTPayload('invalid')).toBeNull();
    expect(parseJWTPayload('only.two')).toBeNull();
    expect(parseJWTPayload('too.many.parts.here')).toBeNull();
  });

  it('should return null for malformed payload', () => {
    const token = 'header.invalid-base64.signature';
    expect(parseJWTPayload(token)).toBeNull();
  });

  it('should handle edge cases', () => {
    expect(parseJWTPayload('')).toBeNull();
    expect(parseJWTPayload(null as any)).toBeNull();
    expect(parseJWTPayload(undefined as any)).toBeNull();
    expect(parseJWTPayload(123 as any)).toBeNull();
  });
});

describe('isTokenExpired', () => {
  it('should return false for non-expired tokens', () => {
    const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64');
    const payload = Buffer.from(JSON.stringify({ exp: futureTime })).toString('base64');
    const token = `${header}.${payload}.signature`;

    expect(isTokenExpired(token)).toBe(false);
  });

  it('should return true for expired tokens', () => {
    const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
    const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64');
    const payload = Buffer.from(JSON.stringify({ exp: pastTime })).toString('base64');
    const token = `${header}.${payload}.signature`;

    expect(isTokenExpired(token)).toBe(true);
  });

  it('should return true for tokens without exp claim', () => {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64');
    const payload = Buffer.from(JSON.stringify({ userId: '123' })).toString('base64');
    const token = `${header}.${payload}.signature`;

    expect(isTokenExpired(token)).toBe(true);
  });

  it('should return true for invalid tokens', () => {
    expect(isTokenExpired('invalid')).toBe(true);
    expect(isTokenExpired('')).toBe(true);
    expect(isTokenExpired(null as any)).toBe(true);
  });

  it('should handle tokens expiring at exact current time', () => {
    const currentTime = Math.floor(Date.now() / 1000);
    const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64');
    const payload = Buffer.from(JSON.stringify({ exp: currentTime })).toString('base64');
    const token = `${header}.${payload}.signature`;

    // Token should be considered expired at exact expiration time
    expect(isTokenExpired(token)).toBe(true);
  });
});
