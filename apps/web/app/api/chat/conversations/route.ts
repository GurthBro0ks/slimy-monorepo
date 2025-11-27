import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/server";
import { AuthorizationError, errorResponse } from "@/lib/errors";
import { chatStorage } from "@/lib/chat/storage";

export const runtime = "nodejs";

// GET /api/chat/conversations - Get user's conversations
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || user.id;
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 100);

    // Security check: users can only access their own conversations
    if (userId !== user.id && !user.roles?.includes('admin')) {
      throw new AuthorizationError("Access denied");
    }

    const conversations = await chatStorage.getConversations(userId, limit);

    return Response.json({
      ok: true,
      conversations,
    });
  } catch (error) {
    const { body, status, headers } = errorResponse(error);
    return Response.json(body, { status, headers });
  }
}

// POST /api/chat/conversations - Create new conversation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, title, personalityMode } = body;

    const user = await requireAuth();

    // Security check: users can only create conversations for themselves
    if (userId !== user.id && !user.roles?.includes('admin')) {
      throw new AuthorizationError("Access denied");
    }

    const conversationId = await chatStorage.createConversation(
      userId,
      title,
      personalityMode
    );

    return Response.json({
      ok: true,
      conversationId,
    });
  } catch (error) {
    const { body, status, headers } = errorResponse(error);
    return Response.json(body, { status, headers });
  }
}
