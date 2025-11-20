/**
 * @slimy/shared-http
 *
 * Shared HTTP client for Slimy monorepo
 * Works in both Node.js and Browser environments
 *
 * Features:
 * - Type-safe HTTP requests with ApiResponse<T>
 * - Automatic retry with exponential backoff
 * - Structured error handling
 * - Timeout support
 * - Universal compatibility (Node + Browser)
 *
 * @example
 * ```typescript
 * import { HttpClient } from '@slimy/shared-http';
 *
 * const client = new HttpClient({
 *   baseUrl: 'https://api.example.com',
 *   timeout: 10000,
 * });
 *
 * const result = await client.get('/users/123');
 * if (result.ok) {
 *   console.log('User:', result.data);
 * } else {
 *   console.error('Error:', result.code, result.message);
 * }
 * ```
 *
 * @packageDocumentation
 */

// Core client
export { HttpClient } from './client.js';

// Types
export type {
  ApiResponse,
  ApiSuccess,
  ApiError,
  HttpClientConfig,
  RequestConfig,
  RetryConfig,
} from './types.js';

// Error utilities
export {
  ErrorCode,
  isRetryableError,
  statusToErrorCode,
  toApiError,
  responseToApiError,
} from './errors.js';

// Retry utilities
export {
  DEFAULT_RETRY_CONFIG,
  calculateRetryDelay,
  withRetry,
  delay,
} from './retry.js';
