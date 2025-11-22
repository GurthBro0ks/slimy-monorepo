import { NextRequest } from 'next/server';
import { apiClient } from '@/lib/api-client';
import { apiHandler } from '@/lib/api/handler';
import { ValidationApiError } from '@/lib/api/errors';

interface ChatHistoryResponse {
  messages: unknown[];
}

export const GET = apiHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const guildId = searchParams.get('guildId');
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  if (!guildId) {
    throw new ValidationApiError('Guild ID is required');
  }

  const response = await apiClient.getOrThrow<ChatHistoryResponse>(`/api/chat/${guildId}/history?limit=${limit}`);
  return { body: { messages: response.data.messages } };
});

export const POST = apiHandler(async (request: NextRequest) => {
  const body = await request.json();
  const { conversationId, message } = body;

  if (!conversationId || !message) {
    throw new ValidationApiError('conversationId and message are required');
  }

  await apiClient.postOrThrow('/api/chat/messages', {
    conversationId,
    message,
  });

  return { body: { ok: true } };
});
