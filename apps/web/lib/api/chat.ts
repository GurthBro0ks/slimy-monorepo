/**
 * Chat API Client
 *
 * Provides a simple interface for chat interactions with the admin-api.
 * Supports both live mode (admin-api) and sandbox mode (local fallback).
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

/**
 * Send a chat message and get a reply
 *
 * @param message - The user's message
 * @param history - Optional conversation history
 * @returns Promise with the reply and usage info
 *
 * Behavior:
 * - Sandbox mode: Returns a local placeholder reply when admin-api is not configured
 * - Live mode: Calls POST /api/chat on the admin-api backend
 */
export async function sendChatMessage(
  message: string,
  history?: ChatMessage[],
): Promise<ChatReply> {
  // Sandbox mode: admin-api not configured
  if (!adminApiClient.isConfigured()) {
    console.log('[chat] Sandbox mode: admin-api not configured, using local fallback');
    return {
      reply: 'Sandbox mode: admin-api is not configured, so this reply is generated locally in the web app.',
    };
  }

  try {
    // Live mode: POST to /api/chat via admin-api
    const body = { message, history };

    const response = await adminApiClient.post<{ ok: boolean; reply: string; usage?: { tokens?: number; costUsd?: number } }>(
      '/api/chat',
      body
    );

    // Handle error responses
    if (!response.ok) {
      console.error('[chat] API error:', response);
      throw new Error(response.message || 'Failed to send chat message');
    }

    // Extract reply and usage from the response data
    return {
      reply: response.data.reply,
      usage: response.data.usage,
    };

  } catch (error) {
    console.error('[chat] Failed to send message:', error);

    // Provide a fallback response on error
    return {
      reply: 'There was an error reaching the chat service. Using local fallback response: ' +
            'The chat API is currently unavailable. Please try again later.',
    };
  }
}

/**
 * Check if the chat API is configured and available
 */
export function isChatApiConfigured(): boolean {
  return adminApiClient.isConfigured();
}
