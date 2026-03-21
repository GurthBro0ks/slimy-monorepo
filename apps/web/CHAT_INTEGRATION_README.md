# Chat App Integration

This document describes the integration of the standalone chat-app into the slimy-monorepo web app.

## Overview

The chat functionality has been integrated into the main web app at `/chat`, using the existing TraderUser/TraderSession authentication system.

## Changes Made

### 1. Database Schema (prisma/schema.prisma)

Added new chat tables:
- `ChatGuild` - Chat servers/guilds (renamed from Guild to avoid conflict)
- `ChatChannel` - Text channels within guilds
- `ChatGuildMembership` - User membership in guilds with roles
- `ChatRoomMessage` - Channel messages (renamed from ChatMessage)
- `ChatDirectMessage` - Direct messages between users
- `ChatRoomMessageReaction` - Message reactions
- `ChatPinnedMessage` - Pinned messages
- `ChatFileMetadata` - Upload file metadata
- `ChatInvite` - Guild invite codes
- `ChatPresence` - User online/offline status
- `ChatNotificationSettings` - Per-channel notification preferences

Updated `TraderUser` model to include relations to chat entities.

### 2. API Routes (app/api/chat/)

- `GET /api/chat/channels` - List channels
- `GET /api/chat/channels/[channelId]/messages` - Get channel messages
- `POST /api/chat/messages` - Create message
- `POST /api/chat/messages/[messageId]/reactions` - Add reaction
- `DELETE /api/chat/messages/[messageId]/reactions` - Remove reaction

### 3. Socket.io Server (server.ts)

Created a custom Next.js server with Socket.io for real-time features:
- Message sending/receiving
- Typing indicators
- Reactions
- Direct messages
- Presence updates

Uses `TraderSession` for authentication instead of JWT.

### 4. UI Components (components/chat/)

- `chat-layout.tsx` - Main chat interface
- `login-gate.tsx` - Redirects to login if not authenticated
- `channel-list.tsx` - Sidebar channel list
- `message-list.tsx` - Message display area
- `message-input.tsx` - Message composition with auto-resize

### 5. Contexts (lib/chat/)

- `socket-context.tsx` - Socket.io connection management
- `auth.ts` - Chat authentication utilities

### 6. Chat Page (app/chat/page.tsx)

Main chat page that combines LoginGate, SocketProvider, and ChatLayout.

## Authentication Flow

1. User logs in via `/trader/login` (existing trader auth system)
2. On successful login, store `slimy_chat_token` in localStorage
3. Chat page checks for token in `ChatLoginGate`
4. Socket.io connection uses token from localStorage
5. Server validates token against `TraderSession` table

## Database Migration

To apply the schema changes:

```bash
# Install dependencies first
cd /opt/slimy/slimy-monorepo
pnpm install

# Generate Prisma client
pnpm --filter @slimy/web db:generate

# Create and apply migration
pnpm --filter @slimy/web db:migrate
```

## Running the App

### Development Mode (with Socket.io)

```bash
# Run the custom server
cd /opt/slimy/slimy-monorepo/apps/web
npx tsx server.ts
```

### Standard Next.js Dev (without real-time)

```bash
cd /opt/slimy/slimy-monorepo
pnpm --filter @slimy/web dev
```

Note: For full real-time functionality, you must use the custom server.

## Environment Variables

Add these to your `.env`:

```env
# Database (MySQL)
DATABASE_URL="mysql://user:pass@localhost:3306/slimyai_dev"

# App URL (for CORS in production)
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
```

## User Flow

1. User navigates to `/chat`
2. If not authenticated, redirected to `/trader/login?redirect=/chat`
3. After login, redirected back to `/chat`
4. Socket.io connects automatically
5. Default guild and channels are created on first load
6. User can switch channels, send messages, add reactions

## Permissions

Roles within chat guilds:
- `admin` - Full access (create/delete channels, manage users)
- `moderator` - Can pin messages, delete any message
- `member` - Basic chat access

## Compatibility Notes

- Uses existing TraderUser/TraderSession instead of creating new auth tables
- Does NOT include file uploads in this initial integration
- Retro terminal UI theme matches existing web app styling
- Socket.io path is `/socket.io`

## Future Enhancements

- File uploads with S3/MinIO integration
- Voice channels (WebRTC)
- Message search
- @mentions and notifications
- Mobile responsive improvements
- Integration with Discord bot notifications
