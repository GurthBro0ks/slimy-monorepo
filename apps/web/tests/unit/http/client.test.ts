/**
 * Tests for HTTP Client
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  HttpClient,
  HttpError,
  createHttpClient,
  httpGet,
  httpPost,
  httpPut,
  httpPatch,
  httpDelete,
  type HttpResult,
} from '@/lib/http';
import { ErrorCode } from '@/lib/errors';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock logger to avoid file system operations in tests
vi.mock('@/lib/monitoring/logger', () => ({
  getLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    child: vi.fn(),
  }),
  Logger: vi.fn(),
}));

describe('HttpClient', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('GET requests', () => {
    it('should successfully fetch JSON data', async () => {
      const mockData = { id: 1, name: 'Test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockData,
      });

      const client = new HttpClient();
      const result = await client.get<typeof mockData>('https://api.example.com/test');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual(mockData);
        expect(result.status).toBe(200);
      }

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should handle text responses', async () => {
      const mockText = 'Plain text response';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: async () => mockText,
      });

      const client = new HttpClient();
      const result = await client.get<string>('https://api.example.com/text');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toBe(mockText);
      }
    });

    it('should apply base URL when configured', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({}),
      });

      const client = new HttpClient({ baseUrl: 'https://api.example.com' });
      await client.get('/users');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.any(Object)
      );
    });
  });

  describe('POST requests', () => {
    it('should send JSON body', async () => {
      const requestBody = { name: 'Test', email: 'test@example.com' };
      const responseData = { id: 123, ...requestBody };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => responseData,
      });

      const client = new HttpClient();
      const result = await client.post('/users', requestBody);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual(responseData);
        expect(result.status).toBe(201);
      }

      expect(mockFetch).toHaveBeenCalledWith(
        '/users',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestBody),
        })
      );
    });

    it('should set Content-Type header for POST', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({}),
      });

      const client = new HttpClient();
      await client.post('/test', { data: 'test' });

      const callArgs = mockFetch.mock.calls[0];
      const headers = callArgs[1].headers as Headers;
      expect(headers.get('Content-Type')).toBe('application/json');
    });
  });

  describe('Error handling', () => {
    it('should handle HTTP 404 errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ message: 'Resource not found' }),
      });

      const client = new HttpClient();
      const result = await client.get('/not-found');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(HttpError);
        expect(result.error.status).toBe(404);
        expect(result.error.code).toBe(ErrorCode.NOT_FOUND);
        expect(result.error.url).toContain('/not-found');
        expect(result.error.method).toBe('GET');
      }
    });

    it('should handle HTTP 401 errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: new Headers(),
        text: async () => 'Unauthorized',
      });

      const client = new HttpClient();
      const result = await client.get('/protected');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.status).toBe(401);
        expect(result.error.code).toBe(ErrorCode.UNAUTHORIZED);
      }
    });

    it('should handle HTTP 429 rate limiting', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: new Headers(),
        text: async () => '',
      });

      const client = new HttpClient();
      const result = await client.get('/api/limited');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.status).toBe(429);
        expect(result.error.code).toBe(ErrorCode.RATE_LIMIT_EXCEEDED);
      }
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      const client = new HttpClient();
      const result = await client.get('https://api.example.com/test');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(HttpError);
        expect(result.error.isNetworkError).toBe(true);
        expect(result.error.code).toBe(ErrorCode.NETWORK_ERROR);
        expect(result.error.status).toBeNull();
      }
    });

    it('should handle timeout errors', async () => {
      mockFetch.mockImplementationOnce(() => {
        const error = new Error('The operation was aborted');
        error.name = 'AbortError';
        return Promise.reject(error);
      });

      const client = new HttpClient({ timeout: 100 });
      const result = await client.get('https://slow-api.example.com/test');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.isNetworkError).toBe(true);
        expect(result.error.status).toBe(408);
        expect(result.error.code).toBe(ErrorCode.NETWORK_ERROR);
      }
    });

    it('should handle JSON parse errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => {
          throw new SyntaxError('Unexpected token');
        },
      });

      const client = new HttpClient();
      const result = await client.get('/broken-json');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('JSON_PARSE_ERROR');
        expect(result.error.status).toBe(200);
      }
    });
  });

  describe('Retry logic', () => {
    it('should retry network failures with exponential backoff', async () => {
      // First two calls fail, third succeeds
      mockFetch
        .mockRejectedValueOnce(new TypeError('Network error'))
        .mockRejectedValueOnce(new TypeError('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ success: true }),
        });

      const client = new HttpClient({ retries: 2, retryDelay: 10 });
      const result = await client.get('https://flaky-api.example.com/test');

      expect(result.ok).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should not retry on timeout errors', async () => {
      mockFetch.mockImplementationOnce(() => {
        const error = new Error('The operation was aborted');
        error.name = 'AbortError';
        return Promise.reject(error);
      });

      const client = new HttpClient({ retries: 2, timeout: 100 });
      const result = await client.get('https://slow-api.example.com/test');

      expect(result.ok).toBe(false);
      expect(mockFetch).toHaveBeenCalledTimes(1); // No retries
    });

    it('should not retry HTTP errors (4xx, 5xx)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers(),
        text: async () => 'Server error',
      });

      const client = new HttpClient({ retries: 2 });
      const result = await client.get('/server-error');

      expect(result.ok).toBe(false);
      expect(mockFetch).toHaveBeenCalledTimes(1); // No retries for HTTP errors
    });
  });

  describe('Headers and configuration', () => {
    it('should merge default headers with request headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({}),
      });

      const client = new HttpClient({
        headers: {
          'X-API-Key': 'default-key',
          'User-Agent': 'TestClient/1.0',
        },
      });

      await client.get('/test', {
        headers: {
          'X-Request-ID': '123',
        },
      });

      const callArgs = mockFetch.mock.calls[0];
      const headers = callArgs[1].headers as Headers;

      expect(headers.get('X-API-Key')).toBe('default-key');
      expect(headers.get('User-Agent')).toBe('TestClient/1.0');
      expect(headers.get('X-Request-ID')).toBe('123');
    });

    it('should allow overriding default headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({}),
      });

      const client = new HttpClient({
        headers: { 'User-Agent': 'DefaultAgent' },
      });

      await client.get('/test', {
        headers: { 'User-Agent': 'CustomAgent' },
      });

      const callArgs = mockFetch.mock.calls[0];
      const headers = callArgs[1].headers as Headers;
      expect(headers.get('User-Agent')).toBe('CustomAgent');
    });
  });

  describe('Convenience methods', () => {
    it('should support PUT requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({ updated: true }),
      });

      const client = new HttpClient();
      const result = await client.put('/resource/1', { name: 'Updated' });

      expect(result.ok).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        '/resource/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ name: 'Updated' }),
        })
      );
    });

    it('should support PATCH requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({ patched: true }),
      });

      const client = new HttpClient();
      const result = await client.patch('/resource/1', { status: 'active' });

      expect(result.ok).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        '/resource/1',
        expect.objectContaining({
          method: 'PATCH',
        })
      );
    });

    it('should support DELETE requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Headers(),
        text: async () => '',
      });

      const client = new HttpClient();
      const result = await client.delete('/resource/1');

      expect(result.ok).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        '/resource/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('Stream method', () => {
    it('should return raw Response for streaming', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/event-stream' }),
        body: {
          getReader: () => ({ read: vi.fn() }),
        },
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const client = new HttpClient();
      const response = await client.stream('GET', '/stream');

      expect(response).toBe(mockResponse);
      expect(response.ok).toBe(true);
    });

    it('should throw HttpError for failed stream requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        headers: new Headers(),
      });

      const client = new HttpClient();

      await expect(client.stream('GET', '/protected-stream')).rejects.toThrow(HttpError);
    });
  });

  describe('Global convenience functions', () => {
    it('should use default client for httpGet', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ test: true }),
      });

      const result = await httpGet('/test');

      expect(result.ok).toBe(true);
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should use default client for httpPost', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ created: true }),
      });

      const result = await httpPost('/create', { data: 'test' });

      expect(result.ok).toBe(true);
    });
  });
});

describe('HttpError', () => {
  it('should create HttpError with correct properties', () => {
    const error = new HttpError({
      message: 'Request failed',
      code: ErrorCode.EXTERNAL_SERVICE_ERROR,
      url: 'https://api.example.com/test',
      method: 'GET',
      status: 500,
      isNetworkError: false,
    });

    expect(error.message).toBe('Request failed');
    expect(error.code).toBe(ErrorCode.EXTERNAL_SERVICE_ERROR);
    expect(error.url).toBe('https://api.example.com/test');
    expect(error.method).toBe('GET');
    expect(error.status).toBe(500);
    expect(error.isNetworkError).toBe(false);
    expect(error.name).toBe('HttpError');
  });

  it('should serialize to JSON correctly', () => {
    const error = new HttpError({
      message: 'Network error',
      code: ErrorCode.NETWORK_ERROR,
      url: 'https://api.example.com/test',
      method: 'POST',
      status: null,
      isNetworkError: true,
    });

    const json = error.toJSON();

    expect(json).toMatchObject({
      ok: false,
      code: ErrorCode.NETWORK_ERROR,
      message: 'Network error',
      status: 500,
      url: 'https://api.example.com/test',
      method: 'POST',
      isNetworkError: true,
    });
  });

  it('should extend AppError', () => {
    const error = new HttpError({
      message: 'Test error',
      code: 'TEST',
      url: '/test',
      method: 'GET',
    });

    expect(error).toBeInstanceOf(Error);
    expect(error.statusCode).toBe(500); // Default from AppError
  });
});

describe('createHttpClient', () => {
  it('should create new client instance with custom config', () => {
    const client1 = createHttpClient({ baseUrl: 'https://api1.example.com' });
    const client2 = createHttpClient({ baseUrl: 'https://api2.example.com' });

    expect(client1).toBeInstanceOf(HttpClient);
    expect(client2).toBeInstanceOf(HttpClient);
    expect(client1).not.toBe(client2);
  });
});
