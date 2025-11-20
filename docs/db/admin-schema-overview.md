# Admin API Database Schema Overview

## Overview

The admin API uses **PostgreSQL** as its database, managed through **Prisma ORM**. The schema is designed to support a Discord bot admin panel with features including:

- User authentication & authorization (Discord OAuth)
- Guild (Discord server) management
- Role-based access control (RBAC)
- Chat conversations & messaging
- Statistics tracking & analytics
- Club & screenshot analysis (AI-powered)
- Comprehensive audit logging

**Schema Location**: `apps/admin-api/prisma/schema.prisma`

---

## Core Models/Tables

### 1. User
**Table**: `users`
**Purpose**: Stores Discord user information and serves as the central identity in the system.

**Key Fields**:
- `id` (String, CUID): Primary key
- `discordId` (String, unique): Discord's user ID - the source of truth
- `username` (String?): Discord username
- `globalName` (String?): Discord display name
- `avatar` (String?): Avatar URL/hash
- `createdAt`, `updatedAt`: Timestamps

**Relations**: Users can have multiple sessions, belong to multiple guilds, create conversations, generate stats, perform analyses, and trigger audit logs.

---

### 2. Session
**Table**: `sessions`
**Purpose**: Manages user authentication sessions with JWT tokens.

**Key Fields**:
- `id` (String, CUID): Primary key
- `userId` (String, FK): References User
- `token` (String, unique): JWT or session token
- `expiresAt` (DateTime): Token expiration time
- `createdAt`: Session creation timestamp

**Relations**: Each session belongs to one user. Sessions cascade delete when user is deleted.

**Indexes**: Optimized for lookups by userId, expiresAt, token, and combination queries.

---

### 3. Guild
**Table**: `guilds`
**Purpose**: Represents Discord servers/guilds that use the admin panel.

**Key Fields**:
- `id` (String, CUID): Primary key
- `discordId` (String, unique): Discord's guild ID
- `name` (String): Guild name
- `settings` (JSON?): Flexible JSON object for guild-specific configuration
- `createdAt`, `updatedAt`: Timestamps

**Relations**: Guilds have many users (through UserGuild), stats, chat messages, and club analyses.

---

### 4. UserGuild
**Table**: `user_guilds`
**Purpose**: Many-to-many join table linking users to guilds with role information.

**Key Fields**:
- `id` (String, CUID): Primary key
- `userId` (String, FK): References User
- `guildId` (String, FK): References Guild
- `roles` (JSON?): Array of role strings (e.g., ["admin", "moderator"])

**Constraints**:
- Unique constraint on `[userId, guildId]` - a user can only be in a guild once
- Both relations cascade delete

---

### 5. Conversation
**Table**: `conversations`
**Purpose**: Groups related chat messages into conversations/threads.

**Key Fields**:
- `id` (String, CUID): Primary key
- `userId` (String, FK): Conversation owner
- `title` (String?): Optional conversation title
- `createdAt`, `updatedAt`: Timestamps

**Relations**: Belongs to a user, contains multiple chat messages.

---

### 6. ChatMessage
**Table**: `chat_messages`
**Purpose**: Stores individual chat messages with support for both conversation-based and guild-based messages.

**Key Fields**:
- `id` (String, CUID): Primary key
- `conversationId` (String?, FK): Optional conversation reference
- `userId` (String, FK): Message author
- `guildId` (String?, FK): Optional guild context
- `text` (String): Message content
- `adminOnly` (Boolean): Flag for admin-only messages
- `createdAt`: Timestamp

**Relations**:
- Optional conversation (SetNull on delete)
- Required user (cascade delete)
- Optional guild (SetNull on delete)

**Indexes**: Heavily indexed for time-series queries across users, guilds, conversations, and admin-only flags.

---

### 7. Stat
**Table**: `stats`
**Purpose**: Flexible statistics and analytics storage with JSON values.

**Key Fields**:
- `id` (String, CUID): Primary key
- `userId` (String?, FK): Optional user context
- `guildId` (String?, FK): Optional guild context
- `type` (String): Stat type (e.g., 'message_count', 'command_usage')
- `value` (JSON): Flexible value storage (number, string, object, array)
- `timestamp`: When the stat was recorded

**Relations**: Optionally belongs to user and/or guild (both cascade delete).

**Indexes**: Optimized for time-series queries by type, user, guild, and combinations.

---

### 8. ClubAnalysis
**Table**: `club_analyses`
**Purpose**: Stores AI-powered analysis results for club/guild data.

**Key Fields**:
- `id` (String, CUID): Primary key
- `guildId` (String, FK): Guild being analyzed
- `userId` (String, FK): User who initiated analysis
- `title` (String?): Optional analysis title
- `summary` (String): AI-generated summary
- `confidence` (Float): Confidence score (0-1)
- `createdAt`, `updatedAt`: Timestamps

**Relations**:
- Belongs to guild and user (both cascade delete)
- Has many images and metrics

**Indexes**: Indexed by guild, user, time, and confidence for filtering and sorting.

---

### 9. ClubAnalysisImage
**Table**: `club_analysis_images`
**Purpose**: Stores images uploaded for club analysis.

**Key Fields**:
- `id` (String, CUID): Primary key
- `analysisId` (String, FK): Parent analysis
- `imageUrl` (String): URL to stored image
- `originalName` (String): Original filename
- `fileSize` (Int): Size in bytes
- `uploadedAt`: Upload timestamp

**Relations**: Belongs to ClubAnalysis (cascade delete).

---

### 10. ClubMetric
**Table**: `club_metrics`
**Purpose**: Individual metrics extracted from club analyses.

**Key Fields**:
- `id` (String, CUID): Primary key
- `analysisId` (String, FK): Parent analysis
- `name` (String): Metric name (e.g., 'totalMembers', 'performanceScore')
- `value` (JSON): Metric value
- `unit` (String?): Optional unit (e.g., 'count', 'percentage')
- `category` (String): Category (e.g., 'membership', 'performance')

**Constraints**: Unique constraint on `[analysisId, name]` - no duplicate metrics per analysis.

---

### 11. ScreenshotAnalysis
**Table**: `screenshot_analyses`
**Purpose**: AI-powered analysis of game screenshots, leaderboards, stats, etc.

**Key Fields**:
- `id` (String, CUID): Primary key
- `userId` (String, FK): User who uploaded screenshot
- `screenshotType` (String): Type (game-stats, leaderboard, etc.)
- `imageUrl` (String): Screenshot URL
- `title`, `description`, `summary`: Analysis text fields
- `confidence` (Float): AI confidence (0-1)
- `processingTime` (Int): Processing time in ms
- `modelUsed` (String): AI model identifier
- `rawResponse` (JSON?): Raw AI response data
- `createdAt`, `updatedAt`: Timestamps

**Relations**:
- Belongs to user (cascade delete)
- Has many data points, tags, insights, recommendations
- Can be part of comparisons (as analysis1 or analysis2)

---

### 12. ScreenshotData
**Table**: `screenshot_data`
**Purpose**: Structured data extracted from screenshots (levels, scores, ranks, etc.).

**Key Fields**:
- `id` (String, CUID): Primary key
- `analysisId` (String, FK): Parent analysis
- `key` (String): Data key (e.g., 'level', 'score')
- `value` (JSON): Extracted value
- `dataType` (String): Type hint (string, number, object, array)
- `category` (String): Category (stats, metadata, ui-elements)
- `confidence` (Float?): Per-field confidence

**Constraints**: Unique constraint on `[analysisId, key]`.

---

### 13. ScreenshotTag
**Table**: `screenshot_tags`
**Purpose**: Tags/labels for categorizing screenshot analyses.

**Key Fields**:
- `id` (String, CUID): Primary key
- `analysisId` (String, FK): Parent analysis
- `tag` (String): Tag name
- `category` (String?): Tag category (content, feature, quality)

**Constraints**: Unique constraint on `[analysisId, tag]`.

---

### 14. ScreenshotComparison
**Table**: `screenshot_comparisons`
**Purpose**: Compares two screenshot analyses to identify trends and differences.

**Key Fields**:
- `id` (String, CUID): Primary key
- `userId` (String, FK): User who requested comparison
- `analysisId1`, `analysisId2` (String, FK): The two analyses being compared
- `comparisonType` (String): Type (difference, trend, similarity)
- `summary` (String): Comparison summary
- `trend` (String): Overall trend (improving, declining, stable, unknown)
- `differences` (JSON): Detailed differences
- `insights` (JSON): Key insights
- `createdAt`: Timestamp

**Constraints**: Unique constraint on `[analysisId1, analysisId2, comparisonType]`.

---

### 15. ScreenshotInsight
**Table**: `screenshot_insights`
**Purpose**: AI-generated insights from screenshot analysis.

**Key Fields**:
- `id` (String, CUID): Primary key
- `analysisId` (String, FK): Parent analysis
- `type` (String): Insight type (performance, ui, content)
- `priority` (String): Priority level (high, medium, low)
- `title`, `description`: Insight text
- `confidence` (Float): Confidence score
- `actionable` (Boolean): Whether insight suggests action
- `createdAt`: Timestamp

---

### 16. ScreenshotRecommendation
**Table**: `screenshot_recommendations`
**Purpose**: Actionable recommendations based on screenshot analysis.

**Key Fields**:
- `id` (String, CUID): Primary key
- `analysisId` (String, FK): Parent analysis
- `type` (String): Recommendation type (improvement, optimization, feature)
- `priority` (String): Priority level
- `title`, `description`: Recommendation text
- `impact` (String): Expected impact (high, medium, low)
- `effort` (String): Implementation effort (high, medium, low)
- `actionable` (Boolean): Whether actionable (default true)
- `createdAt`: Timestamp

---

### 17. AuditLog
**Table**: `audit_logs`
**Purpose**: Comprehensive audit trail for compliance, security, and debugging.

**Key Fields**:
- `id` (String, CUID): Primary key
- `userId` (String?, FK): User who performed action (null for system actions)
- `action` (String): Action performed (e.g., 'login', 'chat_message')
- `resourceType` (String): Resource type (e.g., 'user', 'chat', 'guild')
- `resourceId` (String): ID of affected resource
- `details` (JSON?): Additional action details
- `ipAddress`, `userAgent`: Request metadata
- `sessionId`, `requestId`: Tracking identifiers
- `timestamp`: When action occurred
- `success` (Boolean): Whether action succeeded
- `errorMessage` (String?): Error message if failed

**Relations**: Optionally references user (SetNull on delete to preserve audit trail).

**Indexes**: Heavily indexed for audit queries by user, action, resource type, time, success status, and request ID.

---

## Entity Relationship Diagram (ASCII)

```
┌─────────────────┐
│      User       │
│─────────────────│
│ id (PK)         │◄──────────┐
│ discordId (UQ)  │           │
│ username        │           │
│ globalName      │           │
│ avatar          │           │
└────────┬────────┘           │
         │                    │
         │ 1:N                │ N:1
         │                    │
    ┌────▼──────────┐    ┌────┴──────────────┐
    │   Session     │    │   UserGuild       │
    │───────────────│    │───────────────────│
    │ id (PK)       │    │ id (PK)           │
    │ userId (FK)   │    │ userId (FK)       │
    │ token (UQ)    │    │ guildId (FK)      │
    │ expiresAt     │    │ roles (JSON)      │
    └───────────────┘    └────┬──────────────┘
                              │
                              │ N:1
                              │
    ┌─────────────────┐  ┌────▼────────────┐
    │  Conversation   │  │     Guild       │
    │─────────────────│  │─────────────────│
    │ id (PK)         │  │ id (PK)         │◄──────┐
    │ userId (FK) ────┼──┤ discordId (UQ)  │       │
    │ title           │  │ name            │       │
    └────────┬────────┘  │ settings (JSON) │       │
             │           └────────┬────────┘       │
             │ 1:N                │                │
             │                    │ 1:N            │
        ┌────▼─────────────┐      │                │
        │   ChatMessage    │◄─────┘                │
        │──────────────────│                       │
        │ id (PK)          │                       │
        │ conversationId   │                       │
        │ userId (FK) ─────┼───────────────────────┘
        │ guildId (FK)     │
        │ text             │
        │ adminOnly        │
        └──────────────────┘


    ┌──────────────────┐
    │      Stat        │          ┌────────────────────┐
    │──────────────────│          │   ClubAnalysis     │
    │ id (PK)          │          │────────────────────│
    │ userId (FK) ─────┼──────────┤ id (PK)            │
    │ guildId (FK) ────┼──────┐   │ guildId (FK) ──────┼───► Guild
    │ type             │      │   │ userId (FK) ───────┼───► User
    │ value (JSON)     │      │   │ title              │
    │ timestamp        │      │   │ summary            │
    └──────────────────┘      │   │ confidence         │
                              │   └────────┬───────────┘
                              │            │
                              │            │ 1:N
                              │       ┌────▼────────────────────┐
                              │       │  ClubAnalysisImage      │
                              │       │─────────────────────────│
                              │       │ id (PK)                 │
                              │       │ analysisId (FK)         │
                              │       │ imageUrl                │
                              └───────┤ originalName            │
                                      │ fileSize                │
                                      └─────────────────────────┘

                                      ┌─────────────────────────┐
                                      │     ClubMetric          │
                                      │─────────────────────────│
                                      │ id (PK)                 │
                                      │ analysisId (FK) ────────┼───► ClubAnalysis
                                      │ name                    │
                                      │ value (JSON)            │
                                      │ unit                    │
                                      │ category                │
                                      └─────────────────────────┘


    ┌─────────────────────────┐
    │  ScreenshotAnalysis     │◄────────────────────────┐
    │─────────────────────────│                         │
    │ id (PK)                 │                         │
    │ userId (FK) ────────────┼───► User                │
    │ screenshotType          │                         │
    │ imageUrl                │                         │
    │ summary                 │                         │
    │ confidence              │                         │
    │ modelUsed               │                         │
    └───────┬─────────────────┘                         │
            │                                           │
            │ 1:N                                       │
            │                                           │
     ┌──────▼──────────────┐                           │
     │  ScreenshotData     │                           │
     │─────────────────────│                           │
     │ id (PK)             │                           │
     │ analysisId (FK)     │                           │
     │ key                 │                           │
     │ value (JSON)        │                           │
     │ category            │                           │
     └─────────────────────┘                           │
                                                       │
     ┌─────────────────────┐                           │
     │  ScreenshotTag      │                           │
     │─────────────────────│                           │
     │ id (PK)             │                           │
     │ analysisId (FK) ────┼───────────────────────────┘
     │ tag                 │
     │ category            │
     └─────────────────────┘

     ┌──────────────────────┐
     │ ScreenshotInsight    │
     │──────────────────────│
     │ id (PK)              │
     │ analysisId (FK) ─────┼───► ScreenshotAnalysis
     │ type                 │
     │ priority             │
     │ title                │
     │ confidence           │
     │ actionable           │
     └──────────────────────┘

     ┌────────────────────────────┐
     │ ScreenshotRecommendation   │
     │────────────────────────────│
     │ id (PK)                    │
     │ analysisId (FK) ───────────┼───► ScreenshotAnalysis
     │ type                       │
     │ priority                   │
     │ impact                     │
     │ effort                     │
     │ actionable                 │
     └────────────────────────────┘

     ┌─────────────────────────┐
     │ ScreenshotComparison    │
     │─────────────────────────│
     │ id (PK)                 │
     │ userId (FK) ────────────┼───► User
     │ analysisId1 (FK) ───────┼───► ScreenshotAnalysis
     │ analysisId2 (FK) ───────┼───► ScreenshotAnalysis
     │ comparisonType          │
     │ summary                 │
     │ trend                   │
     │ differences (JSON)      │
     │ insights (JSON)         │
     └─────────────────────────┘


    ┌──────────────────┐
    │    AuditLog      │
    │──────────────────│
    │ id (PK)          │
    │ userId (FK)      │────► User (SetNull)
    │ action           │
    │ resourceType     │
    │ resourceId       │
    │ details (JSON)   │
    │ ipAddress        │
    │ userAgent        │
    │ sessionId        │
    │ requestId        │
    │ success          │
    │ errorMessage     │
    └──────────────────┘
```

---

## Common Queries

### Find All Guilds for a User

**Prisma**:
```typescript
const userGuilds = await prisma.userGuild.findMany({
  where: { userId: 'user_cuid_here' },
  include: {
    guild: true, // Include full guild details
  },
});
```

**Pseudo-SQL**:
```sql
SELECT g.*, ug.roles
FROM guilds g
JOIN user_guilds ug ON g.id = ug.guild_id
WHERE ug.user_id = 'user_cuid_here';
```

---

### Find Active Sessions for a User

**Prisma**:
```typescript
const activeSessions = await prisma.session.findMany({
  where: {
    userId: 'user_cuid_here',
    expiresAt: {
      gt: new Date(), // Greater than now
    },
  },
  orderBy: { createdAt: 'desc' },
});
```

**Pseudo-SQL**:
```sql
SELECT *
FROM sessions
WHERE user_id = 'user_cuid_here'
  AND expires_at > NOW()
ORDER BY created_at DESC;
```

---

### Log an Audit Action

**Prisma**:
```typescript
await prisma.auditLog.create({
  data: {
    userId: 'user_cuid_here',
    action: 'update_guild_settings',
    resourceType: 'guild',
    resourceId: 'guild_cuid_here',
    details: {
      settingsChanged: ['theme', 'timezone'],
    },
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0...',
    sessionId: 'session_cuid_here',
    requestId: 'req_xyz123',
    success: true,
  },
});
```

**Pseudo-SQL**:
```sql
INSERT INTO audit_logs (
  user_id, action, resource_type, resource_id,
  details, ip_address, user_agent, session_id,
  request_id, success, timestamp
)
VALUES (
  'user_cuid_here', 'update_guild_settings', 'guild', 'guild_cuid_here',
  '{"settingsChanged": ["theme", "timezone"]}', '192.168.1.1',
  'Mozilla/5.0...', 'session_cuid_here', 'req_xyz123', true, NOW()
);
```

---

### Get User's Recent Chat Messages in a Guild

**Prisma**:
```typescript
const messages = await prisma.chatMessage.findMany({
  where: {
    userId: 'user_cuid_here',
    guildId: 'guild_cuid_here',
  },
  orderBy: { createdAt: 'desc' },
  take: 50,
  include: {
    conversation: true,
  },
});
```

**Pseudo-SQL**:
```sql
SELECT cm.*, c.title as conversation_title
FROM chat_messages cm
LEFT JOIN conversations c ON cm.conversation_id = c.id
WHERE cm.user_id = 'user_cuid_here'
  AND cm.guild_id = 'guild_cuid_here'
ORDER BY cm.created_at DESC
LIMIT 50;
```

---

### Get Statistics for a Guild Over Time

**Prisma**:
```typescript
const stats = await prisma.stat.findMany({
  where: {
    guildId: 'guild_cuid_here',
    type: 'message_count',
    timestamp: {
      gte: new Date('2024-01-01'),
      lte: new Date('2024-12-31'),
    },
  },
  orderBy: { timestamp: 'asc' },
});
```

**Pseudo-SQL**:
```sql
SELECT *
FROM stats
WHERE guild_id = 'guild_cuid_here'
  AND type = 'message_count'
  AND timestamp BETWEEN '2024-01-01' AND '2024-12-31'
ORDER BY timestamp ASC;
```

---

### Get Latest Club Analysis with Images and Metrics

**Prisma**:
```typescript
const analysis = await prisma.clubAnalysis.findFirst({
  where: { guildId: 'guild_cuid_here' },
  orderBy: { createdAt: 'desc' },
  include: {
    images: true,
    metrics: true,
    user: {
      select: { username: true, discordId: true },
    },
  },
});
```

**Pseudo-SQL**:
```sql
-- Main analysis
SELECT ca.*, u.username, u.discord_id
FROM club_analyses ca
JOIN users u ON ca.user_id = u.id
WHERE ca.guild_id = 'guild_cuid_here'
ORDER BY ca.created_at DESC
LIMIT 1;

-- Related images
SELECT * FROM club_analysis_images
WHERE analysis_id = '<analysis_id_from_above>';

-- Related metrics
SELECT * FROM club_metrics
WHERE analysis_id = '<analysis_id_from_above>';
```

---

### Find Screenshot Analyses by Type with Insights

**Prisma**:
```typescript
const analyses = await prisma.screenshotAnalysis.findMany({
  where: {
    userId: 'user_cuid_here',
    screenshotType: 'game-stats',
    confidence: { gte: 0.7 }, // High confidence only
  },
  orderBy: { createdAt: 'desc' },
  take: 10,
  include: {
    insights: {
      where: { priority: 'high' },
    },
    recommendations: {
      where: { actionable: true },
    },
  },
});
```

**Pseudo-SQL**:
```sql
SELECT sa.*
FROM screenshot_analyses sa
WHERE sa.user_id = 'user_cuid_here'
  AND sa.screenshot_type = 'game-stats'
  AND sa.confidence >= 0.7
ORDER BY sa.created_at DESC
LIMIT 10;

-- High-priority insights
SELECT si.*
FROM screenshot_insights si
WHERE si.analysis_id IN (<analysis_ids_from_above>)
  AND si.priority = 'high';

-- Actionable recommendations
SELECT sr.*
FROM screenshot_recommendations sr
WHERE sr.analysis_id IN (<analysis_ids_from_above>)
  AND sr.actionable = true;
```

---

### Check User Roles in a Guild

**Prisma**:
```typescript
const userGuild = await prisma.userGuild.findUnique({
  where: {
    userId_guildId: {
      userId: 'user_cuid_here',
      guildId: 'guild_cuid_here',
    },
  },
});

const roles = userGuild?.roles as string[] || [];
const isAdmin = roles.includes('admin');
```

**Pseudo-SQL**:
```sql
SELECT roles
FROM user_guilds
WHERE user_id = 'user_cuid_here'
  AND guild_id = 'guild_cuid_here';

-- Then check if 'admin' is in the JSON array
```

---

### Get Audit Trail for a Resource

**Prisma**:
```typescript
const auditTrail = await prisma.auditLog.findMany({
  where: {
    resourceType: 'guild',
    resourceId: 'guild_cuid_here',
  },
  orderBy: { timestamp: 'desc' },
  take: 100,
  include: {
    user: {
      select: { username: true, discordId: true },
    },
  },
});
```

**Pseudo-SQL**:
```sql
SELECT al.*, u.username, u.discord_id
FROM audit_logs al
LEFT JOIN users u ON al.user_id = u.id
WHERE al.resource_type = 'guild'
  AND al.resource_id = 'guild_cuid_here'
ORDER BY al.timestamp DESC
LIMIT 100;
```

---

### Compare Two Screenshot Analyses

**Prisma**:
```typescript
const comparison = await prisma.screenshotComparison.findUnique({
  where: {
    analysisId1_analysisId2_comparisonType: {
      analysisId1: 'analysis1_id',
      analysisId2: 'analysis2_id',
      comparisonType: 'trend',
    },
  },
  include: {
    analysis1: {
      include: { data: true },
    },
    analysis2: {
      include: { data: true },
    },
  },
});
```

**Pseudo-SQL**:
```sql
SELECT sc.*
FROM screenshot_comparisons sc
WHERE sc.analysis_id_1 = 'analysis1_id'
  AND sc.analysis_id_2 = 'analysis2_id'
  AND sc.comparison_type = 'trend';
```

---

## Schema Gotchas & Risks

### 1. Cascade Deletes - Data Loss Risk

**Issue**: Many relations use `onDelete: Cascade`, which automatically deletes related records.

**Examples**:
- Deleting a **User** cascades to: Sessions, UserGuilds, Conversations, ChatMessages, Stats, ClubAnalyses, ScreenshotAnalyses, ScreenshotComparisons
- Deleting a **Guild** cascades to: UserGuilds, Stats, ChatMessages, ClubAnalyses
- Deleting a **ClubAnalysis** cascades to: ClubAnalysisImages, ClubMetrics
- Deleting a **ScreenshotAnalysis** cascades to: ScreenshotData, Tags, Insights, Recommendations, Comparisons

**Risk**: Accidentally deleting a user or guild can cause massive data loss.

**Mitigation**:
- Implement soft deletes (add `deletedAt` timestamp instead of hard delete)
- Add confirmation flows in the application
- Regular database backups
- Consider archiving data before deletion

---

### 2. SetNull Delete Behavior - Orphaned References

**Issue**: Some relations use `onDelete: SetNull` instead of Cascade.

**Examples**:
- ChatMessage → Conversation (SetNull)
- ChatMessage → Guild (SetNull)
- AuditLog → User (SetNull)

**Risk**:
- Chat messages can become orphaned if their conversation is deleted
- Audit logs preserve history even after user deletion (intentional for compliance)
- Guild context may be lost from chat messages

**Gotcha**: When querying these relations, always handle null cases:
```typescript
// Bad - assumes conversation exists
message.conversation.title

// Good - handles null
message.conversation?.title ?? 'Deleted Conversation'
```

---

### 3. Nullable Foreign Keys - Optional Relations

**Issue**: Many foreign keys are nullable (e.g., `guildId`, `conversationId`, `userId` in Stats).

**Risk**: Queries filtering by these fields may miss null records.

**Example**:
```typescript
// This misses stats with null userId
const userStats = await prisma.stat.findMany({
  where: { userId: 'user_id' }
});

// To include system-level stats:
const allStats = await prisma.stat.findMany({
  where: {
    OR: [
      { userId: 'user_id' },
      { userId: null },
    ],
  },
});
```

---

### 4. JSON Fields - No Type Safety

**Issue**: Several fields use `Json` type for flexibility.

**Fields**:
- Guild.settings
- UserGuild.roles
- Stat.value
- ClubMetric.value
- ScreenshotData.value
- ChatMessage details in various models
- AuditLog.details
- ScreenshotComparison.differences & insights

**Risks**:
- No schema validation at DB level
- Type safety lost in TypeScript unless manually typed
- Querying JSON fields is DB-specific and less performant
- Migration challenges if structure changes

**Mitigation**:
- Define TypeScript types/interfaces for common JSON structures
- Use Zod or similar for runtime validation
- Document expected JSON schemas
- Consider extracting frequently-queried JSON fields into proper columns

---

### 5. Unique Constraints - Potential Race Conditions

**Unique Constraints**:
- User.discordId
- Guild.discordId
- Session.token
- UserGuild.[userId, guildId]
- ClubMetric.[analysisId, name]
- ScreenshotData.[analysisId, key]
- ScreenshotTag.[analysisId, tag]
- ScreenshotComparison.[analysisId1, analysisId2, comparisonType]

**Risk**: Concurrent inserts can cause unique constraint violations.

**Mitigation**:
- Use `upsert` operations instead of separate find + create
- Implement proper error handling for constraint violations
- Use transactions for multi-step operations

---

### 6. CUID Primary Keys - Non-Sequential

**Issue**: All tables use CUID (Collision-resistant Unique IDentifier) instead of auto-increment integers.

**Pros**:
- No ID collision in distributed systems
- IDs are URL-safe
- Harder to enumerate/scrape records

**Cons**:
- Larger index size (25 characters vs 4-8 bytes for int)
- No natural ordering (use createdAt for time-based queries)
- Slightly slower joins compared to integer keys

**Gotcha**: Don't assume higher IDs are newer - always sort by `createdAt` for chronological order.

---

### 7. Index Heavy Schema - Write Performance

**Issue**: Schema has extensive indexing for read optimization.

**Examples**:
- ChatMessage: 8 indexes
- Stat: 10 indexes
- AuditLog: 9 indexes
- ScreenshotAnalysis: 7 indexes

**Risk**:
- Insert/update operations slower due to index maintenance
- Higher storage requirements
- Index overhead on bulk operations

**Mitigation**:
- Acceptable trade-off for read-heavy workload
- Use batch operations for bulk inserts
- Consider disabling indexes during large data imports

---

### 8. Timestamp Fields - Timezone Awareness

**Issue**: PostgreSQL timestamps may not include timezone info depending on configuration.

**Fields**: All `createdAt`, `updatedAt`, `timestamp`, `expiresAt`, `uploadedAt` fields.

**Risk**:
- Timezone confusion in distributed teams
- Daylight saving time issues
- Comparing timestamps across different timezones

**Mitigation**:
- Always store in UTC
- Convert to user's timezone only in presentation layer
- Use `timestamptz` (timestamp with timezone) in PostgreSQL if not already

---

### 9. AuditLog Data Retention

**Issue**: AuditLog table will grow indefinitely with no built-in retention policy.

**Risk**:
- Database bloat
- Slower queries over time
- Storage costs

**Mitigation**:
- Implement data retention policy (e.g., archive logs older than 1 year)
- Partition table by timestamp
- Implement log rotation/archival process
- Add monitoring for table size

---

### 10. Session Token Storage

**Issue**: Session tokens stored in plain text in database.

**Risk**: If database is compromised, all session tokens are exposed.

**Mitigation**:
- Hash tokens before storing (like passwords)
- Short expiration times (already implemented with `expiresAt`)
- Implement token rotation
- Add session invalidation endpoints
- Monitor for suspicious session activity

---

### 11. Missing Soft Delete Support

**Issue**: No `deletedAt` field in any table.

**Risk**: Hard deletes are permanent and can't be undone.

**Mitigation**:
- Add `deletedAt DateTime?` to critical tables
- Modify queries to exclude soft-deleted records by default
- Periodic cleanup of old soft-deleted records

---

### 12. Guild Settings as JSON Blob

**Issue**: Guild.settings is unstructured JSON.

**Risk**:
- No validation of setting keys/values
- Hard to query specific settings
- Migration difficulties when settings schema changes
- No defaults enforced at DB level

**Mitigation**:
- Define strict TypeScript types for settings
- Validate settings on API layer
- Document all possible settings and their types
- Consider extracting frequently-used settings to columns

---

### 13. Role-Based Access Control in JSON

**Issue**: UserGuild.roles stored as JSON array.

**Risk**:
- Can't query "all users with admin role" efficiently
- No referential integrity to role definitions
- Typos in role names won't be caught
- Role hierarchy not enforced at DB level

**Mitigation**:
- Create a separate Role and UserRole tables for proper RBAC
- Validate roles against whitelist in application code
- Index the JSON field if PostgreSQL supports it
- Document all valid role values

---

### 14. Confidence Scores - No Validation

**Issue**: Confidence fields (Float) have no check constraints.

**Fields**: ClubAnalysis.confidence, ScreenshotAnalysis.confidence, ScreenshotData.confidence, ScreenshotInsight.confidence

**Risk**: Values outside 0-1 range could be stored.

**Mitigation**:
```sql
ALTER TABLE club_analyses
ADD CONSTRAINT confidence_range
CHECK (confidence >= 0 AND confidence <= 1);
```

---

### 15. Screenshot Comparison Cycles

**Issue**: ScreenshotComparison can create cycles (A compared to B, B compared to A).

**Current Protection**: Unique constraint on `[analysisId1, analysisId2, comparisonType]`

**Risk**: Still allows bidirectional comparisons with swapped IDs.

**Mitigation**:
- Application logic to always order IDs (e.g., lower ID as analysisId1)
- Additional check constraint to enforce ordering

---

## Performance Considerations

### Index Strategy
- **Heavy indexing** optimized for read operations
- Composite indexes for common query patterns
- Trade-off: slower writes, faster reads

### JSON Field Queries
- Querying JSON fields (settings, roles, value) is less efficient
- Consider extracting frequently-queried JSON fields to proper columns
- Use PostgreSQL JSON operators for queries when needed

### Time-Series Data
- Stats, AuditLogs, ChatMessages are time-series heavy
- Consider partitioning by timestamp for large datasets
- Regular archival of old data recommended

### N+1 Query Prevention
- Use Prisma's `include` and `select` carefully
- Batch related data fetches
- Monitor query patterns in production

---

## Migration & Evolution Tips

1. **JSON Schema Changes**: Document JSON field structures and version them
2. **New Required Fields**: Add as nullable first, backfill, then make required
3. **Index Management**: Add indexes concurrently in PostgreSQL to avoid locks
4. **Data Archival**: Plan retention policies early
5. **Soft Deletes**: Consider before hard deletes become standard
6. **Audit Everything**: The AuditLog table is your friend for debugging

---

## Security Notes

- **No sensitive data encryption** at rest (consider for PII)
- **Session tokens** stored in plain text (consider hashing)
- **IP addresses** in audit logs (privacy/GDPR consideration)
- **User agents** stored (can contain sensitive info)
- **Discord IDs** are publicly visible on Discord (not sensitive)

---

## Backup & Recovery Recommendations

1. **Regular backups** with point-in-time recovery enabled
2. **Test restore procedures** regularly
3. **Critical tables** for backup priority:
   - users (identity)
   - guilds (configuration)
   - user_guilds (permissions)
   - audit_logs (compliance)
4. **Cascade deletes** make backups more critical
5. **Archive strategy** for large tables (stats, audit_logs, chat_messages)

---

## Summary

The admin API schema is well-designed for a Discord bot admin panel with:
- ✅ Comprehensive audit logging
- ✅ Flexible analytics and statistics
- ✅ AI-powered analysis features
- ✅ Role-based access control
- ✅ Performance-optimized indexes

Key areas for improvement:
- ⚠️ Add soft delete support
- ⚠️ Implement data retention policies
- ⚠️ Add validation for JSON fields
- ⚠️ Consider extracting roles to proper RBAC tables
- ⚠️ Add constraints for confidence scores
- ⚠️ Implement session token hashing

Overall, this is a solid foundation that can scale with proper maintenance and monitoring.
