# API Catalog

This document provides a comprehensive catalog of all public HTTP APIs in the slimy-monorepo.

**Last Updated:** 2025-11-19
**Services Covered:**
- Admin API (Express.js, port 3080)
- Web API (Next.js App Router, port 3000)
- Status & Health Endpoints

---

## Table of Contents

- [Admin API](#admin-api)
  - [Authentication](#authentication)
  - [Guilds](#guilds)
  - [Chat](#chat)
  - [Snail Tools](#snail-tools)
  - [Stats](#stats)
  - [Personality](#personality)
  - [Uploads](#uploads)
  - [Diagnostics](#diagnostics)
  - [Bot](#bot)
- [Web API](#web-api)
  - [Authentication](#web-authentication)
  - [Guilds](#web-guilds)
  - [Chat](#web-chat)
  - [Codes](#codes)
  - [Club](#club)
  - [Stats](#web-stats)
  - [Snail](#web-snail)
  - [User Preferences](#user-preferences)
  - [Diagnostics](#web-diagnostics)
- [Status & Health Endpoints](#status--health-endpoints)
- [Future API Design Notes](#future-api-design-notes)

---

## Admin API

**Base URL:** `http://localhost:3080` (development) / `https://admin.slimyai.xyz` (production)
**Authentication:** JWT via `__session` cookie
**Security:** Helmet, CORS, CSRF protection, rate limiting
**Validation:** Zod schemas

### Authentication

#### `GET /api/auth/login`
- **Description:** Initiates Discord OAuth2 flow
- **Auth Required:** No
- **Request:** None
- **Response:** Redirects to Discord OAuth consent page
- **Notes:** Sets `oauth_state` cookie for CSRF protection

#### `GET /api/auth/callback`
- **Description:** Discord OAuth2 callback handler
- **Auth Required:** No
- **Request Query:**
  ```typescript
  {
    code: string;        // OAuth authorization code
    state: string;       // CSRF state token
  }
  ```
- **Response:** Redirects to appropriate page based on user role
  - Admin → `/guilds`
  - Club → `/club`
  - Member → `/snail`
- **Notes:**
  - Sets `__session` cookie with JWT
  - Stores session in Redis with guild info and tokens
  - Validates state token against cookie
  - Fetches user guilds and determines highest role
  - Uses Discord bot token to check guild membership if available

#### `GET /api/auth/me`
- **Description:** Get current authenticated user info
- **Auth Required:** Yes (JWT)
- **Request:** None
- **Response:**
  ```typescript
  {
    id: string;
    username: string;
    globalName: string;
    avatar: string | null;
    role: "member" | "club" | "admin";
    guilds: Array<{
      id: string;
      name: string;
      icon: string | null;
      role: string;
      installed: boolean;
      permissions: string;
    }>;
    sessionGuilds: Array<{ /* full guild data */ }>;
  }
  ```

#### `POST /api/auth/logout`
- **Description:** Logout current user
- **Auth Required:** Yes (JWT)
- **Request:** None
- **Response:**
  ```typescript
  { ok: true }
  ```
- **Notes:**
  - Clears `__session` cookie
  - Removes session from Redis

### Guilds

All guild endpoints require authentication. Guild-specific endpoints require guild access (membership or admin role).

#### `GET /api/guilds`
- **Description:** List all guilds for authenticated user
- **Auth Required:** Yes
- **Request:** None
- **Response:**
  ```typescript
  {
    guilds: Array<{
      id: string;
      name: string;
      icon: string | null;
      role: string;
      installed: boolean;
    }>;
  }
  ```

#### `GET /api/guilds/:guildId/settings`
- **Description:** Get guild settings
- **Auth Required:** Yes (guild access)
- **Request Query:**
  ```typescript
  {
    test?: "true";  // Include test data
  }
  ```
- **Response:**
  ```typescript
  {
    guildId: string;
    sheetUrl: string | null;
    weekWindowDays: number;
    thresholds: {
      warnLow: number | null;
      warnHigh: number | null;
    };
    tokensPerMinute: number | null;
  }
  ```

#### `PUT /api/guilds/:guildId/settings`
- **Description:** Update guild settings
- **Auth Required:** Yes (guild access, editor role)
- **CSRF Required:** Yes
- **Request Body:**
  ```typescript
  {
    sheetUrl?: string | null;
    weekWindowDays?: number;  // 1-14
    thresholds?: {
      warnLow?: number | null;
      warnHigh?: number | null;
    };
    tokensPerMinute?: number | null;
    testSheet?: boolean;
  }
  ```
- **Response:** Same as GET settings
- **Notes:** Creates audit log entry

#### `GET /api/guilds/:guildId/personality`
- **Description:** Get bot personality configuration
- **Auth Required:** Yes (guild access)
- **Response:**
  ```typescript
  {
    guildId: string;
    profile: Record<string, any>;  // Personality config object
  }
  ```

#### `PUT /api/guilds/:guildId/personality`
- **Description:** Update bot personality configuration
- **Auth Required:** Yes (guild access, editor role)
- **CSRF Required:** Yes
- **Request Body:**
  ```typescript
  {
    profile: Record<string, any>;
  }
  ```
- **Response:** Same as GET personality
- **Notes:** Creates audit log entry

#### `GET /api/guilds/:guildId/channels`
- **Description:** Get channel-specific settings
- **Auth Required:** Yes (guild access)
- **Response:**
  ```typescript
  {
    channels: Array<{
      channelId: string;
      channelName?: string;
      modes: Record<string, any>;
      allowlist: string[];
    }>;
  }
  ```

#### `PUT /api/guilds/:guildId/channels`
- **Description:** Replace all channel settings
- **Auth Required:** Yes (guild access, editor role)
- **CSRF Required:** Yes
- **Request Body:**
  ```typescript
  {
    channels: Array<{
      channelId: string;
      channelName?: string;
      modes?: Record<string, any>;
      allowlist?: string[];
    }>;
  }
  ```
- **Response:** Same as GET channels
- **Notes:** Creates audit log entry

#### `GET /api/guilds/:guildId/corrections`
- **Description:** List manual corrections for stats
- **Auth Required:** Yes (guild access)
- **Request Query:**
  ```typescript
  {
    weekId?: string;
  }
  ```
- **Response:**
  ```typescript
  {
    corrections: Array<{
      id: number;
      weekId: string;
      memberKey: string;
      displayName: string;
      metric: "total" | "sim";
      value: number | string;
      reason?: string;
      createdAt: string;
    }>;
  }
  ```

#### `POST /api/guilds/:guildId/corrections`
- **Description:** Create a manual correction
- **Auth Required:** Yes (guild access, editor role)
- **CSRF Required:** Yes
- **Request Body:**
  ```typescript
  {
    weekId?: string;
    memberKey?: string;
    displayName?: string;
    memberInput?: string;
    metric: "total" | "sim";
    value: number | string;
    reason?: string;
  }
  ```
- **Response:** Created correction object
- **Status:** 201 Created
- **Notes:** Creates audit log entry

#### `DELETE /api/guilds/:guildId/corrections/:correctionId`
- **Description:** Delete a correction
- **Auth Required:** Yes (guild access, editor role)
- **CSRF Required:** Yes
- **Response:** None (204 No Content)
- **Notes:** Creates audit log entry

#### `POST /api/guilds/:guildId/rescan-user`
- **Description:** Rescan a user's screenshot for updated stats
- **Auth Required:** Yes (guild access, editor role)
- **CSRF Required:** Yes
- **Request:** multipart/form-data
  ```typescript
  {
    file: File;           // Image file, max 6MB
    member: string;       // Member identifier
    metric?: string;      // Metric to update
    weekId?: string;      // Week identifier
  }
  ```
- **Response:**
  ```typescript
  {
    success: boolean;
    metric: string;
    value: number;
    memberKey: string;
  }
  ```
- **Notes:** Creates audit log entry

#### `GET /api/guilds/:guildId/usage`
- **Description:** Get guild usage statistics
- **Auth Required:** Yes (guild access)
- **Request Query:**
  ```typescript
  {
    window?: string;      // Time window
    startDate?: string;   // ISO date
    endDate?: string;     // ISO date
  }
  ```
- **Response:**
  ```typescript
  {
    totalTokens: number;
    totalRequests: number;
    period: { start: string; end: string; };
    breakdown: Array<{ /* usage details */ }>;
  }
  ```

#### `GET /api/guilds/:guildId/health`
- **Description:** Get guild health status
- **Auth Required:** Yes (guild access)
- **Response:**
  ```typescript
  {
    ok: boolean;
    services: {
      sheets: { ok: boolean; message?: string; };
      bot: { ok: boolean; message?: string; };
      database: { ok: boolean; message?: string; };
    };
  }
  ```

#### `GET /api/guilds/:guildId/export/corrections.csv`
- **Description:** Export corrections as CSV
- **Auth Required:** Yes (guild access, admin role)
- **Response:** CSV file download
- **Content-Type:** `text/csv; charset=utf-8`
- **Notes:** Creates audit log entry

#### `GET /api/guilds/:guildId/export/corrections.json`
- **Description:** Export corrections as JSON
- **Auth Required:** Yes (guild access, admin role)
- **Response:** JSON file download
- **Notes:** Creates audit log entry

#### `GET /api/guilds/:guildId/export/personality.json`
- **Description:** Export personality config as JSON
- **Auth Required:** Yes (guild access, admin role)
- **Response:** JSON file download
- **Notes:** Creates audit log entry

### Chat

All chat endpoints require authentication.

#### `POST /api/chat/bot`
- **Description:** Submit a chat message for AI bot response (async)
- **Auth Required:** Yes (member role)
- **CSRF Required:** Yes
- **Request Body:**
  ```typescript
  {
    prompt: string;      // User message
    guildId: string;     // Guild context
  }
  ```
- **Response:**
  ```typescript
  {
    ok: true;
    jobId: string;                      // Job ID for polling
    status: "queued";
    estimatedWaitTime: "10-30 seconds";
  }
  ```
- **Error Codes:**
  - `400 missing_prompt` - No prompt provided
  - `503 queues_unavailable` - Job queue system unavailable
- **Notes:**
  - Returns job ID for polling status
  - Actual processing is async via Bull queue

#### `GET /api/chat/jobs/:jobId`
- **Description:** Check status of a chat bot job
- **Auth Required:** Yes (member role, job ownership)
- **Response:**
  ```typescript
  {
    ok: true;
    status: "queued" | "active" | "completed" | "failed";
    jobId: string;
    createdAt: number;
    result?: {                          // Only when completed
      reply: string;
      usedFallback: boolean;
    };
    error?: string;                     // Only when failed
    progress?: any;                     // Only when active
  }
  ```
- **Error Codes:**
  - `404 job_not_found` - Job doesn't exist
  - `403 job_access_denied` - User doesn't own this job
  - `503 queues_unavailable` - Job queue system unavailable

#### `GET /api/chat/db-jobs/:jobId`
- **Description:** Check status of a database operation job
- **Auth Required:** Yes (job ownership)
- **Response:**
  ```typescript
  {
    ok: true;
    status: "queued" | "active" | "completed" | "failed";
    jobId: string;
    jobType: string;                    // e.g., "create_conversation"
    createdAt: number;
    result?: any;                       // Only when completed
    error?: string;                     // Only when failed
  }
  ```

#### `GET /api/chat/:guildId/history`
- **Description:** Get chat history for a guild
- **Auth Required:** Yes (member role, guild membership or admin)
- **Request Query:**
  ```typescript
  {
    limit?: number;  // Default: 50
  }
  ```
- **Response:**
  ```typescript
  {
    ok: true;
    messages: Array<{
      messageId: string;
      guildId: string;
      userId: string;
      username: string;
      from: {
        id: string;
        name: string;
        role: string;
        color: string;
      };
      text: string;
      adminOnly: boolean;
      ts: string;  // ISO timestamp
    }>;
  }
  ```
- **Notes:**
  - Admin room (`admin-global`) requires admin role
  - Regular guilds require guild membership or admin role
  - Members only see non-admin-only messages
  - Admins/club members see all messages

#### `POST /api/chat/conversations`
- **Description:** Create a new conversation (async)
- **Auth Required:** Yes
- **CSRF Required:** Yes
- **Request Body:**
  ```typescript
  {
    title?: string;
    personalityMode?: string;  // Default: "helpful"
  }
  ```
- **Response:**
  ```typescript
  {
    ok: true;
    jobId: string;
    status: "queued";
    estimatedWaitTime: "2-5 seconds";
  }
  ```

#### `GET /api/chat/conversations`
- **Description:** List all conversations for user
- **Auth Required:** Yes
- **Request Query:**
  ```typescript
  {
    limit?: number;
  }
  ```
- **Response:**
  ```typescript
  {
    ok: true;
    conversations: Array<{
      id: string;
      title: string | null;
      personalityMode: string;
      createdAt: string;
      updatedAt: string;
      messageCount: number;
    }>;
  }
  ```

#### `GET /api/chat/conversations/:conversationId`
- **Description:** Get a specific conversation with messages
- **Auth Required:** Yes (conversation ownership)
- **Response:**
  ```typescript
  {
    ok: true;
    conversation: {
      id: string;
      title: string | null;
      personalityMode: string;
      createdAt: string;
      updatedAt: string;
      messages: Array<{
        id: string;
        role: "user" | "assistant";
        content: string;
        personalityMode: string;
        createdAt: string;
      }>;
    };
  }
  ```

#### `PATCH /api/chat/conversations/:conversationId`
- **Description:** Update conversation title
- **Auth Required:** Yes (conversation ownership)
- **CSRF Required:** Yes
- **Request Body:**
  ```typescript
  {
    title?: string;
  }
  ```
- **Response:**
  ```typescript
  { ok: true }
  ```

#### `DELETE /api/chat/conversations/:conversationId`
- **Description:** Delete a conversation
- **Auth Required:** Yes (conversation ownership)
- **CSRF Required:** Yes
- **Response:**
  ```typescript
  { ok: true }
  ```

#### `POST /api/chat/messages`
- **Description:** Add a message to a conversation (async)
- **Auth Required:** Yes
- **CSRF Required:** Yes
- **Request Body:**
  ```typescript
  {
    conversationId: string;
    message: {
      role: "user" | "assistant";
      content: string;
      personalityMode?: string;
    };
  }
  ```
- **Response:**
  ```typescript
  {
    ok: true;
    jobId: string;
    status: "queued";
    estimatedWaitTime: "1-3 seconds";
  }
  ```

### Snail Tools

All snail endpoints require authentication, member role, and guild membership.

**Base Path:** `/api/guilds/:guildId/snail`

#### `POST /api/guilds/:guildId/snail/analyze`
- **Description:** Analyze Super Snail screenshots using OpenAI Vision
- **Auth Required:** Yes (member role, guild membership)
- **CSRF Required:** Yes
- **Request:** multipart/form-data
  ```typescript
  {
    images: File[];        // Up to 8 images, max 10MB each
    prompt?: string;       // Optional analysis context
  }
  ```
- **Response:**
  ```typescript
  {
    ok: true;
    results: Array<{
      filename: string;
      analysis: string;     // AI-generated analysis
      confidence: number;
      data?: any;          // Extracted structured data
    }>;
  }
  ```
- **Notes:** Uses OpenAI Vision API for image analysis

#### `GET /api/guilds/:guildId/snail/stats`
- **Description:** Get user stats for Super Snail
- **Auth Required:** Yes (member role, guild membership)
- **Response:**
  ```typescript
  {
    userId: string;
    guildId: string;
    stats: {
      level: number;
      resources: Record<string, number>;
      lastUpdated: string;
    };
  }
  ```

#### `GET /api/guilds/:guildId/snail/codes`
- **Description:** Fetch active secret codes from external source
- **Auth Required:** Yes (member role, guild membership)
- **Response:**
  ```typescript
  {
    codes: Array<{
      code: string;
      reward: string;
      expiresAt?: string;
      source: string;
    }>;
    fetchedAt: string;
    source: string;
  }
  ```
- **Notes:** Proxies to external API (snelp.com) with caching

#### `GET /api/guilds/:guildId/snail/tier-costs`
- **Description:** Calculate tier upgrade costs
- **Auth Required:** Yes (member role, guild membership)
- **Request Query:**
  ```typescript
  {
    currentTier: number;
    targetTier: number;
  }
  ```
- **Response:**
  ```typescript
  {
    currentTier: number;
    targetTier: number;
    totalCost: number;
    breakdown: Array<{
      tier: number;
      cost: number;
    }>;
  }
  ```

### Stats

#### `GET /api/stats/summary`
- **Description:** Get aggregated stats from Google Sheets
- **Auth Required:** No (public)
- **Cache:** 600 seconds (10 minutes)
- **Request Query:**
  ```typescript
  {
    title?: string;                    // Specific sheet title
    tab?: "baseline" | "latest";       // Predefined tab selection
  }
  ```
- **Response:**
  ```typescript
  {
    ok: true;
    selected: string;                  // Selected tab title
    pinned: string;                    // Baseline tab title
    stats: {
      members: Array<{
        memberKey: string;
        displayName: string;
        total: number;
        sim: number;
        rank: number;
      }>;
      summary: {
        totalMembers: number;
        averageTotal: number;
        averageSim: number;
      };
    };
  }
  ```
- **Notes:**
  - Requires `STATS_SHEET_ID` environment variable
  - Returns 500 if not configured
  - Priority: explicit title → tab parameter → pinned → newest baseline → latest

### Personality

See [Guilds - Personality](#guilds) section.

### Uploads

#### `POST /api/uploads`
- **Description:** Upload files
- **Auth Required:** Yes
- **CSRF Required:** Yes
- **Request:** multipart/form-data
  ```typescript
  {
    file: File;  // Max 6MB
  }
  ```
- **Response:**
  ```typescript
  {
    ok: true;
    fileId: string;
    url: string;
    filename: string;
    size: number;
    mimeType: string;
  }
  ```

#### `GET /api/uploads/:fileId`
- **Description:** Retrieve uploaded file
- **Auth Required:** Yes
- **Response:** File content with appropriate Content-Type header

### Diagnostics

#### `GET /api/diag`
- **Description:** Basic diagnostic information
- **Auth Required:** No
- **Response:**
  ```typescript
  {
    ok: true;
    timestamp: string;
    uptime: number;
    memory: {
      used: number;
      total: number;
    };
  }
  ```

### Bot

#### `GET /api/bot/status`
- **Description:** Get Discord bot status
- **Auth Required:** Yes (admin role)
- **Response:**
  ```typescript
  {
    ok: true;
    connected: boolean;
    guilds: number;
    users: number;
    uptime: number;
  }
  ```

---

## Web API

**Base URL:** `http://localhost:3000` (development) / `https://app.slimyai.xyz` (production)
**Authentication:** Headers from reverse proxy (`x-user-id`, `x-user-role`, `x-username`)
**Framework:** Next.js 14+ App Router

### Web: Authentication

#### `GET /api/auth/me`
- **Description:** Get current user info (proxies to admin-api)
- **Auth Required:** No (uses upstream headers)
- **Cache:** No cache (force-dynamic)
- **Response:**
  ```typescript
  {
    user: {
      id: string;
      name: string;
    };
    role: "member" | "club" | "admin";
    guilds: Array<{
      id: string;
      roles: string[];
    }>;
  }
  ```

### Web: Guilds

#### `GET /api/guilds`
- **Description:** List guilds
- **Auth Required:** Yes
- **Cache:** 5 minutes
- **Request Query:**
  ```typescript
  {
    limit?: string;           // Default: "50"
    offset?: string;          // Default: "0"
    search?: string;
    includeMembers?: "true";
  }
  ```
- **Response:** Array of guild objects

#### `POST /api/guilds`
- **Description:** Create a new guild
- **Auth Required:** Yes (admin)
- **Request Body:**
  ```typescript
  {
    discordId: string;
    name: string;             // 2-100 characters
    settings?: Record<string, any>;
  }
  ```
- **Response:** Created guild object
- **Status:** 201 Created

#### `GET /api/guilds/:id`
- **Description:** Get guild details
- **Auth Required:** Yes
- **Response:** Guild object with full details

#### `GET /api/guilds/:id/settings`
- **Description:** Get guild settings (proxies to admin-api)
- **Auth Required:** Yes
- **Response:** Guild settings object

#### `PUT /api/guilds/:id/settings`
- **Description:** Update guild settings (proxies to admin-api)
- **Auth Required:** Yes
- **Request Body:** Same as admin-api
- **Response:** Updated settings

#### `GET /api/guilds/:id/members`
- **Description:** List guild members
- **Auth Required:** Yes
- **Request Query:**
  ```typescript
  {
    limit?: string;
    offset?: string;
  }
  ```
- **Response:**
  ```typescript
  {
    members: Array<{
      id: string;
      username: string;
      discriminator: string;
      roles: string[];
      joinedAt: string;
    }>;
    total: number;
  }
  ```

#### `GET /api/guilds/:id/members/:userId`
- **Description:** Get specific member details
- **Auth Required:** Yes
- **Response:** Member object

#### `POST /api/guilds/:id/members/bulk`
- **Description:** Bulk update members
- **Auth Required:** Yes (admin)
- **Request Body:**
  ```typescript
  {
    members: Array<{
      id: string;
      roles?: string[];
      // ... other fields
    }>;
  }
  ```
- **Response:**
  ```typescript
  {
    updated: number;
    failed: number;
    errors?: Array<{ id: string; error: string; }>;
  }
  ```

#### `GET /api/guilds/:id/flags`
- **Description:** Get guild feature flags
- **Auth Required:** Yes
- **Response:**
  ```typescript
  {
    flags: Record<string, boolean>;
  }
  ```

### Web: Chat

#### `POST /api/chat/bot`
- **Description:** Send chat message to bot
- **Auth Required:** No (uses IP-based rate limiting)
- **Rate Limit:** 5 requests per minute per IP
- **Request Body:**
  ```typescript
  {
    prompt: string;
    guildId: string;
  }
  ```
- **Response:**
  ```typescript
  {
    ok: true;
    reply: string;
  }
  ```
- **Rate Limit Response (429):**
  ```typescript
  {
    ok: false;
    code: "RATE_LIMIT_EXCEEDED";
    message: "You have exceeded the chat limit. Please try again later.";
  }
  ```
- **Headers:**
  - `Retry-After`: Seconds until reset
  - `X-RateLimit-Reset`: ISO timestamp of reset time

#### `GET /api/chat/conversations`
- **Description:** List user conversations (proxies to admin-api)
- **Auth Required:** Yes
- **Response:** Array of conversation objects

#### `POST /api/chat/message`
- **Description:** Send message in conversation
- **Auth Required:** Yes
- **Request Body:**
  ```typescript
  {
    conversationId: string;
    content: string;
  }
  ```

#### `GET /api/chat/messages`
- **Description:** Get messages for a conversation
- **Auth Required:** Yes
- **Request Query:**
  ```typescript
  {
    conversationId: string;
    limit?: string;
  }
  ```

#### `GET /api/chat/users`
- **Description:** Get chat-enabled users
- **Auth Required:** Yes
- **Response:**
  ```typescript
  {
    users: Array<{
      id: string;
      username: string;
      online: boolean;
    }>;
  }
  ```

### Codes

#### `GET /api/codes`
- **Description:** Aggregate secret codes from multiple sources
- **Auth Required:** No (public)
- **Cache:** 60 seconds
- **Request Query:**
  ```typescript
  {
    scope?: "active" | "all" | "expired";  // Default: "active"
    q?: string;                            // Search query
    metadata?: "true";                     // Include metadata
    health?: "true";                       // Health check mode
  }
  ```
- **Response:**
  ```typescript
  {
    codes: Array<{
      code: string;
      reward: string;
      expiresAt?: string;
      source: string;
      isActive: boolean;
    }>;
    sources: Array<{
      name: string;
      healthy: boolean;
      lastFetch: string;
    }>;
    scope: string;
    query?: string;
    count: number;
    timestamp: string;
    metadata?: {
      totalSources: number;
      successfulSources: number;
      failedSources: number;
      cache: {
        hit: boolean;
        stale: boolean;
        age?: number;
      };
    };
    _processingTime: number;
  }
  ```
- **Response Headers:**
  - `X-Processing-Time`: Processing time in ms
  - `X-Data-Freshness`: "fresh" or "stale"
  - `X-Sources-Total`: Total sources
  - `X-Sources-Successful`: Successful sources
  - `X-Sources-Failed`: Failed sources
  - `Cache-Control`: 60s for fresh, 30s for stale

#### `GET /api/codes/health`
- **Description:** Health check for codes aggregator
- **Auth Required:** No
- **Cache:** 60 seconds
- **Response:**
  ```typescript
  {
    status: "healthy" | "degraded" | "unhealthy";
    timestamp: string;
    sources: Array<{
      name: string;
      status: "healthy" | "unhealthy";
      lastSuccess?: string;
      lastError?: string;
    }>;
  }
  ```

#### `POST /api/codes/report`
- **Description:** Report invalid or expired code
- **Auth Required:** No
- **Request Body:**
  ```typescript
  {
    code: string;
    reason: "expired" | "invalid" | "duplicate";
    source?: string;
  }
  ```
- **Response:**
  ```typescript
  {
    ok: true;
    message: "Report received";
  }
  ```

### Club

Club endpoints are for "club" role users.

#### `POST /api/club/upload`
- **Description:** Upload club content
- **Auth Required:** Yes (club role)
- **Request:** multipart/form-data
  ```typescript
  {
    file: File;
    category?: string;
    tags?: string[];
  }
  ```
- **Response:**
  ```typescript
  {
    ok: true;
    uploadId: string;
    url: string;
  }
  ```

#### `POST /api/club/analyze`
- **Description:** Analyze uploaded club content
- **Auth Required:** Yes (club role)
- **Request Body:**
  ```typescript
  {
    uploadId: string;
    analysisType: "stats" | "patterns" | "trends";
  }
  ```
- **Response:**
  ```typescript
  {
    ok: true;
    analysis: {
      type: string;
      results: any;
      insights: string[];
    };
  }
  ```

#### `GET /api/club/export`
- **Description:** Export club data
- **Auth Required:** Yes (club role)
- **Request Query:**
  ```typescript
  {
    format: "csv" | "json" | "xlsx";
    dateRange?: string;
  }
  ```
- **Response:** File download

### Web: Stats

#### `GET /api/stats`
- **Description:** Get stats summary (proxies to admin-api)
- **Auth Required:** No
- **Cache:** Varies
- **Response:** Stats summary from Google Sheets

#### `GET /api/stats/events/stream`
- **Description:** Server-Sent Events stream for real-time stats
- **Auth Required:** Yes
- **Response:** text/event-stream
  ```typescript
  // Stream format:
  event: stat-update
  data: { type: "stat-update", payload: { ... } }

  event: heartbeat
  data: { type: "heartbeat", timestamp: "..." }
  ```
- **Notes:**
  - Keeps connection alive with periodic heartbeats
  - Sends real-time stat updates as they occur

### Web: Snail

#### `GET /api/snail/history`
- **Description:** Get snail screenshot analysis history
- **Auth Required:** Yes
- **Request Query:**
  ```typescript
  {
    guildId?: string;
    limit?: string;
  }
  ```
- **Response:**
  ```typescript
  {
    history: Array<{
      id: string;
      timestamp: string;
      analysis: string;
      images: string[];
    }>;
  }
  ```

### User Preferences

#### `GET /api/user/preferences`
- **Description:** Get user preferences
- **Auth Required:** Yes
- **Response:**
  ```typescript
  {
    preferences: Record<string, any>;
  }
  ```

#### `PUT /api/user/preferences`
- **Description:** Update user preferences
- **Auth Required:** Yes
- **Request Body:**
  ```typescript
  {
    preferences: Record<string, any>;
  }
  ```
- **Response:**
  ```typescript
  {
    ok: true;
    preferences: Record<string, any>;
  }
  ```

### Web: Diagnostics

#### `GET /api/diag`
- **Description:** Diagnostic information
- **Auth Required:** No
- **Response:**
  ```typescript
  {
    ok: true;
    timestamp: string;
    version: string;
    env: string;
  }
  ```

### Other Web Endpoints

#### `POST /api/screenshot`
- **Description:** Upload and analyze screenshot
- **Auth Required:** Yes
- **Request:** multipart/form-data
- **Response:** Analysis results

#### `GET /api/usage`
- **Description:** Get API usage statistics
- **Auth Required:** Yes (admin)
- **Response:** Usage statistics

#### `POST /api/web-vitals`
- **Description:** Report web vitals metrics
- **Auth Required:** No
- **Request Body:**
  ```typescript
  {
    name: string;
    value: number;
    id: string;
    delta: number;
  }
  ```
- **Response:**
  ```typescript
  { ok: true }
  ```

#### `GET /api/local-codes`
- **Description:** Get locally cached codes
- **Auth Required:** No
- **Cache:** 60 seconds
- **Response:** Array of code objects

---

## Status & Health Endpoints

### Admin API Health

#### `GET /api/health`
- **Description:** Service health check
- **Auth Required:** No
- **Response:**
  ```typescript
  {
    ok: true;
    service: "admin-api";
    env: "development" | "production";
    timestamp: string;
  }
  ```

#### `GET /api/`
- **Description:** Basic API check
- **Auth Required:** No
- **Response:**
  ```typescript
  { ok: true }
  ```

### Web API Health

#### `GET /api/health`
- **Description:** Service health check
- **Auth Required:** No
- **Cache:** 60 seconds
- **Response:**
  ```typescript
  {
    ok: true;
    ts: string;
    env: "development" | "production";
  }
  ```
- **Cache Headers:** `public, s-maxage=60, stale-while-revalidate=120`

---

## Future API Design Notes

### Consistency Improvements

#### 1. **Response Format Standardization**

Currently, response formats vary across endpoints:
- Some return `{ ok: true, data: ... }`
- Some return data directly
- Error responses are inconsistent

**Recommendation:** Adopt a consistent envelope format:
```typescript
// Success
{
  ok: true;
  data: T;
  meta?: {
    timestamp: string;
    requestId?: string;
    cached?: boolean;
    processingTime?: number;
  };
}

// Error
{
  ok: false;
  error: {
    code: string;          // Machine-readable error code
    message: string;       // Human-readable message
    details?: any;         // Additional context
    field?: string;        // For validation errors
  };
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}
```

#### 2. **Pagination Standardization**

Currently, pagination is inconsistent:
- Some use `limit`/`offset`
- Some don't support pagination
- Response formats vary

**Recommendation:** Standard pagination format:
```typescript
// Request
{
  page?: number;        // 1-indexed
  pageSize?: number;    // Default: 50, max: 100
  cursor?: string;      // For cursor-based pagination
}

// Response
{
  ok: true;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    cursor?: {
      next?: string;
      prev?: string;
    };
  };
}
```

#### 3. **Error Code Standardization**

Error codes should follow a consistent pattern:
```
DOMAIN_REASON_CONTEXT

Examples:
- AUTH_TOKEN_EXPIRED
- GUILD_NOT_FOUND
- VALIDATION_FIELD_REQUIRED
- RATE_LIMIT_EXCEEDED
- PERMISSION_INSUFFICIENT
```

Common HTTP status codes mapping:
- `400` - Validation errors, bad request format
- `401` - Authentication required, invalid credentials
- `403` - Permission denied, insufficient role
- `404` - Resource not found
- `409` - Conflict (duplicate resource)
- `422` - Unprocessable entity (semantic errors)
- `429` - Rate limit exceeded
- `500` - Internal server error
- `503` - Service unavailable, dependency failure

#### 4. **Naming Conventions**

**Endpoints:**
- Use plural nouns for collections: `/api/guilds`, `/api/conversations`
- Use verbs for actions: `/api/chat/send`, `/api/snail/analyze`
- Prefer kebab-case: `/api/guild-settings` over `/api/guildSettings`

**Fields:**
- Use camelCase consistently (already mostly followed)
- Boolean fields should use `is`, `has`, `should` prefix: `isActive`, `hasAccess`
- Timestamp fields should end with `At`: `createdAt`, `updatedAt`, `expiresAt`

#### 5. **Authentication & Authorization**

**Current State:**
- Admin API: JWT in cookie
- Web API: Trust upstream headers

**Recommendations:**
- Add support for Bearer token authentication for API clients
- Implement API key system for service-to-service auth
- Add OAuth2 client credentials flow for third-party integrations
- Consider adding webhook signatures for outbound events

**Proposed auth header hierarchy:**
1. `Authorization: Bearer <token>` - API tokens
2. `X-API-Key: <key>` - Service keys
3. Cookie `__session` - User sessions
4. Upstream headers - Reverse proxy (current web setup)

#### 6. **Versioning Strategy**

Currently no API versioning. Consider:
- URL versioning: `/api/v1/guilds`, `/api/v2/guilds`
- Header versioning: `Accept: application/vnd.slimy.v1+json`
- Content negotiation for breaking changes

**Recommendation:** Start with URL versioning when first breaking change is needed.

#### 7. **Rate Limiting**

**Current State:**
- Inconsistent rate limiting
- Web chat bot: 5 req/min per IP
- Admin API: Has rate limiting middleware but not documented

**Recommendations:**
- Standardize rate limit headers (following RFC 6585):
  ```
  X-RateLimit-Limit: 60
  X-RateLimit-Remaining: 45
  X-RateLimit-Reset: 1640000000
  Retry-After: 60
  ```
- Document rate limits per endpoint
- Tiered limits based on user role:
  - Public/unauthenticated: 10 req/min
  - Member: 60 req/min
  - Club: 120 req/min
  - Admin: 300 req/min

#### 8. **Caching Strategy**

**Current State:**
- Mix of no-cache, short cache (60s), medium cache (300s-600s)
- Some use `revalidate`, some use `Cache-Control` headers
- Not always consistent

**Recommendations:**
- Define clear cache tiers:
  - `no-store` - Auth, user-specific data
  - `max-age=60` - Real-time data (stats, health)
  - `max-age=300` - Semi-static data (guild lists)
  - `max-age=3600` - Static data (docs, configs)
- Always include `ETag` for conditional requests
- Use `stale-while-revalidate` for better UX
- Add cache status header: `X-Cache: HIT|MISS|STALE`

#### 9. **Webhook Support**

Consider adding webhooks for async events:
- Guild member joined/left
- Stats updated
- Code expired
- Analysis completed

**Webhook payload format:**
```typescript
{
  event: string;           // e.g., "guild.member.joined"
  timestamp: string;
  data: any;
  webhook: {
    id: string;
    attempt: number;
  };
  signature: string;       // HMAC for verification
}
```

#### 10. **API Documentation**

**Current State:** This catalog document

**Recommendations:**
- Generate OpenAPI (Swagger) spec from route definitions
- Host interactive API docs (Swagger UI / Redoc)
- Add request/response examples to all endpoints
- Document error scenarios comprehensively
- Add code samples for common use cases

#### 11. **GraphQL Consideration**

For complex data fetching needs (especially guild data with nested relationships), consider adding a GraphQL endpoint alongside REST:
- Better for frontend flexibility
- Reduces over-fetching
- Built-in type system
- Can coexist with REST

**Example GraphQL schema:**
```graphql
type Guild {
  id: ID!
  name: String!
  settings: GuildSettings
  members(limit: Int, offset: Int): MemberConnection
  stats: StatsData
}

type Query {
  guild(id: ID!): Guild
  guilds(filter: GuildFilter): [Guild!]!
  me: User
}
```

#### 12. **Field Selection / Sparse Fieldsets**

Add support for selecting specific fields to reduce payload size:
```
GET /api/guilds?fields=id,name,icon
GET /api/guilds/:id?include=settings,members
```

#### 13. **Batch Operations**

Add batch endpoints for efficiency:
```
POST /api/batch
{
  operations: [
    { method: "GET", path: "/api/guilds/123" },
    { method: "GET", path: "/api/guilds/456" }
  ]
}
```

#### 14. **Audit Logging**

**Current State:** Some endpoints create audit logs

**Recommendations:**
- Standardize audit log format across all write operations
- Add audit log query API for admins
- Include: who, what, when, where (IP), why (reason field)
- Retention policy for audit logs

#### 15. **Request ID Tracing**

Add request ID to all responses for debugging:
```
X-Request-ID: req_1234567890abcdef
```

Include in logs, errors, and pass through to downstream services.

---

## Implementation Recommendations

### Phase 1: Quick Wins (Low effort, high impact)
1. Add consistent `X-Request-ID` to all responses
2. Standardize error response format
3. Add rate limit headers where missing
4. Document existing rate limits
5. Add OpenAPI schema generation

### Phase 2: Consistency (Medium effort)
1. Implement consistent pagination
2. Standardize error codes
3. Add ETag support for cacheable endpoints
4. Improve cache header consistency
5. Add field selection support

### Phase 3: Advanced Features (High effort)
1. API versioning system
2. GraphQL endpoint
3. Webhook system
4. OAuth2 for third-party apps
5. Batch operations API
6. Interactive API documentation portal

### Backward Compatibility
- Don't break existing endpoints without versioning
- Add new fields as optional
- Deprecate old endpoints with warnings before removal
- Provide migration guides for breaking changes
- Support both old and new formats during transition periods

---

**Document Version:** 1.0
**Maintainer:** Engineering Team
**Last Review:** 2025-11-19
