// API Routes for Channels
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { verifyChatAuth, hasPermission, unauthorizedResponse, forbiddenResponse } from '@/lib/chat/auth'

const createChannelSchema = z.object({
  name: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/, 'Channel name must be lowercase letters, numbers, and hyphens only'),
  topic: z.string().max(200).optional(),
})

// Get all channels
export async function GET(request: NextRequest) {
  const auth = await verifyChatAuth(request)
  if (!auth.valid) {
    return unauthorizedResponse(auth.error)
  }

  // For MVP: single guild, get the first one (or create default)
  let guild = await db.chatGuild.findFirst()

  if (!guild) {
    // Create default guild
    guild = await db.chatGuild.create({
      data: {
        name: 'The Lounge',
      },
    })

    // Add user as admin
    await db.chatGuildMembership.create({
      data: {
        userId: auth.userId!,
        guildId: guild.id,
        roles: ['admin', 'member'],
      },
    })
  }

  let channels = await db.chatChannel.findMany({
    where: { guildId: guild.id },
    orderBy: { createdAt: 'asc' },
  })

  // If no channels, create default ones
  if (channels.length === 0) {
    const defaultChannels = await Promise.all([
      db.chatChannel.create({
        data: { name: 'general', topic: 'General discussion', guildId: guild.id },
      }),
      db.chatChannel.create({
        data: { name: 'random', topic: 'Random stuff', guildId: guild.id },
      }),
    ])
    channels = [...channels, ...defaultChannels]
  }

  return NextResponse.json({ channels, guild })
}

// Create a channel
export async function POST(request: NextRequest) {
  const auth = await verifyChatAuth(request)
  if (!auth.valid) {
    return unauthorizedResponse(auth.error)
  }

  // Check if user has admin or moderator role
  const userGuild = await db.chatGuildMembership.findFirst({
    where: { userId: auth.userId! },
  })

  if (!userGuild || !(await hasPermission(auth.userId!, userGuild.guildId, 'create_channel'))) {
    return forbiddenResponse('You do not have permission to create channels')
  }

  try {
    const body = await request.json()
    const { name, topic } = createChannelSchema.parse(body)

    // Check if channel name already exists
    const existing = await db.chatChannel.findFirst({
      where: { name, guildId: userGuild.guildId },
    })

    if (existing) {
      return NextResponse.json(
        { error: { code: 'CHANNEL_EXISTS', message: 'A channel with that name already exists' } },
        { status: 400 }
      )
    }

    const channel = await db.chatChannel.create({
      data: {
        name,
        topic: topic || null,
        guildId: userGuild.guildId,
      },
    })

    return NextResponse.json({ channel }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.errors[0].message } },
        { status: 400 }
      )
    }
    console.error('[Channels] Create error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create channel' } },
      { status: 500 }
    )
  }
}
