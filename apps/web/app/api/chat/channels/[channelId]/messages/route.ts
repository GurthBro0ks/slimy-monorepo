// API Route for Channel Messages
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyChatAuth, verifyChannelAccess, unauthorizedResponse, forbiddenResponse } from '@/lib/chat/auth'

// Get messages for a channel (paginated)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const auth = await verifyChatAuth(request)
  if (!auth.valid) {
    return unauthorizedResponse(auth.error)
  }

  const { channelId } = await params
  const { searchParams } = new URL(request.url)
  const cursor = searchParams.get('cursor')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

  // Verify user has access to this channel
  const hasAccess = await verifyChannelAccess(auth.userId!, channelId)
  if (!hasAccess) {
    return forbiddenResponse('You do not have access to this channel')
  }

  // Build query
  const messages = await db.chatRoomMessage.findMany({
    where: {
      channelId,
      deletedAt: null,
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      user: {
        select: { id: true, username: true },
      },
      reactions: {
        include: {
          user: { select: { id: true, username: true } },
        },
      },
      files: {
        select: { id: true, filename: true, mimeType: true, sizeBytes: true },
      },
    },
  })

  // Reverse for chronological order
  const reversedMessages = messages.reverse()

  // Get next cursor
  const nextCursor = messages.length === limit ? messages[messages.length - 1]?.createdAt : null

  return NextResponse.json({
    messages: reversedMessages,
    nextCursor,
  })
}
