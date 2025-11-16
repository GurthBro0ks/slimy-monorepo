import { PersonalityMode } from '@/lib/personality-modes';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  personalityMode?: PersonalityMode;
}

export interface ChatSession {
  id: string;
  messages: Message[];
  currentMode: PersonalityMode;
  createdAt: number;
  updatedAt: number;
}

export interface ChatRequest {
  message: string;
  personalityMode: PersonalityMode;
  conversationHistory: Message[];
  userId?: string;
}

export interface ChatResponse {
  ok: boolean;
  message?: Message;
  error?: string;
  code?: string;
}
