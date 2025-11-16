import { Message, ChatSession } from '@/types/chat';
import { PersonalityMode } from '@/lib/personality-modes';
import { apiClient } from '@/lib/api-client';

export interface Conversation {
  id: string;
  title: string | null;
  personalityMode: PersonalityMode;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
}

export interface ConversationSummary {
  id: string;
  title: string | null;
  personalityMode: PersonalityMode;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
}

/**
 * Chat storage service for managing conversations and messages
 */
export class ChatStorage {
  private static instance: ChatStorage;

  public static getInstance(): ChatStorage {
    if (!ChatStorage.instance) {
      ChatStorage.instance = new ChatStorage();
    }
    return ChatStorage.instance;
  }

  /**
   * Create a new conversation
   */
  async createConversation(
    userId: string,
    title?: string,
    personalityMode: PersonalityMode = 'helpful'
  ): Promise<string> {
    const response = await apiClient.post<{ conversationId: string }>('/api/chat/conversations', {
      title,
      personalityMode,
    });

    if (!response.ok) {
      throw new Error(response.message || 'Failed to create conversation');
    }

    return response.data.conversationId;
  }

  /**
   * Save a message to a conversation
   */
  async saveMessage(
    conversationId: string,
    userId: string,
    message: Message
  ): Promise<void> {
    const response = await apiClient.post('/api/chat/messages', {
      conversationId,
      message,
    });

    if (!response.ok) {
      throw new Error(response.message || 'Failed to save message');
    }
  }

  /**
   * Get all conversations for a user
   */
  async getConversations(userId: string, limit = 20): Promise<ConversationSummary[]> {
    const response = await apiClient.get<{
      conversations: Array<{
        id: string;
        title: string | null;
        personalityMode: PersonalityMode;
        createdAt: string;
        updatedAt: string;
        messageCount: number;
      }>
    }>(`/api/chat/conversations?limit=${limit}`);

    if (!response.ok) {
      throw new Error(response.message || 'Failed to load conversations');
    }

    return response.data.conversations.map((conv) => ({
      id: conv.id,
      title: conv.title,
      personalityMode: conv.personalityMode,
      createdAt: new Date(conv.createdAt).getTime(),
      updatedAt: new Date(conv.updatedAt).getTime(),
      messageCount: conv.messageCount,
    }));
  }

  /**
   * Get a full conversation with all messages
   */
  async getConversation(conversationId: string, userId: string): Promise<Conversation | null> {
    const response = await apiClient.get<{
      conversation: {
        id: string;
        title: string | null;
        personalityMode: PersonalityMode;
        createdAt: string;
        updatedAt: string;
        messages: Array<{
          id: string;
          role: 'user' | 'assistant' | 'system';
          content: string;
          personalityMode?: PersonalityMode;
          createdAt: string;
        }>;
      }
    }>(`/api/chat/conversations/${conversationId}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(response.message || 'Failed to load conversation');
    }

    const conv = response.data.conversation;

    return {
      id: conv.id,
      title: conv.title,
      personalityMode: conv.personalityMode,
      createdAt: new Date(conv.createdAt).getTime(),
      updatedAt: new Date(conv.updatedAt).getTime(),
      messages: conv.messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.createdAt).getTime(),
        personalityMode: msg.personalityMode,
      })),
    };
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string, userId: string): Promise<void> {
    const response = await apiClient.delete(`/api/chat/conversations/${conversationId}`);

    if (!response.ok) {
      throw new Error(response.message || 'Failed to delete conversation');
    }
  }

  /**
   * Update conversation title
   */
  async updateConversationTitle(
    conversationId: string,
    userId: string,
    title: string
  ): Promise<void> {
    const response = await apiClient.patch(`/api/chat/conversations/${conversationId}`, {
      title,
    });

    if (!response.ok) {
      throw new Error(response.message || 'Failed to update conversation title');
    }
  }

  /**
   * Generate a title for a conversation based on the first user message
   */
  generateTitleFromMessage(message: string): string {
    const words = message.trim().split(/\s+/);
    const title = words.slice(0, 6).join(' ');
    return title.length < message.length ? `${title}...` : title;
  }

  /**
   * Migrate a localStorage session to database storage
   */
  async migrateSessionToDatabase(
    session: ChatSession,
    userId: string
  ): Promise<string | null> {
    if (!session.messages.length) {
      return null;
    }

    try {
      // Create conversation
      const title = session.messages[0]?.content
        ? this.generateTitleFromMessage(session.messages[0].content)
        : null;

      const conversationId = await this.createConversation(
        userId,
        title ?? undefined,
        session.currentMode
      );

      // Save all messages
      for (const message of session.messages) {
        await this.saveMessage(conversationId, userId, message);
      }

      return conversationId;
    } catch (error) {
      console.error('Failed to migrate session to database:', error);
      return null;
    }
  }
}

// Export singleton instance
export const chatStorage = ChatStorage.getInstance();
