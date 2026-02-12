// Custom Next.js server with Socket.io
// Required for WebSocket support alongside Next.js

import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { Server as SocketIOServer } from 'socket.io'
import { db } from './lib/db'
import crypto from 'crypto'

const dev = process.env.NODE_ENV !== 'production'
const hostname = dev ? 'localhost' : '0.0.0.0'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handler = app.getRequestHandler()

// Track connected users
interface ConnectedUser {
  userId: string
  username: string
  socketId: string
}

const connectedUsers = new Map<string, ConnectedUser>()

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true)
      await handler(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('Internal server error')
    }
  })

  // Socket.io server
  const io = new SocketIOServer(httpServer, {
    path: '/socket.io',
    cors: {
      origin: dev ? ['http://localhost:3000', 'http://localhost:3001'] : process.env.NEXT_PUBLIC_APP_URL ? [process.env.NEXT_PUBLIC_APP_URL] : [],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // Add ping timeout and interval for better connection handling
    pingTimeout: 60000,
    pingInterval: 25000,
  })

  // Auth middleware for Socket.io - uses TraderSession
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token as string | undefined

    if (!token) {
      return next(new Error('Authentication required'))
    }

    try {
      // Hash the token for lookup
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

      // Verify session exists in TraderSession table
      const session = await db.traderSession.findFirst({
        where: {
          tokenHash,
          expiresAt: { gt: new Date() },
          revokedAt: null,
        },
        include: { user: true },
      })

      if (!session) {
        return next(new Error('Invalid or expired session'))
      }

      // Update last seen
      await db.traderSession.update({
        where: { id: session.id },
        data: { lastSeenAt: new Date() },
      })

      socket.data.userId = session.userId
      socket.data.username = session.user.username
      next()
    } catch (err) {
      console.error('[Socket] Auth error:', err)
      next(new Error('Authentication failed'))
    }
  })

  // Connection handling
  io.on('connection', async (socket) => {
    const userId = socket.data.userId as string
    const username = socket.data.username as string

    console.log(`[Socket] User connected: ${username} (${socket.id})`)

    // Track connected user
    connectedUsers.set(socket.id, { userId, username, socketId: socket.id })

    // Update presence to online
    await db.chatPresence.upsert({
      where: { userId },
      create: { userId, status: 'online' },
      update: { status: 'online', lastSeen: new Date() },
    })

    // Broadcast presence update
    io.emit('presence:update', { userId, status: 'online' })

    // Join personal room for DMs
    socket.join(`user:${userId}`)

    // Join a channel
    socket.on('channel:join', async ({ channelId }: { channelId: string }) => {
      // Verify user has access to this channel
      const channel = await db.chatChannel.findUnique({
        where: { id: channelId },
        include: { guild: { include: { memberships: true } } },
      })

      if (!channel) {
        socket.emit('error', { code: 'NOT_FOUND', message: 'Channel not found' })
        return
      }

      const isMember = channel.guild.memberships.some(m => m.userId === userId)
      if (!isMember) {
        socket.emit('error', { code: 'FORBIDDEN', message: 'You do not have access to this channel' })
        return
      }

      socket.join(`channel:${channelId}`)
      console.log(`[Socket] ${username} joined channel:${channelId}`)
    })

    // Leave a channel
    socket.on('channel:leave', ({ channelId }: { channelId: string }) => {
      socket.leave(`channel:${channelId}`)
      console.log(`[Socket] ${username} left channel:${channelId}`)
    })

    // Send message - WITH PERSISTENCE
    socket.on('message:send', async (data: { channelId: string; text: string; files?: string[] }) => {
      try {
        // Validate text length
        if (!data.text?.trim() || data.text.length > 4000) {
          socket.emit('error', { code: 'INVALID_MESSAGE', message: 'Message must be 1-4000 characters' })
          return
        }

        // Verify channel exists and user has access
        const channel = await db.chatChannel.findUnique({
          where: { id: data.channelId },
          include: { guild: { include: { memberships: true } } },
        })

        if (!channel) {
          socket.emit('error', { code: 'NOT_FOUND', message: 'Channel not found' })
          return
        }

        const isMember = channel.guild.memberships.some(m => m.userId === userId)
        if (!isMember) {
          socket.emit('error', { code: 'FORBIDDEN', message: 'You do not have access to this channel' })
          return
        }

        // Create message in database
        const message = await db.chatRoomMessage.create({
          data: {
            text: data.text,
            userId,
            channelId: data.channelId,
          },
          include: {
            user: { select: { id: true, username: true } },
            reactions: {
              include: { user: { select: { id: true, username: true } } },
            },
            files: true,
          },
        })

        // Broadcast to channel
        io.to(`channel:${data.channelId}`).emit('message:created', message)
      } catch (err) {
        console.error('[Socket] Error creating message:', err)
        socket.emit('error', { code: 'INTERNAL_ERROR', message: 'Failed to send message' })
      }
    })

    // Edit message
    socket.on('message:edit', async (data: { messageId: string; text: string }) => {
      try {
        const message = await db.chatRoomMessage.findUnique({
          where: { id: data.messageId },
        })

        if (!message || message.deletedAt) {
          socket.emit('error', { code: 'NOT_FOUND', message: 'Message not found' })
          return
        }

        if (message.userId !== userId) {
          socket.emit('error', { code: 'FORBIDDEN', message: 'You can only edit your own messages' })
          return
        }

        if (!data.text?.trim() || data.text.length > 4000) {
          socket.emit('error', { code: 'INVALID_MESSAGE', message: 'Message must be 1-4000 characters' })
          return
        }

        const updated = await db.chatRoomMessage.update({
          where: { id: data.messageId },
          data: { text: data.text, editedAt: new Date() },
        })

        io.to(`channel:${message.channelId}`).emit('message:edited', {
          messageId: data.messageId,
          text: data.text,
          editedAt: updated.editedAt,
        })
      } catch (err) {
        console.error('[Socket] Error editing message:', err)
        socket.emit('error', { code: 'INTERNAL_ERROR', message: 'Failed to edit message' })
      }
    })

    // Typing indicator
    socket.on('typing:start', ({ channelId }: { channelId: string }) => {
      socket.to(`channel:${channelId}`).emit('typing:update', {
        channelId,
        userId,
        username,
        isTyping: true,
      })
    })

    socket.on('typing:stop', ({ channelId }: { channelId: string }) => {
      socket.to(`channel:${channelId}`).emit('typing:update', {
        channelId,
        userId,
        username,
        isTyping: false,
      })
    })

    // DM handling - WITH PERSISTENCE
    socket.on('dm:send', async (data: { toUserId: string; text: string; files?: string[] }) => {
      try {
        if (!data.text?.trim() || data.text.length > 4000) {
          socket.emit('error', { code: 'INVALID_MESSAGE', message: 'Message must be 1-4000 characters' })
          return
        }

        // Create DM in database
        const dm = await db.chatDirectMessage.create({
          data: {
            text: data.text,
            fromUserId: userId,
            toUserId: data.toUserId,
          },
          include: {
            fromUser: { select: { id: true, username: true } },
            toUser: { select: { id: true, username: true } },
          },
        })

        // Send to recipient (if online)
        io.to(`user:${data.toUserId}`).emit('dm:created', dm)
        // Also send back to sender
        socket.emit('dm:created', dm)
      } catch (err) {
        console.error('[Socket] Error creating DM:', err)
        socket.emit('error', { code: 'INTERNAL_ERROR', message: 'Failed to send DM' })
      }
    })

    // Add reaction
    socket.on('reaction:add', async (data: { messageId: string; emoji: string }) => {
      try {
        const message = await db.chatRoomMessage.findUnique({
          where: { id: data.messageId, deletedAt: null },
        })

        if (!message) {
          socket.emit('error', { code: 'NOT_FOUND', message: 'Message not found' })
          return
        }

        // Check user has access to this channel
        const channel = await db.chatChannel.findUnique({
          where: { id: message.channelId },
          include: { guild: { include: { memberships: true } } },
        })

        if (!channel) {
          socket.emit('error', { code: 'NOT_FOUND', message: 'Channel not found' })
          return
        }

        const isMember = channel.guild.memberships.some(m => m.userId === userId)
        if (!isMember) {
          socket.emit('error', { code: 'FORBIDDEN', message: 'You do not have access to this channel' })
          return
        }

        // Create reaction
        const reaction = await db.chatRoomMessageReaction.upsert({
          where: {
            userId_messageId_emoji: {
              userId,
              messageId: data.messageId,
              emoji: data.emoji,
            },
          },
          update: {},
          create: {
            userId,
            messageId: data.messageId,
            emoji: data.emoji,
          },
        }).catch(() => null)

        if (reaction) {
          io.to(`channel:${message.channelId}`).emit('reaction:added', {
            messageId: data.messageId,
            emoji: data.emoji,
            userId,
            username,
          })
        }
      } catch (err) {
        console.error('[Socket] Error adding reaction:', err)
        socket.emit('error', { code: 'INTERNAL_ERROR', message: 'Failed to add reaction' })
      }
    })

    // Remove reaction
    socket.on('reaction:remove', async (data: { messageId: string; emoji: string }) => {
      try {
        const message = await db.chatRoomMessage.findUnique({
          where: { id: data.messageId },
        })

        if (!message) return

        await db.chatRoomMessageReaction.deleteMany({
          where: { messageId: data.messageId, emoji: data.emoji, userId },
        })

        io.to(`channel:${message.channelId}`).emit('reaction:removed', {
          messageId: data.messageId,
          emoji: data.emoji,
          userId,
        })
      } catch (err) {
        console.error('[Socket] Error removing reaction:', err)
        socket.emit('error', { code: 'INTERNAL_ERROR', message: 'Failed to remove reaction' })
      }
    })

    // Disconnect
    socket.on('disconnect', async () => {
      console.log(`[Socket] User disconnected: ${username} (${socket.id})`)

      // Remove from connected users
      connectedUsers.delete(socket.id)

      // Update presence to offline if no other sockets
      const userSockets = Array.from(connectedUsers.values()).filter(u => u.userId === userId)
      if (userSockets.length === 0) {
        await db.chatPresence.upsert({
          where: { userId },
          create: { userId, status: 'offline' },
          update: { status: 'offline', lastSeen: new Date() },
        })
        io.emit('presence:update', { userId, status: 'offline' })
      }
    })
  })

  httpServer
    .once('error', (err) => {
      console.error('Server error:', err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
      console.log(`> Socket.io listening at /socket.io`)
    })
})
