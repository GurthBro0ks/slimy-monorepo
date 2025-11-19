import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  HttpClient,
  httpClient,
  HttpError,
  isHttpSuccess,
  isHttpError,
  unwrapHttp,
  type HttpResult,
} from '@/lib/http';

// Mock the logger
vi.mock('@/lib/monitoring/logger', () => ({
  getLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

describe('HttpClient', () => {
  let client: HttpClient;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    client = new HttpClient();
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET requests', () => {
    it('should make successful GET request', async () => {
      const mockData = { id: 1, name: 'Test' };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockData,
      });

      const result = await client.get<typeof mockData>('https://api.test/users/1');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual(mockData);
        expect(result.status).toBe(200);
        expect(result.method).toBe('GET');
      }
    });

    it('should handle non-JSON responses', async () => {
      const textData = 'Plain text response';
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: async () => textData,
      });

      const result = await client.get('https://api.test/text');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toBe(textData);
      }
    });

    it('should handle 404 errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers(),
        text: async () => JSON.stringify({ message: 'Resource not found' }),
      });

      const result = await client.get('https://api.test/missing');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(404);
        expect(result.error).toBeInstanceOf(HttpError);
        expect(result.error.message).toContain('Resource not found');
      }
    });

    it('should handle network errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network failure'));

      const result = await client.get('https://api.test/error', {
        retries: 0,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NETWORK_ERROR');
        expect(result.error.message).toContain('Network failure');
      }
    });

    it('should handle timeout errors', async () => {
      fetchMock.mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            const error = new Error('Aborted');
            error.name = 'AbortError';
            reject(error);
          }, 100);
        });
      });

      const result = await client.get('https://api.test/slow', {
        timeout: 50,
        retries: 0,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('TIMEOUT_ERROR');
        expect(result.status).toBe(408);
      }
    });
  });

  describe('POST requests', () => {
    it('should make successful POST request with JSON body', async () => {
      const requestData = { name: 'New User', email: 'test@test.com' };
      const responseData = { id: 1, ...requestData };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 201,
        statusText: 'Created',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => responseData,
      });

      const result = await client.post('https://api.test/users', requestData);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual(responseData);
        expect(result.status).toBe(201);
        expect(result.method).toBe('POST');
      }

      // Verify the request was made with correct body
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.test/users',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestData),
        })
      );
    });

    it('should set Content-Type header for JSON body', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        json: async () => ({}),
      });

      await client.post('https://api.test/data', { test: true });

      const [, options] = fetchMock.mock.calls[0];
      const headers = options.headers as Headers;
      expect(headers.get('Content-Type')).toBe('application/json');
    });
  });

  describe('Retry logic', () => {
    it('should retry on network errors', async () => {
      fetchMock
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ success: true }),
        });

      const result = await client.get('https://api.test/retry', {
        retries: 2,
        retryDelay: 10,
      });

      expect(result.ok).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('should retry on 503 Service Unavailable', async () => {
      fetchMock
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers(),
          text: async () => 'Service temporarily unavailable',
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ success: true }),
        });

      const result = await client.get('https://api.test/retry', {
        retries: 1,
        retryDelay: 10,
      });

      expect(result.ok).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('should NOT retry on 404 Not Found', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers(),
        text: async () => JSON.stringify({ message: 'Not found' }),
      });

      const result = await client.get('https://api.test/missing', {
        retries: 2,
      });

      expect(result.ok).toBe(false);
      expect(fetchMock).toHaveBeenCalledTimes(1); // Should not retry
    });

    it('should respect max retries limit', async () => {
      fetchMock.mockRejectedValue(new Error('Network error'));

      const result = await client.get('https://api.test/fail', {
        retries: 3,
        retryDelay: 1,
      });

      expect(result.ok).toBe(false);
      expect(fetchMock).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });

    it('should use exponential backoff', async () => {
      const delays: number[] = [];

      // Track actual delay() calls by spying on Promise creation
      let delayCallCount = 0;
      const startTime = Date.now();
      const callTimes: number[] = [];

      fetchMock.mockImplementation(() => {
        callTimes.push(Date.now() - startTime);
        return Promise.reject(new Error('Network error'));
      });

      await client.get('https://api.test/fail', {
        retries: 3,
        retryDelay: 100,
        maxRetryDelay: 10000,
        timeout: 5000,
      });

      // Should have 4 calls total: initial + 3 retries
      expect(fetchMock).toHaveBeenCalledTimes(4);

      // Verify delays are increasing (approximately):
      // Call 0: ~0ms
      // Call 1: ~100ms
      // Call 2: ~300ms (100 + 200)
      // Call 3: ~700ms (100 + 200 + 400)
      expect(callTimes[0]).toBeLessThan(50); // First call immediate
      expect(callTimes[1]).toBeGreaterThanOrEqual(80); // ~100ms
      expect(callTimes[1]).toBeLessThan(150);
      expect(callTimes[2]).toBeGreaterThanOrEqual(250); // ~300ms
      expect(callTimes[2]).toBeLessThan(400);
      expect(callTimes[3]).toBeGreaterThanOrEqual(600); // ~700ms
      expect(callTimes[3]).toBeLessThan(900);
    });
  });

  describe('Other HTTP methods', () => {
    it('should make PUT requests', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ updated: true }),
      });

      const result = await client.put('https://api.test/users/1', { name: 'Updated' });

      expect(result.ok).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.test/users/1',
        expect.objectContaining({ method: 'PUT' })
      );
    });

    it('should make PATCH requests', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ patched: true }),
      });

      const result = await client.patch('https://api.test/users/1', { email: 'new@test.com' });

      expect(result.ok).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.test/users/1',
        expect.objectContaining({ method: 'PATCH' })
      );
    });

    it('should make DELETE requests', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 204,
        statusText: 'No Content',
        headers: new Headers(),
        text: async () => '',
      });

      const result = await client.delete('https://api.test/users/1');

      expect(result.ok).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.test/users/1',
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should make HEAD requests', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-length': '1234' }),
      });

      const result = await client.head('https://api.test/file.pdf');

      expect(result.ok).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.test/file.pdf',
        expect.objectContaining({ method: 'HEAD' })
      );
    });
  });

  describe('URL validation', () => {
    it('should validate accessible URLs', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
      });

      const isValid = await client.validateUrl('https://example.com/image.jpg');

      expect(isValid).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://example.com/image.jpg',
        expect.objectContaining({ method: 'HEAD' })
      );
    });

    it('should return false for inaccessible URLs', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers(),
        text: async () => '',
      });

      const isValid = await client.validateUrl('https://example.com/missing.jpg');

      expect(isValid).toBe(false);
    });
  });

  describe('Helper functions', () => {
    it('should identify successful responses with isHttpSuccess', () => {
      const successResult: HttpResult<any> = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        data: { test: true },
        url: 'https://test.com',
        method: 'GET',
      };

      expect(isHttpSuccess(successResult)).toBe(true);
    });

    it('should identify error responses with isHttpError', () => {
      const errorResult: HttpResult<any> = {
        ok: false,
        status: 500,
        error: new HttpError('Error', 'https://test.com', 'GET', 500),
        url: 'https://test.com',
        method: 'GET',
      };

      expect(isHttpError(errorResult)).toBe(true);
    });

    it('should unwrap successful responses', () => {
      const successResult: HttpResult<{ value: string }> = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        data: { value: 'test' },
        url: 'https://test.com',
        method: 'GET',
      };

      const data = unwrapHttp(successResult);
      expect(data).toEqual({ value: 'test' });
    });

    it('should throw error when unwrapping error responses', () => {
      const errorResult: HttpResult<any> = {
        ok: false,
        status: 500,
        error: new HttpError('Server error', 'https://test.com', 'GET', 500),
        url: 'https://test.com',
        method: 'GET',
      };

      expect(() => unwrapHttp(errorResult)).toThrow(HttpError);
    });
  });

  describe('Default instance', () => {
    it('should export a default httpClient instance', () => {
      expect(httpClient).toBeInstanceOf(HttpClient);
    });
  });

  describe('Custom headers', () => {
    it('should include custom headers in request', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        json: async () => ({}),
      });

      await client.get('https://api.test/data', {
        headers: {
          'X-Custom-Header': 'test-value',
          'Authorization': 'Bearer token123',
        },
      });

      const [, options] = fetchMock.mock.calls[0];
      const headers = options.headers as Headers;
      expect(headers.get('X-Custom-Header')).toBe('test-value');
      expect(headers.get('Authorization')).toBe('Bearer token123');
    });
  });

  describe('Skip JSON parsing', () => {
    it('should return raw response when skipJsonParsing is true', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        body: { getReader: () => ({}) },
      };

      fetchMock.mockResolvedValueOnce(mockResponse);

      const result = await client.get('https://api.test/stream', {
        skipJsonParsing: true,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toBe(mockResponse);
      }
    });
  });
});

describe('HttpError', () => {
  it('should create HttpError with all properties', () => {
    const error = new HttpError(
      'Test error',
      'https://test.com/api',
      'POST',
      500,
      'SERVER_ERROR',
      { detail: 'test' }
    );

    expect(error.message).toBe('Test error');
    expect(error.url).toBe('https://test.com/api');
    expect(error.method).toBe('POST');
    expect(error.status).toBe(500);
    expect(error.code).toBe('SERVER_ERROR');
    expect(error.statusCode).toBe(500);
    expect(error.details).toEqual({ detail: 'test' });
  });

  it('should serialize to JSON with URL and method', () => {
    const error = new HttpError('Test', 'https://test.com', 'GET', 404);
    const json = error.toJSON();

    expect(json).toMatchObject({
      ok: false,
      message: 'Test',
      url: 'https://test.com',
      method: 'GET',
      status: 404,
    });
  });
});
