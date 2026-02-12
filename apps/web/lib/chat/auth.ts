// Chat authentication utilities - adapted to use TraderSession
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'

export interface ChatAuthResult {
  valid: boolean
  userId?: string
  username?: string
  error?: string
}

/**
 * Verify chat authentication from request
 * Supports both Bearer token header and cookie-based auth
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
      token = cookies['slimy_chat_token'] || cookies['slimy_admin'] || cookies['slimy_session']
    }
  }

  if (!token) {
    return { valid: false, error: 'No authentication token provided' }
  }

  try {
    // Hash the token for lookup (tokens are stored hashed)
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    // Verify session exists in TraderSession table
    const session = await db.traderSession.findFirst({
      where: {
        tokenHash,
        expiresAt: { gt: new Date() },
        revokedAt: null,
      },
      include: {
        user: true,
      },
    })

    if (!session) {
      return { valid: false, error: 'Invalid or expired session' }
    }

    // Update last seen
    await db.traderSession.update({
      where: { id: session.id },
      data: { lastSeenAt: new Date() },
    })

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
export function hasPermission(roles: string[], action: string): boolean {
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

  const requiredRoles = permissions[action] || []
  return roles.some(role => requiredRoles.includes(role))
}

/**
 * Get user's guild roles
 */
export async function getUserGuildRoles(userId: string, guildId: string): Promise<string[]> {
  const membership = await db.chatGuildMembership.findUnique({
    where: { userId_guildId: { userId, guildId } },
  })
  return (membership?.roles as string[]) || []
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
