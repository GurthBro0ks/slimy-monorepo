'use client';

import { useState, useCallback, useEffect } from 'react';
import { Message, ChatSession } from '@/types/chat';
import { PersonalityMode } from '@/lib/personality-modes';
import { chatStorage } from '@/lib/chat/storage';
import { useAuth } from '@/lib/auth/context';
import { sendChatMessage as sendChatMessageApi, type ChatMessage as ApiChatMessage } from '@/lib/api/chat';

const STORAGE_KEY = 'slime-chat-session';

export function useChat(conversationId?: string) {
  const { user } = useAuth();
  const [session, setSession] = useState<ChatSession>(() => {
    // Load from localStorage if available (for backward compatibility)
    if (typeof window !== 'undefined' && !conversationId) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse saved session:', e);
        }
      }
    }

    // Default session
    return {
      id: conversationId || `session_${Date.now()}`,
      messages: [],
      currentMode: 'helpful' as PersonalityMode,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(conversationId || null);

  // Save to localStorage whenever session changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    }
  }, [session]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Create conversation if needed
      let conversationIdToUse = currentConversationId;
      if (!conversationIdToUse && user) {
        try {
          const title = chatStorage.generateTitleFromMessage(content);
          conversationIdToUse = await chatStorage.createConversation(
            user.id,
            title,
            session.currentMode
          );
          setCurrentConversationId(conversationIdToUse);
        } catch (error) {
          console.error('Failed to create conversation:', error);
          // Continue without conversation persistence for now
        }
      }

      // Add user message
      const userMessage: Message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role: 'user',
        content,
        timestamp: Date.now(),
        personalityMode: session.currentMode,
      };

      setSession(prev => ({
        ...prev,
        messages: [...prev.messages, userMessage],
        updatedAt: Date.now(),
      }));

      // Save user message to database if we have a conversation
      if (conversationIdToUse && user) {
        try {
          await chatStorage.saveMessage(conversationIdToUse, user.id, userMessage);
        } catch (error) {
          console.error('Failed to save user message:', error);
          // Continue with chat even if persistence fails
        }
      }

      // Prepare conversation history for API call
      const history: ApiChatMessage[] = session.messages.map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      }));

      // Call the chat API (uses admin-api when configured, falls back to sandbox mode)
      const chatReply = await sendChatMessageApi(content, history);

      // Create assistant message from the reply
      const assistantMessage: Message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: chatReply.reply,
        timestamp: Date.now(),
        personalityMode: session.currentMode,
      };

      // Add assistant message to session
      setSession(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        updatedAt: Date.now(),
      }));

      // Save assistant message to database if we have a conversation
      if (conversationIdToUse && user) {
        try {
          await chatStorage.saveMessage(conversationIdToUse, user.id, assistantMessage);
        } catch (error) {
          console.error('Failed to save assistant message:', error);
          // Continue even if persistence fails
        }
      }

    } catch (err: any) {
      console.error('Send message error:', err);

      // Add an error message from the assistant
      const errorMessage: Message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: 'There was an error reaching the chat service. Please try again.',
        timestamp: Date.now(),
        personalityMode: session.currentMode,
      };

      setSession(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage],
        updatedAt: Date.now(),
      }));

      setError(err.message || 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  }, [session.currentMode, session.messages, currentConversationId, user]);

  const setPersonalityMode = useCallback((mode: PersonalityMode) => {
    setSession(prev => ({
      ...prev,
      currentMode: mode,
      updatedAt: Date.now(),
    }));
  }, []);

  const clearConversation = useCallback(() => {
    setSession({
      id: `session_${Date.now()}`,
      messages: [],
      currentMode: session.currentMode,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    setError(null);
  }, [session.currentMode]);

  const loadConversation = useCallback(async (conversationId: string) => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const conversation = await chatStorage.getConversation(conversationId, user.id);
      if (conversation) {
        setSession({
          id: conversation.id,
          messages: conversation.messages,
          currentMode: conversation.personalityMode,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
        });
        setCurrentConversationId(conversationId);
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
      setError('Failed to load conversation');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  return {
    messages: session.messages,
    currentMode: session.currentMode,
    isLoading,
    error,
    conversationId: currentConversationId,
    sendMessage,
    setPersonalityMode,
    clearConversation,
    loadConversation,
  };
}
