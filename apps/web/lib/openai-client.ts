import OpenAI from 'openai';
import { config } from '@/lib/config';

let openaiInstance: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!openaiInstance) {
    const { apiKey, apiBase } = config.openai;
    if (!apiKey) {
      throw new Error('Missing credentials. Please set the `OPENAI_API_KEY` environment variable.');
    }
    openaiInstance = new OpenAI({
      apiKey,
      baseURL: apiBase,
    });
  }
  return openaiInstance;
}

export async function createChatCompletion(
  messages: Array<{ role: string; content: string }>,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
) {
  const openai = getOpenAIClient();
  const response = await openai.chat.completions.create({
    model: options?.model || 'gpt-4',
    messages: messages as any,
    temperature: options?.temperature || 0.7,
    max_tokens: options?.maxTokens || 1000,
    stream: false,
  });

  return response.choices[0].message;
}

export async function createStreamingChatCompletion(
  messages: Array<{ role: string; content: string }>,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
) {
  const openai = getOpenAIClient();
  const stream = await openai.chat.completions.create({
    model: options?.model || 'gpt-4',
    messages: messages as any,
    temperature: options?.temperature || 0.7,
    max_tokens: options?.maxTokens || 1000,
    stream: true,
  });

  return stream;
}

export function getOpenAI() {
  return openaiInstance ? getOpenAIClient() : null;
}
