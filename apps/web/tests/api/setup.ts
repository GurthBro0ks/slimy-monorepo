/**
 * E2E API Test Setup
 *
 * This file sets up the test environment for API integration tests.
 * It loads environment variables from .env.test and configures global test utilities.
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { beforeAll, afterAll, vi } from 'vitest';

// Load test environment variables
config({ path: resolve(__dirname, '../../.env.test') });

// Mock fetch globally for testing
global.fetch = vi.fn();

// Global test setup
beforeAll(() => {
  console.log('🧪 Setting up E2E API tests...');
  console.log('📍 Environment:', process.env.NODE_ENV);
  console.log('🌐 API Base:', process.env.NEXT_PUBLIC_ADMIN_API_BASE);
});

afterAll(() => {
  console.log('✅ E2E API tests completed');
  vi.clearAllMocks();
});

// Helper function to create mock cookies
export function createMockCookie(userId: string, name: string = 'Test User'): string {
  const mockToken = Buffer.from(JSON.stringify({
    user: { id: userId, name },
    guilds: [{ id: '123', roles: ['1178129227321712701'] }], // Admin role
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
  })).toString('base64');

  return `slimy_admin=${mockToken}`;
}

// Helper function to create mock fetch response
export function createMockResponse<T>(data: T, status = 200, ok = true): Response {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => data,
    text: async () => JSON.stringify(data),
    blob: async () => new Blob([JSON.stringify(data)]),
    arrayBuffer: async () => new ArrayBuffer(0),
    formData: async () => new FormData(),
    clone: function() { return this; },
    body: null,
    bodyUsed: false,
    redirected: false,
    type: 'basic' as ResponseType,
    url: '',
  } as Response;
}

// Helper function to wait for async operations
export function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
