# Slime Chat Implementation Plan

## Overview

This document outlines the comprehensive plan to implement a fully functional **Slime Chat** web interface with AI-powered conversations using personality modes, integrated with OpenAI API.

## Current State Analysis

### Existing Components
- ✅ Basic chat page UI (`app/chat/page.tsx`) - placeholder only
- ✅ Mock chat bot API endpoint (`app/api/chat/bot/route.ts`) - returns mock responses
- ✅ Chat actions utility (`lib/chat-actions.ts`) - defines action types
- ✅ Rate limiting system (`lib/rate-limiter.ts`) - ready to use
- ✅ Next.js 16 with TypeScript and Tailwind CSS
- ✅ UI components from shadcn/ui

### What's Missing
- ❌ Real AI integration with OpenAI API
- ❌ Interactive chat interface with message history
- ❌ Personality mode selection and management
- ❌ Message persistence (conversation history)
- ❌ Real-time message streaming
- ❌ User authentication integration
- ❌ Proper error handling and loading states

---

## Architecture Design

### 1. Personality Modes System

The chat will support multiple AI personality modes:

| Mode | Description | System Prompt Focus |
|------|-------------|-------------------|
| **Helpful** | Friendly and informative assistant | Provide clear, helpful answers |
| **Sarcastic** | Witty with a touch of sarcasm | Add humor while being helpful |
| **Professional** | Formal business communication | Corporate and precise language |
| **Creative** | Imaginative and expressive | Think outside the box |
| **Technical** | Developer-focused responses | Code examples and technical depth |

### 2. API Architecture

```
Frontend (React)
    ↓
Chat API Route (/api/chat/message)
    ↓
OpenAI API Integration
    ↓
Response with Personality Mode Applied
    ↓
Frontend Display
```

### 3. Data Flow

1. **User Input** → Chat interface captures message
2. **API Request** → POST to `/api/chat/message` with:
   - User message
   - Selected personality mode
   - Conversation history (last N messages)
3. **AI Processing** → OpenAI API processes with personality-specific system prompt
4. **Response** → Streamed back to frontend
5. **Display** → Message added to chat history

### 4. Database Schema (Session Storage)

For MVP, we'll use browser session storage:

```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  personalityMode: PersonalityMode;
}

interface ChatSession {
  id: string;
  messages: Message[];
  currentMode: PersonalityMode;
  createdAt: number;
  updatedAt: number;
}
```

---

## Implementation Phases

### Phase 1: Backend API Integration

**Files to Create:**
- `lib/openai-client.ts` - OpenAI API client wrapper
- `lib/personality-modes.ts` - Personality mode definitions and system prompts
- `types/chat.ts` - TypeScript interfaces for chat system

**Files to Modify:**
- `app/api/chat/bot/route.ts` → Rename to `app/api/chat/message/route.ts`
- Update to use real OpenAI API instead of mock responses

**Key Features:**
- OpenAI API integration with streaming support
- Personality mode system prompts
- Conversation history management (last 10 messages)
- Error handling and rate limiting
- Token usage tracking

### Phase 2: Frontend Chat Interface

**Files to Create:**
- `components/chat/chat-interface.tsx` - Main chat component
- `components/chat/message-list.tsx` - Message display component
- `components/chat/message-input.tsx` - Input field with send button
- `components/chat/personality-selector.tsx` - Mode selection dropdown
- `components/chat/typing-indicator.tsx` - Loading animation
- `hooks/use-chat.ts` - Custom hook for chat state management

**Files to Modify:**
- `app/chat/page.tsx` - Replace placeholder with full chat interface

**Key Features:**
- Real-time message display
- Auto-scroll to latest message
- Typing indicators
- Error states and retry logic
- Responsive design (mobile-friendly)
- Message timestamps
- Copy message functionality

### Phase 3: Enhanced Features

**Features to Add:**
- Message persistence (localStorage backup)
- Clear conversation button
- Export chat history
- Character/token counter
- Dark mode optimization
- Keyboard shortcuts (Enter to send, Shift+Enter for new line)
- Message editing (regenerate response)

### Phase 4: Testing & Optimization

**Testing:**
- Unit tests for API endpoints
- Integration tests for chat flow
- E2E tests for user interactions
- Performance testing (response times)

**Optimization:**
- Response streaming for better UX
- Caching for repeated queries
- Rate limiting per user/session
- Cost optimization (token usage)

---

## Detailed Implementation Steps

### Step 1: Set Up OpenAI Integration

**1.1 Create OpenAI Client Library**

File: `lib/openai-client.ts`

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_BASE,
});

export async function createChatCompletion(
  messages: Array<{ role: string; content: string }>,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
) {
  const response = await openai.chat.completions.create({
    model: options?.model || 'gpt-4',
    messages,
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
  const stream = await openai.chat.completions.create({
    model: options?.model || 'gpt-4',
    messages,
    temperature: options?.temperature || 0.7,
    max_tokens: options?.maxTokens || 1000,
    stream: true,
  });

  return stream;
}

export { openai };
```

**1.2 Create Personality Modes System**

File: `lib/personality-modes.ts`

```typescript
export type PersonalityMode = 'helpful' | 'sarcastic' | 'professional' | 'creative' | 'technical';

export interface PersonalityConfig {
  name: string;
  description: string;
  systemPrompt: string;
  temperature: number;
  icon: string;
}

export const personalityModes: Record<PersonalityMode, PersonalityConfig> = {
  helpful: {
    name: 'Helpful',
    description: 'Friendly and informative assistant',
    systemPrompt: 'You are a helpful and friendly AI assistant. Provide clear, accurate, and supportive answers. Be warm and encouraging in your responses.',
    temperature: 0.7,
    icon: '😊',
  },
  sarcastic: {
    name: 'Sarcastic',
    description: 'Witty with a touch of sarcasm',
    systemPrompt: 'You are a witty AI assistant with a sarcastic sense of humor. While being helpful, add clever remarks and playful sarcasm to your responses. Keep it light and fun.',
    temperature: 0.9,
    icon: '😏',
  },
  professional: {
    name: 'Professional',
    description: 'Formal business communication',
    systemPrompt: 'You are a professional business assistant. Use formal language, be precise and concise. Structure your responses in a clear, corporate manner.',
    temperature: 0.5,
    icon: '💼',
  },
  creative: {
    name: 'Creative',
    description: 'Imaginative and expressive',
    systemPrompt: 'You are a creative and imaginative AI assistant. Think outside the box, use vivid language, and provide innovative solutions. Be expressive and artistic in your responses.',
    temperature: 1.0,
    icon: '🎨',
  },
  technical: {
    name: 'Technical',
    description: 'Developer-focused responses',
    systemPrompt: 'You are a technical AI assistant for developers. Provide detailed technical explanations, code examples, and best practices. Use precise terminology and focus on implementation details.',
    temperature: 0.6,
    icon: '💻',
  },
};

export function getPersonalityConfig(mode: PersonalityMode): PersonalityConfig {
  return personalityModes[mode];
}
```

**1.3 Create Type Definitions**

File: `types/chat.ts`

```typescript
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
}

export interface ChatResponse {
  ok: boolean;
  message?: Message;
  error?: string;
  code?: string;
}
```

### Step 2: Update Chat API Endpoint

**2.1 Create New Message API Route**

File: `app/api/chat/message/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { isRateLimited } from "@/lib/rate-limiter";
import { createChatCompletion } from "@/lib/openai-client";
import { getPersonalityConfig, PersonalityMode } from "@/lib/personality-modes";
import { ChatRequest, Message } from "@/types/chat";

export const runtime = "nodejs";

const CHAT_LIMIT = 10; // 10 requests
const CHAT_WINDOW = 60 * 1000; // per minute

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "anonymous";
  const rateLimitKey = `chat:${ip}`;

  // Rate limiting
  if (isRateLimited(rateLimitKey, CHAT_LIMIT, CHAT_WINDOW)) {
    const resetTime = new Date(Date.now() + CHAT_WINDOW).toISOString();
    return NextResponse.json(
      {
        ok: false,
        code: "RATE_LIMIT_EXCEEDED",
        error: "You have exceeded the chat limit. Please try again later.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(CHAT_WINDOW / 1000),
          "X-RateLimit-Reset": resetTime,
        },
      }
    );
  }

  try {
    const body: ChatRequest = await request.json();
    const { message, personalityMode, conversationHistory } = body;

    // Validate input
    if (!message || !message.trim()) {
      return NextResponse.json(
        {
          ok: false,
          code: "INVALID_MESSAGE",
          error: "Message cannot be empty.",
        },
        { status: 400 }
      );
    }

    // Get personality configuration
    const personalityConfig = getPersonalityConfig(personalityMode || 'helpful');

    // Build messages for OpenAI
    const messages = [
      { role: 'system', content: personalityConfig.systemPrompt },
      // Include last 10 messages for context
      ...conversationHistory.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: 'user', content: message },
    ];

    // Call OpenAI API
    const aiResponse = await createChatCompletion(messages, {
      model: 'gpt-4',
      temperature: personalityConfig.temperature,
      maxTokens: 1000,
    });

    // Create response message
    const responseMessage: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: 'assistant',
      content: aiResponse.content || 'Sorry, I could not generate a response.',
      timestamp: Date.now(),
      personalityMode,
    };

    return NextResponse.json({
      ok: true,
      message: responseMessage,
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    
    // Handle specific OpenAI errors
    if (error?.status === 401) {
      return NextResponse.json(
        {
          ok: false,
          code: "OPENAI_AUTH_ERROR",
          error: "OpenAI API authentication failed.",
        },
        { status: 500 }
      );
    }

    if (error?.status === 429) {
      return NextResponse.json(
        {
          ok: false,
          code: "OPENAI_RATE_LIMIT",
          error: "OpenAI API rate limit exceeded. Please try again later.",
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        code: "CHAT_ERROR",
        error: "An error occurred while processing your request.",
      },
      { status: 500 }
    );
  }
}
```

### Step 3: Build Frontend Chat Interface

**3.1 Create Chat Hook**

File: `hooks/use-chat.ts`

```typescript
import { useState, useCallback, useEffect } from 'react';
import { Message, ChatSession } from '@/types/chat';
import { PersonalityMode } from '@/lib/personality-modes';

const STORAGE_KEY = 'slime-chat-session';

export function useChat() {
  const [session, setSession] = useState<ChatSession>(() => {
    // Load from localStorage if available
    if (typeof window !== 'undefined') {
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
      id: `session_${Date.now()}`,
      messages: [],
      currentMode: 'helpful' as PersonalityMode,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          personalityMode: session.currentMode,
          conversationHistory: session.messages,
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      // Add assistant message
      setSession(prev => ({
        ...prev,
        messages: [...prev.messages, data.message],
        updatedAt: Date.now(),
      }));
    } catch (err: any) {
      console.error('Send message error:', err);
      setError(err.message || 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  }, [session.currentMode, session.messages]);

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

  return {
    messages: session.messages,
    currentMode: session.currentMode,
    isLoading,
    error,
    sendMessage,
    setPersonalityMode,
    clearConversation,
  };
}
```

**3.2 Create Message Components**

File: `components/chat/message-bubble.tsx`

```typescript
'use client';

import { Message } from '@/types/chat';
import { cn } from '@/lib/utils';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        'flex w-full gap-3 p-4',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'group relative max-w-[80%] rounded-2xl px-4 py-3',
          isUser
            ? 'bg-neon-green text-zinc-900'
            : 'bg-zinc-800 text-zinc-100'
        )}
      >
        <p className="whitespace-pre-wrap break-words text-sm">
          {message.content}
        </p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-xs opacity-60">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
          <button
            onClick={handleCopy}
            className="opacity-0 transition-opacity group-hover:opacity-100"
            title="Copy message"
          >
            {copied ? (
              <Check className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
```

File: `components/chat/personality-selector.tsx`

```typescript
'use client';

import { PersonalityMode, personalityModes } from '@/lib/personality-modes';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PersonalitySelectorProps {
  currentMode: PersonalityMode;
  onModeChange: (mode: PersonalityMode) => void;
  disabled?: boolean;
}

export function PersonalitySelector({
  currentMode,
  onModeChange,
  disabled = false,
}: PersonalitySelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(personalityModes).map(([key, config]) => {
        const mode = key as PersonalityMode;
        const isActive = mode === currentMode;

        return (
          <Button
            key={mode}
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            onClick={() => onModeChange(mode)}
            disabled={disabled}
            className={cn(
              'transition-all',
              isActive && 'bg-neon-green text-zinc-900 hover:bg-neon-green/90'
            )}
          >
            <span className="mr-2">{config.icon}</span>
            {config.name}
          </Button>
        );
      })}
    </div>
  );
}
```

File: `components/chat/message-input.tsx`

```typescript
'use client';

import { useState, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, disabled = false }: MessageInputProps) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex gap-2">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message... (Shift+Enter for new line)"
        disabled={disabled}
        className="flex-1 resize-none rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-neon-green focus:outline-none focus:ring-1 focus:ring-neon-green disabled:opacity-50"
        rows={3}
      />
      <Button
        onClick={handleSend}
        disabled={disabled || !input.trim()}
        size="icon"
        className="h-auto bg-neon-green text-zinc-900 hover:bg-neon-green/90"
      >
        <Send className="h-5 w-5" />
      </Button>
    </div>
  );
}
```

**3.3 Create Main Chat Interface**

File: `components/chat/chat-interface.tsx`

```typescript
'use client';

import { useChat } from '@/hooks/use-chat';
import { MessageBubble } from './message-bubble';
import { MessageInput } from './message-input';
import { PersonalitySelector } from './personality-selector';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Callout } from '@/components/ui/callout';

export function ChatInterface() {
  const {
    messages,
    currentMode,
    isLoading,
    error,
    sendMessage,
    setPersonalityMode,
    clearConversation,
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex h-[calc(100vh-200px)] flex-col gap-4">
      {/* Personality Mode Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-zinc-400">Personality Mode</h3>
          <PersonalitySelector
            currentMode={currentMode}
            onModeChange={setPersonalityMode}
            disabled={isLoading}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={clearConversation}
          disabled={isLoading || messages.length === 0}
          className="border-red-500/30 text-red-500 hover:bg-red-500/10"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Clear Chat
        </Button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto rounded-2xl border border-emerald-500/30 bg-zinc-900/40">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center p-8 text-center">
            <div>
              <h3 className="text-lg font-medium text-zinc-300">
                Start a conversation
              </h3>
              <p className="mt-2 text-sm text-zinc-500">
                Choose a personality mode and send a message to begin chatting with Slimy.ai
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex justify-start p-4">
                <div className="flex items-center gap-2 rounded-2xl bg-zinc-800 px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-neon-green" />
                  <span className="text-sm text-zinc-400">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <Callout variant="error" className="text-sm">
          {error}
        </Callout>
      )}

      {/* Message Input */}
      <MessageInput onSend={sendMessage} disabled={isLoading} />
    </div>
  );
}
```

**3.4 Update Chat Page**

File: `app/chat/page.tsx`

```typescript
import { MessageSquare } from "lucide-react";
import { ChatInterface } from "@/components/chat/chat-interface";

export default function ChatPage() {
  return (
    <div className="container px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center gap-3">
          <MessageSquare className="h-10 w-10 text-neon-green" />
          <div>
            <h1 className="text-4xl font-bold">Slime Chat</h1>
            <p className="text-muted-foreground">
              AI-powered conversations with personality modes
            </p>
          </div>
        </div>

        <ChatInterface />
      </div>
    </div>
  );
}
```

### Step 4: Install Dependencies

**4.1 Install OpenAI SDK**

```bash
pnpm add openai
```

**4.2 Update Environment Variables**

Add to `.env.local`:
```
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_API_BASE=https://api.openai.com/v1
```

### Step 5: Testing

**5.1 Manual Testing Checklist**

- [ ] Chat interface loads without errors
- [ ] Can send messages and receive responses
- [ ] Personality modes change response style
- [ ] Rate limiting works (10 messages per minute)
- [ ] Error handling displays properly
- [ ] Messages persist in localStorage
- [ ] Clear conversation works
- [ ] Copy message functionality works
- [ ] Responsive design on mobile
- [ ] Keyboard shortcuts work (Enter to send)

**5.2 Create Unit Tests**

File: `tests/unit/chat-api.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { POST } from '@/app/api/chat/message/route';
import { NextRequest } from 'next/server';

describe('Chat API', () => {
  it('should return error for empty message', async () => {
    const request = new NextRequest('http://localhost/api/chat/message', {
      method: 'POST',
      body: JSON.stringify({
        message: '',
        personalityMode: 'helpful',
        conversationHistory: [],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.ok).toBe(false);
    expect(data.code).toBe('INVALID_MESSAGE');
  });

  // Add more tests...
});
```

---

## Deployment Steps

### 1. Environment Setup

1. Set `OPENAI_API_KEY` in production environment
2. Set `OPENAI_API_BASE` if using custom endpoint
3. Verify rate limiting configuration

### 2. Build and Deploy

```bash
# Install dependencies
pnpm install

# Build the application
pnpm build

# Run production server
pnpm start
```

### 3. Post-Deployment Verification

- [ ] Chat interface accessible at `/chat`
- [ ] API endpoint responding correctly
- [ ] Rate limiting active
- [ ] Error logging working
- [ ] Performance metrics acceptable (<2s response time)

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Response Time | <2 seconds | Average API response time |
| Uptime | >99% | API availability |
| Error Rate | <1% | Failed requests / total requests |
| User Satisfaction | >4.5/5 | User feedback ratings |
| Token Efficiency | <1000 tokens/msg | Average tokens per message |

---

## Future Enhancements

### Phase 2 Features
- [ ] Message streaming (real-time token display)
- [ ] Voice input/output
- [ ] Image upload and analysis
- [ ] Conversation export (PDF, JSON)
- [ ] User authentication integration
- [ ] Conversation sharing
- [ ] Custom personality modes
- [ ] Multi-language support

### Phase 3 Features
- [ ] Database persistence (PostgreSQL)
- [ ] User conversation history
- [ ] Analytics dashboard
- [ ] A/B testing for personalities
- [ ] Cost tracking per user
- [ ] Advanced rate limiting (per user tier)

---

## Cost Estimation

### OpenAI API Costs (GPT-4)

| Usage Level | Messages/Day | Est. Cost/Month |
|-------------|--------------|-----------------|
| Low | 100 | $15 |
| Medium | 500 | $75 |
| High | 2000 | $300 |

**Optimization Strategies:**
- Use GPT-3.5-turbo for simple queries
- Implement caching for common questions
- Limit conversation history to 10 messages
- Set max tokens to 1000

---

## Troubleshooting Guide

### Common Issues

**Issue: "OpenAI API authentication failed"**
- **Solution**: Verify `OPENAI_API_KEY` is set correctly in environment variables

**Issue: "Rate limit exceeded"**
- **Solution**: Wait 60 seconds or implement user-specific rate limiting

**Issue: "Messages not persisting"**
- **Solution**: Check browser localStorage is enabled and not full

**Issue: "Slow response times"**
- **Solution**: Consider using streaming responses or GPT-3.5-turbo

---

## Maintenance

### Regular Tasks
- Monitor API usage and costs
- Review error logs weekly
- Update personality prompts based on feedback
- Optimize token usage
- Update OpenAI SDK when new versions release

### Security
- Rotate API keys quarterly
- Monitor for abuse patterns
- Implement user authentication
- Add content filtering for inappropriate requests

---

## Conclusion

This implementation plan provides a complete roadmap for building a fully functional Slime Chat interface with AI-powered conversations. The phased approach ensures systematic development, testing, and deployment while maintaining code quality and user experience.

**Estimated Timeline:**
- Phase 1 (Backend): 2-3 days
- Phase 2 (Frontend): 3-4 days
- Phase 3 (Enhancements): 2-3 days
- Phase 4 (Testing): 1-2 days

**Total: 8-12 days for complete implementation**
