import { createChatCompletion, createStreamingChatCompletion } from '@/lib/openai-client';
import { Message } from '@/types/chat';
import { PersonalityMode, getPersonalityConfig } from '@/lib/personality-modes';

export interface ChatOptions {
  personalityMode?: PersonalityMode;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

type StreamingResponse = Awaited<ReturnType<typeof createStreamingChatCompletion>>;

export interface StreamingChatResult {
  stream: StreamingResponse;
  messageId: string;
}

/**
 * Generate a chat completion for a conversation
 */
export async function generateChatResponse(
  userMessage: string,
  conversationHistory: Message[],
  options: ChatOptions = {}
): Promise<Message> {
  const { personalityMode = 'helpful', model = 'gpt-4', temperature, maxTokens = 1000 } = options;

  // Get personality configuration
  const personalityConfig = getPersonalityConfig(personalityMode);

  // Build messages for OpenAI
  const messages = [
    { role: 'system', content: personalityConfig.systemPrompt },
    // Include last 10 messages for context
    ...conversationHistory.slice(-10).map(msg => ({
      role: msg.role,
      content: msg.content,
    })),
    { role: 'user', content: userMessage },
  ];

  // Call OpenAI API
  const aiResponse = await createChatCompletion(messages, {
    model,
    temperature: temperature ?? personalityConfig.temperature,
    maxTokens,
  });

  // Create response message
  const responseMessage: Message = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    role: 'assistant',
    content: aiResponse.content || 'Sorry, I could not generate a response.',
    timestamp: Date.now(),
    personalityMode,
  };

  return responseMessage;
}

/**
 * Generate a streaming chat completion for real-time responses
 */
export async function generateStreamingChatResponse(
  userMessage: string,
  conversationHistory: Message[],
  options: ChatOptions = {}
): Promise<StreamingChatResult> {
  const { personalityMode = 'helpful', model = 'gpt-4', temperature, maxTokens = 1000 } = options;

  // Get personality configuration
  const personalityConfig = getPersonalityConfig(personalityMode);

  // Build messages for OpenAI
  const messages = [
    { role: 'system', content: personalityConfig.systemPrompt },
    // Include last 10 messages for context
    ...conversationHistory.slice(-10).map(msg => ({
      role: msg.role,
      content: msg.content,
    })),
    { role: 'user', content: userMessage },
  ];

  // Create response message ID
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Call OpenAI API with streaming
  const stream = await createStreamingChatCompletion(messages, {
    model,
    temperature: temperature ?? personalityConfig.temperature,
    maxTokens,
  });

  return {
    stream,
    messageId,
  };
}

/**
 * Create a complete message from streaming chunks
 */
export function createMessageFromStream(
  messageId: string,
  fullContent: string,
  personalityMode: PersonalityMode
): Message {
  return {
    id: messageId,
    role: 'assistant',
    content: fullContent,
    timestamp: Date.now(),
    personalityMode,
  };
}

/**
 * Validate chat input
 */
export function validateChatInput(message: string): { valid: boolean; error?: string } {
  if (!message || !message.trim()) {
    return { valid: false, error: 'Message cannot be empty.' };
  }

  if (message.length > 10000) {
    return { valid: false, error: 'Message is too long. Please keep it under 10,000 characters.' };
  }

  return { valid: true };
}
