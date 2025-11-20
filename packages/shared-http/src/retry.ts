/**
 * Retry logic with exponential backoff
 * Handles transient failures by retrying requests with increasing delays
 */

import type { ApiResponse, RetryConfig } from './types.js';
import { isRetryableError } from './errors.js';

/**
 * Default retry configuration
 * - 3 retries maximum
 * - Start with 1 second delay
 * - Double delay each time (exponential backoff)
 * - Cap at 30 seconds
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
};

/**
 * Calculate delay for a retry attempt using exponential backoff
 *
 * Formula: delay = baseDelay * (backoffMultiplier ^ attempt)
 * Example with defaults:
 * - Attempt 0: 1000ms
 * - Attempt 1: 2000ms
 * - Attempt 2: 4000ms
 * - Attempt 3: 8000ms
 *
 * @param attempt - The retry attempt number (0-indexed)
 * @param config - Retry configuration
 * @returns Delay in milliseconds
 */
export function calculateRetryDelay(
  attempt: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): number {
  const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt);
  return Math.min(delay, config.maxDelay);
}

/**
 * Wait for a specified duration
 * @param ms - Duration in milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a function with retry logic
 *
 * Retries the function if:
 * - It returns an ApiError with a retryable error code or status
 * - We haven't exceeded maxRetries
 *
 * @template T - The type of successful response data
 * @param fn - Function that returns an ApiResponse
 * @param config - Retry configuration
 * @returns Final ApiResponse (success or error)
 */
export async function withRetry<T>(
  fn: () => Promise<ApiResponse<T>>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<ApiResponse<T>> {
  let lastResponse: ApiResponse<T> | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    // Execute the function
    const response = await fn();

    // Success - return immediately
    if (response.ok) {
      return response;
    }

    // Store the error response
    lastResponse = response;

    // Don't retry on the last attempt
    if (attempt >= config.maxRetries) {
      break;
    }

    // Check if the error is retryable
    if (!isRetryableError(response)) {
      // Non-retryable error - return immediately
      break;
    }

    // Calculate delay and wait before retrying
    const retryDelay = calculateRetryDelay(attempt, config);
    console.log(
      `[HttpClient] Retry attempt ${attempt + 1}/${config.maxRetries} after ${retryDelay}ms`
    );
    await delay(retryDelay);
  }

  // Return the last error response
  return lastResponse || {
    ok: false,
    code: 'UNKNOWN_ERROR',
    message: 'Request failed after all retries',
  };
}
