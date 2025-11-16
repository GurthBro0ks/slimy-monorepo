import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server";
import { chatStorage } from "@/lib/chat/storage";

export const runtime = "nodejs";

// GET /api/chat/conversations - Get user's conversations
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || user.id;
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 100);

    // Security check: users can only access their own conversations
    if (userId !== user.id && !user.roles?.includes('admin')) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const conversations = await chatStorage.getConversations(userId, limit);

    return NextResponse.json({
      ok: true,
      conversations,
    });
  } catch (error: any) {
    console.error("[conversations] GET error:", error);
    return NextResponse.json(
      { error: "Failed to load conversations" },
      { status: 500 }
    );
  }
}

// POST /api/chat/conversations - Create new conversation
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const { userId, title, personalityMode } = body;

    // Security check: users can only create conversations for themselves
    if (userId !== user.id && !user.roles?.includes('admin')) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const conversationId = await chatStorage.createConversation(
      userId,
      title,
      personalityMode
    );

    return NextResponse.json({
      ok: true,
      conversationId,
    });
  } catch (error: any) {
    console.error("[conversations] POST error:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
