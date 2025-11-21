/**
 * HTTP Client Usage Examples
 *
 * This file demonstrates how to use the centralized HTTP client
 * for making requests to the Admin API.
 */

import * as httpClient from './http-client';
import * as healthClient from './api/health';

// ============================================================================
// Example 1: Simple GET request
// ============================================================================

interface User {
  id: string;
  name: string;
  email: string;
}

async function fetchUser(userId: string): Promise<User> {
  return httpClient.get<User>(`/api/users/${userId}`);
}

// ============================================================================
// Example 2: POST request with body
// ============================================================================

interface CreateMessageRequest {
  content: string;
  channelId?: string;
}

interface CreateMessageResponse {
  id: string;
  content: string;
  createdAt: string;
}

async function createMessage(data: CreateMessageRequest): Promise<CreateMessageResponse> {
  return httpClient.post<CreateMessageResponse, CreateMessageRequest>(
    '/api/chat/messages',
    data
  );
}

// ============================================================================
// Example 3: Request with custom options (timeout, headers, requestId)
// ============================================================================

async function fetchWithCustomOptions(): Promise<void> {
  try {
    const data = await httpClient.get('/api/data', {
      timeout: 5000, // 5 second timeout
      requestId: httpClient.generateRequestId(), // Custom request ID for tracing
      headers: {
        'X-Custom-Header': 'value',
      },
    });
    console.log('Data:', data);
  } catch (error) {
    if (error instanceof httpClient.HttpError) {
      console.error(`HTTP Error ${error.status}: ${error.message}`);
      console.error('Error code:', error.code);
      console.error('Details:', error.details);
    }
  }
}

// ============================================================================
// Example 4: Health check with connection status
// ============================================================================

async function checkApiHealth(): Promise<void> {
  // Check if API is configured
  if (!healthClient.isConfigured()) {
    console.warn('Admin API base URL not configured');
    console.warn('Set NEXT_PUBLIC_ADMIN_API_BASE in your environment');
    return;
  }

  console.log('Admin API URL:', healthClient.getBaseUrl());

  // Perform health check
  const result = await healthClient.checkHealth();

  switch (result.status) {
    case 'connected':
      console.log('✅ Admin API is healthy');
      console.log('Service:', result.response?.service);
      console.log('Version:', result.response?.version);
      console.log('Uptime:', result.response?.uptimeSec, 'seconds');
      break;

    case 'degraded':
      console.warn('⚠️ Admin API is running but degraded');
      console.warn('Response:', result.response);
      break;

    case 'offline':
      console.error('❌ Admin API is offline');
      console.error('Error:', result.error?.message);
      break;
  }
}

// ============================================================================
// Example 5: Error handling patterns
// ============================================================================

async function handleErrorsGracefully(): Promise<void> {
  try {
    const data = await httpClient.get('/api/might-fail');
    console.log('Success:', data);
  } catch (error) {
    if (error instanceof httpClient.HttpError) {
      // Handle specific HTTP errors
      switch (error.status) {
        case 401:
          console.error('Unauthorized - please log in');
          // Redirect to login
          break;

        case 403:
          console.error('Forbidden - insufficient permissions');
          break;

        case 404:
          console.error('Resource not found');
          break;

        case 429:
          console.error('Rate limit exceeded - please try again later');
          break;

        case 500:
        case 502:
        case 503:
          console.error('Server error - please try again');
          break;

        default:
          console.error(`HTTP Error ${error.status}: ${error.message}`);
      }
    } else {
      // Handle non-HTTP errors (network issues, etc.)
      console.error('Unexpected error:', error);
    }
  }
}

// ============================================================================
// Example 6: React hook pattern for API calls
// ============================================================================

/**
 * Example React hook for fetching data with the HTTP client
 *
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   const { data, error, loading } = useApiData<User>('/api/users/123');
 *
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   return <div>User: {data?.name}</div>;
 * }
 * ```
 */
// import { useState, useEffect } from 'react';
//
// interface UseApiDataResult<T> {
//   data: T | null;
//   error: Error | null;
//   loading: boolean;
//   refetch: () => Promise<void>;
// }
//
// function useApiData<T>(path: string): UseApiDataResult<T> {
//   const [data, setData] = useState<T | null>(null);
//   const [error, setError] = useState<Error | null>(null);
//   const [loading, setLoading] = useState(true);
//
//   const fetchData = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const result = await httpClient.get<T>(path);
//       setData(result);
//     } catch (err) {
//       setError(err instanceof Error ? err : new Error(String(err)));
//     } finally {
//       setLoading(false);
//     }
//   };
//
//   useEffect(() => {
//     fetchData();
//   }, [path]);
//
//   return { data, error, loading, refetch: fetchData };
// }

// ============================================================================
// Example 7: Checking configuration at app startup
// ============================================================================

export function validateApiConfiguration(): void {
  console.log('🔍 Validating API configuration...');

  if (!httpClient.isConfigured()) {
    console.error('❌ NEXT_PUBLIC_ADMIN_API_BASE is not configured');
    console.error('   Please set this environment variable to your Admin API URL');
    console.error('   Example: NEXT_PUBLIC_ADMIN_API_BASE=http://localhost:3080');
    return;
  }

  console.log('✅ Admin API base URL configured:', httpClient.getBaseUrl());
}

// ============================================================================
// Example 8: Sandbox mode detection
// ============================================================================

export function isSandboxMode(): boolean {
  return !httpClient.isConfigured();
}

export function getSandboxWarning(): string {
  return 'Running in sandbox mode - API calls will use mock data';
}

// Export example functions for testing
export {
  fetchUser,
  createMessage,
  fetchWithCustomOptions,
  checkApiHealth,
  handleErrorsGracefully,
};
