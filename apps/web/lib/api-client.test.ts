/**
 * Basic tests for the API client
 */

import { apiClient, ApiClient } from './api-client';

describe('ApiClient', () => {
  let client: ApiClient;

  beforeEach(() => {
    client = new ApiClient('https://httpbin.org');
  });

  it('should create an instance', () => {
    expect(client).toBeInstanceOf(ApiClient);
  });

  it('should have default instance', () => {
    expect(apiClient).toBeInstanceOf(ApiClient);
  });

  it('should handle GET requests', async () => {
    const result = await client.get('/get');
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
  });

  it('should handle caching', async () => {
    // First request
    const result1 = await client.get('/get', { useCache: true, cacheTtl: 60000 });
    expect(result1.ok).toBe(true);

    // Second request should be from cache
    const result2 = await client.get('/get', { useCache: true, cacheTtl: 60000 });
    expect(result2.ok).toBe(true);
    expect(result2.data).toEqual(result1.data);
  });

  it('should handle POST requests', async () => {
    const testData = { test: 'data' };
    const result = await client.post('/post', testData);
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.data.json).toEqual(testData);
  });

  it('should handle network errors gracefully', async () => {
    const badClient = new ApiClient('https://invalid-domain-that-does-not-exist.com');
    const result = await badClient.get('/test');
    expect(result.ok).toBe(false);
    expect(result.code).toBe('NETWORK_ERROR');
  });

  it('should handle timeout', async () => {
    const result = await client.get('/delay/5', { timeout: 1000 });
    expect(result.ok).toBe(false);
    expect(result.code).toBe('TIMEOUT_ERROR');
  });

  it('should support request interceptors', async () => {
    let interceptorCalled = false;
    client.addRequestInterceptor((config) => {
      interceptorCalled = true;
      return config;
    });

    await client.get('/get');
    expect(interceptorCalled).toBe(true);
  });

  it('should support response interceptors', async () => {
    let interceptorCalled = false;
    client.addResponseInterceptor(async (response) => {
      interceptorCalled = true;
      return response;
    });

    await client.get('/get');
    expect(interceptorCalled).toBe(true);
  });
});
