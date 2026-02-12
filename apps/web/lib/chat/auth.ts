// Chat authentication utilities - ISOLATED from Trader/Discord auth
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export interface ChatAuthResult {
  valid: boolean
  userId?: string
  username?: string
  error?: string
}

/**
 * Verify chat authentication from request
 * Uses ChatSession and ChatUser tables
 */
export async function verifyChatAuth(request: NextRequest): Promise<ChatAuthResult> {
  // Try to get token from Authorization header
  const authHeader = request.headers.get('authorization')
  let token = authHeader?.replace('Bearer ', '')

  // If no token in header, try to get from cookies
  if (!token) {
    const cookieHeader = request.headers.get('cookie')
    if (cookieHeader) {
      const cookies = parseCookies(cookieHeader)
      token = cookies['slimy_chat_token']
    }
  }

  if (!token) {
    return { valid: false, error: 'No chat authentication token provided' }
  }

  try {
    // Verify session exists in ChatSession table
    const session = await db.chatSession.findFirst({
      where: {
        token,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: true,
      },
    })

    if (!session) {
      return { valid: false, error: 'Invalid or expired chat session' }
    }

    return {
      valid: true,
      userId: session.userId,
      username: session.user.username,
    }
  } catch (error) {
    console.error('[Chat Auth] Verification error:', error)
    return { valid: false, error: 'Authentication verification failed' }
  }
}

/**
 * Parse cookies from cookie header string
 */
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {}
  cookieHeader.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=')
    if (name && value) {
      cookies[name] = decodeURIComponent(value)
    }
  })
  return cookies
}

/**
 * Check if user has required roles for an action
 */
export async function hasPermission(userId: string, guildId: string, action: string): Promise<boolean> {
  const permissions: Record<string, string[]> = {
    create_channel: ['admin', 'moderator'],
    delete_channel: ['admin'],
    delete_any_message: ['admin', 'moderator'],
    pin_message: ['admin', 'moderator'],
    generate_invite: ['admin', 'moderator'],
    kick_user: ['admin'],
    change_roles: ['admin'],
    view_audit_log: ['admin'],
    change_guild_settings: ['admin'],
  }

  const membership = await db.chatGuildMembership.findUnique({
    where: { userId_guildId: { userId, guildId } },
  })
  
  const roles = (membership?.roles as string[]) || []
  const requiredRoles = permissions[action] || []
  return roles.some(role => requiredRoles.includes(role))
}

/**
 * Verify user is member of a channel's guild
 */
export async function verifyChannelAccess(userId: string, channelId: string): Promise<boolean> {
  const channel = await db.chatChannel.findUnique({
    where: { id: channelId },
    include: {
      guild: {
        include: {
          memberships: true,
        },
      },
    },
  })

  if (!channel) return false

  return channel.guild.memberships.some(m => m.userId === userId)
}

/**
 * Standard unauthorized response
 */
export function unauthorizedResponse(message: string = 'Unauthorized') {
  return NextResponse.json(
    { error: { code: 'UNAUTHORIZED', message } },
    { status: 401 }
  )
}

/**
 * Standard forbidden response
 */
export function forbiddenResponse(message: string = 'Forbidden') {
  return NextResponse.json(
    { error: { code: 'FORBIDDEN', message } },
    { status: 403 }
  )
}
