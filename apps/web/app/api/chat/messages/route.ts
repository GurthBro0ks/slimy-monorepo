// API Route for Creating Messages
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { verifyChatAuth, verifyChannelAccess, unauthorizedResponse, forbiddenResponse } from '@/lib/chat/auth'

const createMessageSchema = z.object({
  channelId: z.string(),
  text: z.string().min(1).max(4000),
})

// Create a message
export async function POST(request: NextRequest) {
  const auth = await verifyChatAuth(request)
  if (!auth.valid) {
    return unauthorizedResponse(auth.error)
  }

  try {
    const body = await request.json()
    const { channelId, text } = createMessageSchema.parse(body)

    // Verify user has access to this channel
    const hasAccess = await verifyChannelAccess(auth.userId!, channelId)
    if (!hasAccess) {
      return forbiddenResponse('You do not have access to this channel')
    }

    // Create message
    const message = await db.chatRoomMessage.create({
      data: {
        text,
        userId: auth.userId!,
        channelId,
      },
      include: {
        user: {
          select: { id: true, username: true },
        },
        reactions: {
          include: {
            user: { select: { id: true, username: true } },
          },
        },
      },
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.errors[0].message } },
        { status: 400 }
      )
    }
    console.error('[Messages] Create error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create message' } },
      { status: 500 }
    )
  }
}
