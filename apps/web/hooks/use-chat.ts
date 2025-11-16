'use client';

import { useState, useCallback, useEffect } from 'react';
import { Message, ChatSession } from '@/types/chat';
import { PersonalityMode } from '@/lib/personality-modes';
import { chatStorage } from '@/lib/chat/storage';
import { useAuth } from '@/lib/auth/context';

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

    let assistantMessageId: string | null = null;

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

    // Add placeholder assistant message for streaming
    assistantMessageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const placeholderMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      personalityMode: session.currentMode,
    };

    setSession(prev => ({
      ...prev,
      messages: [...prev.messages, placeholderMessage],
      updatedAt: Date.now(),
    }));

    // Retry logic for network/API failures
    let response;
    let retryCount = 0;
    const maxRetries = 2;

    while (retryCount <= maxRetries) {
      try {
        response = await fetch('/api/chat/message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: content,
            personalityMode: session.currentMode,
            conversationHistory: session.messages.filter(msg => msg.id !== placeholderMessage.id),
            userId: user?.id,
          }),
        });
        break; // Success, exit retry loop
      } catch (networkError) {
        retryCount++;
        if (retryCount <= maxRetries) {
          console.warn(`Network request failed (attempt ${retryCount}/${maxRetries + 1}), retrying...`);
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
          continue;
        }
        throw networkError;
      }
    }

    if (!response!.ok) {
      const errorData = await response!.json();

      // Don't retry on rate limit or auth errors
      if (errorData.code === 'RATE_LIMIT_EXCEEDED' || errorData.code === 'OPENAI_AUTH_ERROR') {
        throw new Error(errorData.error || 'Request failed');
      }

      // Retry on other errors
      if (retryCount < maxRetries && errorData.code !== 'INVALID_MESSAGE') {
        console.warn(`API request failed with ${errorData.code}, retrying...`);
        // Could implement retry logic here for specific error codes
      }

      throw new Error(errorData.error || 'Failed to send message');
    }

    // Handle streaming response
    const reader = response!.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No response stream available');
    }

    let fullContent = '';
    let isComplete = false;

    while (!isComplete) {
      const { done, value } = await reader.read();

      if (done) {
        isComplete = true;
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.trim());

      for (const line of lines) {
        try {
          const data = JSON.parse(line);

          if (data.type === 'chunk') {
            fullContent += data.content;

            // Update the assistant message with streaming content
            setSession(prev => ({
              ...prev,
              messages: prev.messages.map(msg =>
                msg.id === assistantMessageId
                  ? { ...msg, content: fullContent }
                  : msg
              ),
              updatedAt: Date.now(),
            }));
          } else if (data.type === 'complete') {
            // Update with final message
            setSession(prev => ({
              ...prev,
              messages: prev.messages.map(msg =>
                msg.id === assistantMessageId
                  ? data.message
                  : msg
              ),
              updatedAt: Date.now(),
            }));

            // Save assistant message to database if we have a conversation
            if (conversationIdToUse && user) {
              try {
                await chatStorage.saveMessage(conversationIdToUse, user.id, data.message);
              } catch (error) {
                console.error('Failed to save assistant message:', error);
                // Continue even if persistence fails
              }
            }

            isComplete = true;
            break;
          } else if (data.type === 'error') {
            throw new Error(data.error || 'Streaming error occurred');
          }
        } catch (parseError) {
          console.error('Failed to parse streaming data:', parseError, line);
        }
      }
    }
    } catch (err: any) {
      console.error('Send message error:', err);

      // Remove the placeholder message on error
      if (assistantMessageId) {
        setSession(prev => ({
          ...prev,
          messages: prev.messages.filter(msg => msg.id !== assistantMessageId),
          updatedAt: Date.now(),
        }));
      }

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
