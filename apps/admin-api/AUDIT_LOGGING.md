# Audit Logging

## Overview

The admin-api now includes comprehensive audit logging for critical administrative actions. This implements **Phase 3.2 – Audit Logging Rollout**, building on the centralized audit logging infrastructure from Phase 3.1.

## Architecture

### Core Components

1. **Audit Service** (`src/services/audit.js`)
   - `recordAudit({ adminId, action, guildId, payload })` - Records audit events to database
   - Respects `ADMIN_AUDIT_DISABLED` environment variable for opt-out
   - Non-blocking: failures are logged but don't interrupt primary operations

2. **Audit Processor Queue** (`src/lib/queues/audit-processor.js`)
   - Asynchronous event processing
   - Bulk event handling
   - Automated cleanup and retention management
   - Report generation (daily/weekly/monthly)

3. **Database Schema** (`prisma/schema.prisma`)
   ```prisma
   model AuditLog {
     id            String   @id @default(cuid())
     userId        String?
     action        String
     resourceType  String
     resourceId    String
     details       Json?
     ipAddress     String?
     userAgent     String?
     sessionId     String?
     requestId     String?
     timestamp     DateTime @default(now())
     success       Boolean  @default(true)
     errorMessage  String?

     @@index([userId])
     @@index([action])
     @@index([resourceType])
     @@index([timestamp])
   }
   ```

## Instrumented Actions (Phase 3.2)

The following high-value actions now emit structured audit events:

### 1. Guild Settings Updates

**Route**: `PUT /api/guilds/:guildId/settings`
**File**: `apps/admin-api/src/routes/guild-settings.js:88-153`
**Action**: `guild.settings.update`

**Event Payload**:
```json
{
  "adminId": "user_id",
  "action": "guild.settings.update",
  "guildId": "guild_id",
  "payload": {
    "hasScreenshotChannel": true,
    "personalityKeys": ["tone", "style"],
    "overrideCategoryCount": 2,
    "overrideChannelCount": 5
  }
}
```

**Purpose**: Tracks when admins modify guild-level settings including personality, overrides, and screenshot channels.

---

### 2. Screenshot Channel Updates

**Route**: `POST /api/guilds/:guildId/settings/screenshot-channel`
**File**: `apps/admin-api/src/routes/guild-settings.js:155-192`
**Action**: `guild.screenshot_channel.update`

**Event Payload**:
```json
{
  "adminId": "user_id",
  "action": "guild.screenshot_channel.update",
  "guildId": "guild_id",
  "payload": {
    "channelId": "1234567890"
  }
}
```

**Purpose**: Tracks when screenshot channel is configured or changed.

---

### 3. Channel Overrides Updates

**Route**: `POST /api/guilds/:guildId/channels`
**File**: `apps/admin-api/src/routes/guild-channels.js:54-76`
**Action**: `guild.channel_overrides.update`

**Event Payload**:
```json
{
  "adminId": "user_id",
  "action": "guild.channel_overrides.update",
  "guildId": "guild_id",
  "payload": {
    "channelCount": 3,
    "channels": [
      { "id": "ch1", "name": "general" },
      { "id": "ch2", "name": "random" }
    ]
  }
}
```

**Purpose**: Tracks manual channel configuration updates including channel lists and overrides.

---

### 4. Personality Updates

**Route**: `PUT /api/guilds/:guildId/personality`
**File**: `apps/admin-api/src/routes/personality.js:48-82`
**Action**: `guild.personality.update`

**Event Payload**:
```json
{
  "adminId": "user_id",
  "action": "guild.personality.update",
  "guildId": "guild_id",
  "payload": {
    "tone": "professional",
    "temperature": 0.7,
    "top_p": 0.9,
    "hasSystemPrompt": true
  }
}
```

**Purpose**: Tracks changes to AI personality configuration (tone, temperature, prompts).

---

### 5. Personality Reset

**Route**: `POST /api/guilds/:guildId/personality/reset`
**File**: `apps/admin-api/src/routes/personality.js:84-120`
**Action**: `guild.personality.reset`

**Event Payload**:
```json
{
  "adminId": "user_id",
  "action": "guild.personality.reset",
  "guildId": "guild_id",
  "payload": {
    "preset": "friendly",
    "tone": "casual",
    "temperature": 0.8
  }
}
```

**Purpose**: Tracks destructive action of resetting personality to defaults or presets.

---

### 6. Bot Rescan Operations

**Route**: `POST /api/bot/rescan`
**File**: `apps/admin-api/src/routes/bot.js:12-80`
**Action**: `bot.rescan`

**Event Payload**:
```json
{
  "adminId": "user_id",
  "action": "bot.rescan",
  "guildId": "guild_id",
  "payload": {
    "status": "success" | "failed" | "error",
    "statusCode": 200,
    "error": "error message if applicable"
  }
}
```

**Purpose**: Tracks bot rescan triggers including success/failure status for operational monitoring.

---

## Implementation Pattern

All instrumented routes follow this consistent pattern:

```javascript
const { recordAudit } = require("../services/audit");

router.put("/:guildId/resource", requireCsrf, requireAuth, async (req, res) => {
  try {
    // 1. Perform primary operation
    const result = await updateResource(req.params.guildId, req.body);

    // 2. Record audit log (non-blocking)
    await recordAudit({
      adminId: req.user?.sub || req.user?.id,
      action: "resource.action",
      guildId: req.params.guildId,
      payload: { /* relevant metadata */ },
    }).catch(err => {
      console.error("[route] audit log failed:", err);
      // Audit failure does NOT block the primary operation
    });

    // 3. Return success response
    res.json({ ok: true, result });
  } catch (err) {
    // Handle primary operation errors
    res.status(500).json({ error: "server_error" });
  }
});
```

### Key Principles

1. **Non-blocking**: Audit logging failures never prevent the primary operation from succeeding
2. **Consistent structure**: All events include `adminId`, `action`, `guildId`, and `payload`
3. **Structured payloads**: Events contain metadata summaries, not full request bodies
4. **Error handling**: Audit errors are logged but caught to prevent cascading failures
5. **Privacy-aware**: Sensitive data (tokens, passwords) excluded from payloads

## Testing

**Test Suite**: `apps/admin-api/tests/audit-integration.test.js`

Tests verify:
- Audit events are emitted for all instrumented routes
- Event structure matches expected schema
- `adminId`, `action`, `guildId` are correctly populated
- Payloads contain expected metadata fields

Run tests:
```bash
cd apps/admin-api
npm test -- tests/audit-integration.test.js
```

## Configuration

### Environment Variables

```bash
# Disable audit logging (defaults to enabled)
ADMIN_AUDIT_DISABLED=true
```

### Database Setup

Ensure Prisma schema is generated:
```bash
cd apps/admin-api
npx prisma generate
npx prisma migrate dev
```

## Querying Audit Logs

### Via Database Service

```javascript
const { getAuditLogs } = require('./src/lib/database');

// Get logs for specific user
const logs = await getAuditLogs({
  userId: 'user_id',
  limit: 100
});

// Get logs for specific action
const settingsLogs = await getAuditLogs({
  action: 'guild.settings.update',
  startDate: '2025-01-01',
  endDate: '2025-01-31'
});

// Get logs for specific guild
const guildLogs = await getAuditLogs({
  resourceType: 'guild',
  resourceId: 'guild_id'
});
```

### Statistics and Reports

```javascript
const { getAuditLogStats } = require('./src/lib/database');

// Get statistics for time period
const stats = await getAuditLogStats({
  startDate: '2025-01-01',
  endDate: '2025-01-31'
});

// Returns:
// {
//   totalEvents: 1234,
//   successRate: 0.98,
//   topActions: [
//     { action: 'guild.settings.update', count: 456 },
//     { action: 'guild.personality.update', count: 234 }
//   ],
//   topUsers: [
//     { userId: 'user1', count: 123 },
//     { userId: 'user2', count: 89 }
//   ]
// }
```

## Existing Instrumentation (Phase 3.1)

These routes were instrumented in Phase 3.1 and are already emitting audit events:

- `PUT /api/guilds/:guildId/settings` → `guild.settings.update` (`routes/guilds.js:121`)
- `PUT /api/guilds/:guildId/personality` → `guild.personality.update` (`routes/guilds.js:162`)
- `PUT /api/guilds/:guildId/channels` → `guild.channels.update` (`routes/guilds.js:202`)
- `POST /api/guilds/:guildId/corrections` → `guild.corrections.add` (`routes/guilds.js:245`)
- `DELETE /api/guilds/:guildId/corrections/:correctionId` → `guild.corrections.delete` (`routes/guilds.js:277`)
- `POST /api/tasks` → `guild.task.*` (`routes/tasks.js`)
- `POST /api/backup/mysql` → `backup.mysql` (`routes/backup.js`)

## Future Candidates for Instrumentation

Consider adding audit logging for:

1. **User Management**
   - Role assignments and permission changes
   - User invite/kick/ban actions

2. **Webhook Operations**
   - Webhook create/update/delete
   - Integration configuration changes

3. **Analytics Events**
   - Club analysis record creation
   - Manual metric adjustments

4. **System Operations**
   - Database migrations
   - Configuration hot-reloads
   - Cache invalidations

5. **Security Events**
   - Failed authentication attempts
   - API rate limit violations
   - CSRF token validation failures

## Retention and Compliance

**Automated Cleanup**: `audit-processor.js` includes cleanup jobs:
```javascript
processAuditCleanup({
  retentionDays: 90,          // Default retention period
  excludeActions: [            // Never delete these
    'user.role.change',
    'security.breach'
  ]
})
```

**Manual Cleanup**:
```javascript
const { cleanupOldAuditLogs } = require('./src/lib/database');

await cleanupOldAuditLogs({
  beforeDate: '2024-01-01',
  excludeActions: ['critical.action']
});
```

## Monitoring and Alerts

### Metrics to Monitor

1. **Audit log write failures** - High failure rate indicates infrastructure issues
2. **Action frequency anomalies** - Spike in certain actions may indicate abuse
3. **Failed operation rate** - Track `success: false` events
4. **User activity patterns** - Unusual activity from specific users

### Example Alert Rules

```javascript
// Alert on high audit write failure rate
if (auditFailureRate > 0.05) {
  alert("Audit logging failure rate above 5%");
}

// Alert on unusual personality reset volume
const resetCount = await getAuditLogs({
  action: 'guild.personality.reset',
  startDate: lastHour
});
if (resetCount > 100) {
  alert("Unusual volume of personality resets");
}
```

## Troubleshooting

### Audit Logs Not Appearing

1. Check environment variable: `ADMIN_AUDIT_DISABLED` should be `false` or unset
2. Verify database connectivity
3. Check service logs for audit write errors
4. Verify Prisma client is generated: `npx prisma generate`

### Performance Impact

- Audit logging is designed to be non-blocking
- Database writes are asynchronous
- Failed audits don't impact primary operations
- If audit writes become slow, consider:
  - Adding database indexes (already present on key fields)
  - Implementing write batching
  - Using a dedicated audit database

### Query Performance

Indexes are already in place for common queries:
- `userId` - User activity lookups
- `action` - Action type filtering
- `resourceType` - Resource type filtering
- `timestamp` - Time-based queries

For complex queries, consider adding composite indexes.

## Summary

**Phase 3.2 adds audit logging to 6 critical routes across 4 files:**

| Route | Action | Purpose |
|-------|--------|---------|
| `PUT /guilds/:id/settings` | `guild.settings.update` | General settings changes |
| `POST /guilds/:id/settings/screenshot-channel` | `guild.screenshot_channel.update` | Screenshot channel config |
| `POST /guilds/:id/channels` | `guild.channel_overrides.update` | Channel overrides |
| `PUT /guilds/:id/personality` | `guild.personality.update` | AI personality updates |
| `POST /guilds/:id/personality/reset` | `guild.personality.reset` | Personality resets |
| `POST /bot/rescan` | `bot.rescan` | Bot rescan operations |

**Testing**: Comprehensive integration tests verify event emission and payload structure.

**Deployment**: No database migrations required. Existing `AuditLog` schema supports all new events.

**Next Steps**: Monitor production usage patterns and consider instrumenting additional high-value actions based on operational needs.
