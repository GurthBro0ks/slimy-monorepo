// API Routes for Message Reactions
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { verifyChatAuth, unauthorizedResponse, forbiddenResponse } from '@/lib/chat/auth'

const reactionSchema = z.object({
  emoji: z.string().min(1).max(50),
})

// POST /api/chat/messages/[messageId]/reactions - Add reaction
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const auth = await verifyChatAuth(request)
    if (!auth.valid) {
      return unauthorizedResponse(auth.error)
    }

    const { messageId } = await params

    const body = await request.json()
    const { emoji } = reactionSchema.parse(body)

    // Check message exists
    const message = await db.chatRoomMessage.findUnique({
      where: { id: messageId, deletedAt: null },
      include: { channel: { include: { guild: { include: { memberships: true } } } } },
    })

    if (!message) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Message not found' } },
        { status: 404 }
      )
    }

    // Verify user has access to this channel
    const isMember = message.channel.guild.memberships.some(m => m.userId === auth.userId)
    if (!isMember) {
      return forbiddenResponse('You do not have access to this channel')
    }

    // Create reaction
    const reaction = await db.chatRoomMessageReaction.upsert({
      where: {
        userId_messageId_emoji: {
          userId: auth.userId!,
          messageId,
          emoji,
        },
      },
      update: {}, // No update, just return existing
      create: {
        userId: auth.userId!,
        messageId,
        emoji,
      },
      include: {
        user: { select: { id: true, username: true } },
      },
    })

    return NextResponse.json({ reaction })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.errors[0].message } },
        { status: 400 }
      )
    }
    console.error('[Reactions] Add error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to add reaction' } },
      { status: 500 }
    )
  }
}

// DELETE /api/chat/messages/[messageId]/reactions - Remove reaction
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const auth = await verifyChatAuth(request)
    if (!auth.valid) {
      return unauthorizedResponse(auth.error)
    }

    const { messageId } = await params
    const { searchParams } = new URL(request.url)
    const emoji = searchParams.get('emoji')

    if (!emoji) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Emoji is required' } },
        { status: 400 }
      )
    }

    // Check message exists
    const message = await db.chatRoomMessage.findUnique({
      where: { id: messageId, deletedAt: null },
      include: { channel: { include: { guild: { include: { memberships: true } } } } },
    })

    if (!message) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Message not found' } },
        { status: 404 }
      )
    }

    // Verify user has access to this channel
    const isMember = message.channel.guild.memberships.some(m => m.userId === auth.userId)
    if (!isMember) {
      return forbiddenResponse('You do not have access to this channel')
    }

    // Delete reaction
    await db.chatRoomMessageReaction.deleteMany({
      where: { messageId, emoji, userId: auth.userId! },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Reactions] Remove error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to remove reaction' } },
      { status: 500 }
    )
  }
}
