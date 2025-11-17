/**
 * OpenAI Client with Streaming and Retry Logic
 *
 * Provides a robust OpenAI client with:
 * - Streaming support for real-time responses
 * - Exponential backoff retry logic
 * - Function calling support
 * - Error handling
 */

import OpenAI from 'openai';
import type { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat/completions';

/**
 * Retry configuration
 */
interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
};

/**
 * Options for askOpenAI
 */
export interface AskOpenAIOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  retryConfig?: Partial<RetryConfig>;
  signal?: AbortSignal;
}

/**
 * Singleton OpenAI client instance
 */
let openaiClient: OpenAI | null = null;

/**
 * Get or create OpenAI client
 */
export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'Missing OPENAI_API_KEY environment variable. Please set it to use OpenAI features.'
      );
    }

    openaiClient = new OpenAI({
      apiKey,
      baseURL: process.env.OPENAI_API_BASE,
      timeout: 60000, // 60 second timeout
      maxRetries: 0, // We handle retries ourselves
    });
  }

  return openaiClient;
}

/**
 * Calculate exponential backoff delay
 */
function calculateBackoffDelay(attempt: number, config: RetryConfig): number {
  const exponentialDelay = config.baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 1000; // Add jitter to prevent thundering herd
  return Math.min(exponentialDelay + jitter, config.maxDelay);
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: any): boolean {
  // Retry on network errors, rate limits, and server errors
  if (error?.status) {
    const status = error.status;
    // Retry on rate limits (429), server errors (500+), and timeout (408)
    return status === 429 || status === 408 || status >= 500;
  }

  // Retry on network errors
  if (error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT' || error?.code === 'ENOTFOUND') {
    return true;
  }

  return false;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Ask OpenAI with streaming response
 *
 * @param messages - Array of chat messages
 * @param functions - Optional array of function definitions for function calling
 * @param options - Configuration options
 * @returns Async iterable stream of chat completion chunks
 *
 * @example
 * ```ts
 * const stream = await askOpenAI([
 *   { role: 'user', content: 'Hello!' }
 * ]);
 *
 * for await (const chunk of stream) {
 *   const content = chunk.choices[0]?.delta?.content;
 *   if (content) {
 *     process.stdout.write(content);
 *   }
 * }
 * ```
 */
export async function askOpenAI(
  messages: ChatCompletionMessageParam[],
  functions?: ChatCompletionTool[],
  options: AskOpenAIOptions = {}
): Promise<AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>> {
  const client = getOpenAIClient();
  const retryConfig: RetryConfig = {
    ...DEFAULT_RETRY_CONFIG,
    ...options.retryConfig,
  };

  let lastError: Error | null = null;

  // Retry loop with exponential backoff
  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      // Check if request was aborted
      if (options.signal?.aborted) {
        throw new Error('Request aborted');
      }

      const stream = await client.chat.completions.create({
        model: options.model || 'gpt-4',
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens,
        stream: true,
        tools: functions,
      });

      return stream;
    } catch (error: any) {
      lastError = error;

      // Don't retry if request was aborted
      if (options.signal?.aborted || error.message === 'Request aborted') {
        throw error;
      }

      // Don't retry on non-retryable errors
      if (!isRetryableError(error)) {
        throw error;
      }

      // Don't retry if we've exhausted attempts
      if (attempt >= retryConfig.maxRetries) {
        break;
      }

      // Calculate backoff delay
      const delay = calculateBackoffDelay(attempt, retryConfig);
      console.warn(
        `[openai-client] Attempt ${attempt + 1}/${retryConfig.maxRetries + 1} failed. ` +
        `Retrying in ${Math.round(delay)}ms... Error: ${error.message}`
      );

      // Wait before retrying
      await sleep(delay);
    }
  }

  // All retries exhausted
  throw new Error(
    `OpenAI request failed after ${retryConfig.maxRetries + 1} attempts. ` +
    `Last error: ${lastError?.message || 'Unknown error'}`
  );
}

/**
 * Ask OpenAI without streaming (returns complete response)
 *
 * @param messages - Array of chat messages
 * @param functions - Optional array of function definitions
 * @param options - Configuration options
 * @returns Complete chat completion response
 */
export async function askOpenAINonStreaming(
  messages: ChatCompletionMessageParam[],
  functions?: ChatCompletionTool[],
  options: AskOpenAIOptions = {}
): Promise<OpenAI.Chat.Completions.ChatCompletion> {
  const client = getOpenAIClient();
  const retryConfig: RetryConfig = {
    ...DEFAULT_RETRY_CONFIG,
    ...options.retryConfig,
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      if (options.signal?.aborted) {
        throw new Error('Request aborted');
      }

      const response = await client.chat.completions.create({
        model: options.model || 'gpt-4',
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens,
        stream: false,
        tools: functions,
      });

      return response;
    } catch (error: any) {
      lastError = error;

      if (options.signal?.aborted || error.message === 'Request aborted') {
        throw error;
      }

      if (!isRetryableError(error)) {
        throw error;
      }

      if (attempt >= retryConfig.maxRetries) {
        break;
      }

      const delay = calculateBackoffDelay(attempt, retryConfig);
      console.warn(
        `[openai-client] Attempt ${attempt + 1}/${retryConfig.maxRetries + 1} failed. ` +
        `Retrying in ${Math.round(delay)}ms... Error: ${error.message}`
      );

      await sleep(delay);
    }
  }

  throw new Error(
    `OpenAI request failed after ${retryConfig.maxRetries + 1} attempts. ` +
    `Last error: ${lastError?.message || 'Unknown error'}`
  );
}

/**
 * Helper to collect streaming response into a single string
 *
 * @param stream - Async iterable stream from askOpenAI
 * @returns Complete response text
 */
export async function collectStreamingResponse(
  stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>
): Promise<string> {
  let fullResponse = '';

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      fullResponse += content;
    }
  }

  return fullResponse;
}
