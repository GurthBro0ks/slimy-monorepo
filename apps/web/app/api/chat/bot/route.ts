import { NextRequest, NextResponse } from "next/server";
import { isRateLimited } from "@/lib/rate-limiter";
import { apiClient } from "@/lib/api-client";

export const runtime = "nodejs";

const CHAT_LIMIT = 5; // 5 requests
const CHAT_WINDOW = 60 * 1000; // per minute

/**
 * SECURITY NOTE: This endpoint is intentionally public for embedded chat widgets
 * Rate limiting provides protection against abuse
 * TODO: Consider adding optional authentication with guild access validation
 */
export async function POST(request: NextRequest) {
  // SECURITY: Extract IP with fallbacks, normalize to prevent rate limit bypass
  // x-forwarded-for can contain multiple IPs (client, proxy1, proxy2, ...)
  // Use the leftmost IP as the client IP, but validate format
  let ip = "anonymous";
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // Take the first IP in the chain (the original client)
    const firstIp = forwardedFor.split(",")[0].trim();
    // Basic validation: check if it looks like an IP address
    if (/^[\d.:a-fA-F]+$/.test(firstIp)) {
      ip = firstIp;
    }
  } else {
    ip = request.headers.get("x-real-ip") || "anonymous";
  }

  const rateLimitKey = `chat:${ip}`;

  if (isRateLimited(rateLimitKey, CHAT_LIMIT, CHAT_WINDOW)) {
    const resetTime = new Date(Date.now() + CHAT_WINDOW).toISOString();
    return NextResponse.json(
      {
        ok: false,
        code: "RATE_LIMIT_EXCEEDED",
        message: "You have exceeded the chat limit. Please try again later.",
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
    const body: {
      prompt: string;
      guildId: string;
    } = await request.json();

    const response = await apiClient.post<{ ok: boolean; reply: string }>("/api/chat/bot", {
      prompt: body.prompt,
      guildId: body.guildId,
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          code: "CHAT_ERROR",
          message: response.message || "An error occurred while processing your request.",
        },
        { status: response.status || 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      reply: response.data.reply,
    });
  } catch (error) {
    console.error("Chat bot error:", error);
    return NextResponse.json(
      {
        ok: false,
        code: "CHAT_ERROR",
        message: "An error occurred while processing your request.",
      },
      { status: 500 }
    );
  }
}
