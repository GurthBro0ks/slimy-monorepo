import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api-client';

interface ChatHistoryResponse {
  messages: unknown[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const guildId = searchParams.get('guildId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!guildId) {
      return NextResponse.json(
        { error: 'Guild ID is required' },
        { status: 400 }
      );
    }

    // Proxy to admin API chat history
    const response = await apiClient.get<ChatHistoryResponse>(`/api/chat/${guildId}/history?limit=${limit}`);

    if (!response.ok) {
      return NextResponse.json(
        { error: response.message || 'Failed to fetch messages' },
        { status: response.status || 500 }
      );
    }

    return NextResponse.json({ messages: response.data.messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, message } = body;

    if (!conversationId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Proxy to admin API chat messages
    const response = await apiClient.post('/api/chat/messages', {
      conversationId,
      message,
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: response.message || 'Failed to send message' },
        { status: response.status || 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
