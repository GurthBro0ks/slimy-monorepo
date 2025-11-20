/**
 * E2E API Tests - OpenAI Chat Bot
 *
 * Tests the chat bot API endpoint including:
 * - Successful chat responses
 * - Rate limiting
 * - Error handling
 * - OpenAI response mocking
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/chat/bot/route';
import { NextRequest } from 'next/server';
import { createMockResponse } from './setup';

// Mock the rate limiter
vi.mock('@/lib/rate-limiter', () => ({
  isRateLimited: vi.fn(),
}));

// Mock the API client
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

describe('OpenAI Chat API - POST /api/chat/bot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return successful chat response', async () => {
    const { apiClient } = await import('@/lib/api-client');
    const { isRateLimited } = await import('@/lib/rate-limiter');

    // Mock rate limiter to allow request
    vi.mocked(isRateLimited).mockReturnValue(false);

    // Mock successful API response from backend
    vi.mocked(apiClient.post).mockResolvedValue({
      ok: true,
      data: {
        ok: true,
        reply: 'Hello! I am a helpful assistant. How can I help you today?',
      },
      status: 200,
      headers: new Headers(),
    });

    const requestBody = {
      prompt: 'Hello, can you help me?',
      guildId: 'test-guild-123',
    };

    const request = new NextRequest('http://localhost:3000/api/chat/bot', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '127.0.0.1',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      ok: true,
      reply: 'Hello! I am a helpful assistant. How can I help you today?',
    });

    expect(apiClient.post).toHaveBeenCalledWith('/api/chat/bot', {
      prompt: 'Hello, can you help me?',
      guildId: 'test-guild-123',
    });
  });

  it('should enforce rate limiting', async () => {
    const { isRateLimited } = await import('@/lib/rate-limiter');

    // Mock rate limiter to block request
    vi.mocked(isRateLimited).mockReturnValue(true);

    const requestBody = {
      prompt: 'This should be rate limited',
      guildId: 'test-guild-123',
    };

    const request = new NextRequest('http://localhost:3000/api/chat/bot', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '127.0.0.1',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data).toMatchObject({
      ok: false,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'You have exceeded the chat limit. Please try again later.',
    });

    // Check rate limit headers
    expect(response.headers.get('Retry-After')).toBe('60');
    expect(response.headers.get('X-RateLimit-Reset')).toBeTruthy();
  });

  it('should handle backend API errors', async () => {
    const { apiClient } = await import('@/lib/api-client');
    const { isRateLimited } = await import('@/lib/rate-limiter');

    vi.mocked(isRateLimited).mockReturnValue(false);

    // Mock API error response
    vi.mocked(apiClient.post).mockResolvedValue({
      ok: false,
      code: 'OPENAI_ERROR',
      message: 'OpenAI API error',
      status: 500,
    });

    const requestBody = {
      prompt: 'This will cause an error',
      guildId: 'test-guild-123',
    };

    const request = new NextRequest('http://localhost:3000/api/chat/bot', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '127.0.0.1',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toMatchObject({
      ok: false,
      code: 'CHAT_ERROR',
      message: 'OpenAI API error',
    });
  });

  it('should handle authentication errors', async () => {
    const { apiClient } = await import('@/lib/api-client');
    const { isRateLimited } = await import('@/lib/rate-limiter');

    vi.mocked(isRateLimited).mockReturnValue(false);

    // Mock authentication error
    vi.mocked(apiClient.post).mockResolvedValue({
      ok: false,
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
      status: 401,
    });

    const requestBody = {
      prompt: 'Test prompt',
      guildId: 'test-guild-123',
    };

    const request = new NextRequest('http://localhost:3000/api/chat/bot', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '127.0.0.1',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toMatchObject({
      ok: false,
      code: 'CHAT_ERROR',
      message: 'Authentication required',
    });
  });

  it('should handle invalid request body', async () => {
    const { isRateLimited } = await import('@/lib/rate-limiter');

    vi.mocked(isRateLimited).mockReturnValue(false);

    const request = new NextRequest('http://localhost:3000/api/chat/bot', {
      method: 'POST',
      body: 'invalid json',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '127.0.0.1',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toMatchObject({
      ok: false,
      code: 'CHAT_ERROR',
    });
  });

  it('should handle different IP addresses for rate limiting', async () => {
    const { isRateLimited } = await import('@/lib/rate-limiter');

    vi.mocked(isRateLimited).mockReturnValue(false);

    const requestBody = {
      prompt: 'Test from different IP',
      guildId: 'test-guild-123',
    };

    const request = new NextRequest('http://localhost:3000/api/chat/bot', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '192.168.1.1',
      },
    });

    await POST(request);

    // Verify rate limiter was called with correct key
    expect(isRateLimited).toHaveBeenCalledWith('chat:192.168.1.1', 5, 60000);
  });

  it('should use x-real-ip header if x-forwarded-for is not present', async () => {
    const { isRateLimited } = await import('@/lib/rate-limiter');

    vi.mocked(isRateLimited).mockReturnValue(false);

    const requestBody = {
      prompt: 'Test with real IP header',
      guildId: 'test-guild-123',
    };

    const request = new NextRequest('http://localhost:3000/api/chat/bot', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'content-type': 'application/json',
        'x-real-ip': '10.0.0.1',
      },
    });

    await POST(request);

    // Verify rate limiter was called with x-real-ip
    expect(isRateLimited).toHaveBeenCalledWith('chat:10.0.0.1', 5, 60000);
  });

  it('should handle missing IP headers gracefully', async () => {
    const { isRateLimited } = await import('@/lib/rate-limiter');

    vi.mocked(isRateLimited).mockReturnValue(false);

    const requestBody = {
      prompt: 'Test without IP headers',
      guildId: 'test-guild-123',
    };

    const request = new NextRequest('http://localhost:3000/api/chat/bot', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'content-type': 'application/json',
      },
    });

    await POST(request);

    // Verify rate limiter was called with 'anonymous'
    expect(isRateLimited).toHaveBeenCalledWith('chat:anonymous', 5, 60000);
  });

  it('should mock complete OpenAI conversation flow', async () => {
    const { apiClient } = await import('@/lib/api-client');
    const { isRateLimited } = await import('@/lib/rate-limiter');

    vi.mocked(isRateLimited).mockReturnValue(false);

    // Mock a realistic OpenAI-style response
    const mockOpenAIResponse = {
      ok: true,
      data: {
        ok: true,
        reply: 'I can help you with that! Here are some suggestions:\n1. First option\n2. Second option\n3. Third option',
      },
      status: 200,
      headers: new Headers(),
    };

    vi.mocked(apiClient.post).mockResolvedValue(mockOpenAIResponse);

    const requestBody = {
      prompt: 'Can you give me some suggestions?',
      guildId: 'guild-456',
    };

    const request = new NextRequest('http://localhost:3000/api/chat/bot', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '203.0.113.1',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.reply).toContain('suggestions');
    expect(data.reply).toContain('1.');
    expect(data.reply).toContain('2.');
    expect(data.reply).toContain('3.');
  });
});
