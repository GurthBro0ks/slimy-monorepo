/**
 * Chat API Client
 *
 * Client for interacting with the admin-api chat endpoint.
 * Supports sandbox mode when admin-api is not configured.
 */

import { adminApiClient } from './admin-client';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatReply {
  reply: string;
  usage?: {
    tokens?: number;
    costUsd?: number;
  };
}

export interface ChatError {
  ok: false;
  code: string;
  message: string;
  status?: number;
}

/**
 * Send a chat message and receive a reply.
 *
 * In sandbox mode (when admin-api is not configured), returns a local fake reply.
 * In live mode, calls the admin-api POST /api/chat endpoint.
 *
 * @param message - The user's message
 * @param history - Optional conversation history
 * @returns Promise<ChatReply> - The chat reply with optional usage info
 * @throws Error - If the request fails
 */
export async function sendChatMessage(
  message: string,
  history?: ChatMessage[]
): Promise<ChatReply> {
  // Sandbox mode: if admin-api not configured, return a local fake reply
  if (!adminApiClient.isConfigured()) {
    return {
      reply: 'Sandbox mode: admin-api is not configured, so this reply is generated locally in the web app.',
      usage: {
        tokens: 0,
        costUsd: 0,
      },
    };
  }

  try {
    // Live mode: POST to /api/chat via the admin API client
    const body = {
      message,
      history: history || [],
    };

    const response = await adminApiClient.post<ChatReply>('/api/chat', body);

    if (!response.ok) {
      // Handle error response
      const error = response as ChatError;
      throw new Error(error.message || 'Failed to send chat message');
    }

    return response.data;
  } catch (error) {
    console.error('[chat-api] Failed to send message:', error);

    // Fallback to local reply on error
    return {
      reply: 'There was an error reaching the chat service. Using local fallback response.',
      usage: {
        tokens: 0,
        costUsd: 0,
      },
    };
  }
}

/**
 * Check if the chat API is available.
 *
 * @returns boolean - True if admin-api is configured
 */
export function isChatApiAvailable(): boolean {
  return adminApiClient.isConfigured();
}
