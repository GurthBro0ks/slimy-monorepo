import { NextRequest, NextResponse } from "next/server";
import { isRateLimited } from "@/lib/rate-limiter";
import { createStreamingChatCompletion } from "@/lib/openai-client";
import { getPersonalityConfig, PersonalityMode } from "@/lib/personality-modes";
import { ChatRequest, Message } from "@/types/chat";

export const runtime = "nodejs";

const CHAT_LIMIT = 10; // 10 requests
const CHAT_WINDOW = 60 * 1000; // per minute

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, personalityMode, conversationHistory, userId } = body;

    // Rate limiting - use userId if available, otherwise fall back to IP
    const rateLimitKey = userId ? `chat:user:${userId}` : `chat:ip:${request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "anonymous"}`;

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

    // Create response message ID
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Set up streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
    // Call OpenAI API with streaming and retry logic
    let aiStream;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount <= maxRetries) {
      try {
        aiStream = await createStreamingChatCompletion(messages, {
          model: 'gpt-4',
          temperature: personalityConfig.temperature,
          maxTokens: 1000,
        });
        break; // Success, exit retry loop
      } catch (error: any) {
        retryCount++;

        // Don't retry on authentication errors
        if (error?.status === 401) {
          throw error;
        }

        // Don't retry on rate limit errors
        if (error?.status === 429) {
          throw error;
        }

        // Retry on other errors if we haven't exceeded max retries
        if (retryCount <= maxRetries) {
          console.warn(`OpenAI API call failed (attempt ${retryCount}/${maxRetries + 1}), retrying...`, error.message);
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
          continue;
        }

        // Max retries exceeded
        throw error;
      }
    }

    let fullContent = '';

    // Process the stream
    for await (const chunk of aiStream!) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullContent += content;

        // Send chunk to client
        const data = JSON.stringify({
          type: 'chunk',
          content: content,
          id: messageId,
        }) + '\n';

        controller.enqueue(new TextEncoder().encode(data));
      }
    }

          // Send completion message
          const completionData = JSON.stringify({
            type: 'complete',
            message: {
              id: messageId,
              role: 'assistant',
              content: fullContent,
              timestamp: Date.now(),
              personalityMode,
            } as Message,
          }) + '\n';

          controller.enqueue(new TextEncoder().encode(completionData));
          controller.close();

        } catch (error: any) {
          console.error("Streaming error:", error);

          const errorData = JSON.stringify({
            type: 'error',
            code: 'STREAM_ERROR',
            error: 'An error occurred during streaming.',
          }) + '\n';

          controller.enqueue(new TextEncoder().encode(errorData));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
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
