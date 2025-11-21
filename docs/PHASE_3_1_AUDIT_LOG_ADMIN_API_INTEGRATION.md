# Phase 3.1: Centralized Audit Logging via Admin-API

**Status:** ✅ Complete
**Date:** November 2025
**Branch:** `claude/centralize-audit-logging-01GTepJLqYSSYrz6MG55f2Lv`

## Overview

Phase 3.1 centralizes audit logging functionality by making **admin-api** the canonical source for all audit log writes and reads. This eliminates duplication between web and admin-api, provides a consistent audit trail, and enables better compliance and security monitoring.

## Problem Statement

**Before Phase 3.1:**
- **Web** had a file-based audit logger (`lib/audit-log.ts`) that wrote to JSONL files
- **Admin-api** had a comprehensive AuditLog Prisma model but no HTTP API
- Audit events were inconsistent and not centralized
- No single source of truth for audit data
- Difficult to query, filter, and analyze audit events

**After Phase 3.1:**
- **Admin-api** is the canonical writer and reader for all audit logs
- **Web** sends audit events to admin-api via HTTP API
- Audit logs are stored in PostgreSQL with full querying capabilities
- Consistent audit event format across all applications
- Built-in filtering, pagination, and statistics

## Architecture

```
┌─────────────────┐         HTTP POST          ┌──────────────────┐
│                 │    /api/audit-log           │                  │
│   Web App       ├────────────────────────────▶│   Admin-API      │
│                 │    { action, resource... }  │                  │
└─────────────────┘                             │                  │
                                                 │  ┌─────────────┐ │
┌─────────────────┐                             │  │ AuditLog    │ │
│                 │         HTTP GET             │  │ Prisma      │ │
│   Admin UI      ├────────────────────────────▶│  │ Model       │ │
│  (Future)       │    /api/audit-log?filters   │  └─────────────┘ │
└─────────────────┘                             │         │        │
                                                 └─────────┼────────┘
                                                           │
                                                           ▼
                                                  ┌────────────────┐
                                                  │   PostgreSQL   │
                                                  │   audit_logs   │
                                                  └────────────────┘
```

## Canonical AuditLog Schema

The canonical AuditLog model in **admin-api** (`apps/admin-api/prisma/schema.prisma`):

```prisma
model AuditLog {
  id            String   @id @default(cuid())
  userId        String?  @map("user_id")
  action        String
  resourceType  String   @map("resource_type")
  resourceId    String   @map("resource_id")
  details       Json?
  ipAddress     String?  @map("ip_address")
  userAgent     String?  @map("user_agent")
  sessionId     String?  @map("session_id")
  requestId     String?  @map("request_id")
  timestamp     DateTime @default(now())
  success       Boolean  @default(true)
  errorMessage  String?  @map("error_message")

  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([action])
  @@index([resourceType])
  @@index([resourceId])
  @@index([timestamp])
  @@index([success])
  @@index([userId, timestamp])
  @@index([action, timestamp])
  @@index([resourceType, timestamp])
  @@index([userId, action, timestamp])
  @@index([resourceType, resourceId])
  @@index([requestId])

  @@map("audit_logs")
}
```

### Key Fields

- **userId**: User who performed the action (nullable for system actions)
- **action**: Action identifier (e.g., `guild.settings.update`, `user.login`)
- **resourceType**: Type of resource affected (e.g., `guild`, `user`, `feature_flag`)
- **resourceId**: ID of the affected resource
- **details**: JSON object with additional context (before/after values, etc.)
- **ipAddress**, **userAgent**: Request metadata
- **sessionId**, **requestId**: For correlation and tracing
- **timestamp**: When the event occurred
- **success**: Whether the action succeeded
- **errorMessage**: Error details if action failed

## REST API Endpoints

### POST `/api/audit-log`

Create a new audit log entry.

**Authentication:** Required
**Authorization:** Any authenticated user

**Request Body:**
```json
{
  "userId": "user-123",           // optional, auto-populated from session
  "guildId": "guild-456",         // optional
  "action": "guild.settings.update",
  "resourceType": "guild",
  "resourceId": "guild-456",
  "details": {
    "changed": ["publicStatsEnabled"],
    "before": { "publicStatsEnabled": false },
    "after": { "publicStatsEnabled": true }
  },
  "success": true,                // optional, default: true
  "errorMessage": null            // optional
}
```

**Response:**
```json
{
  "ok": true,
  "auditLog": {
    "id": "cm3abc123...",
    "userId": "user-123",
    "action": "guild.settings.update",
    "resourceType": "guild",
    "resourceId": "guild-456",
    "details": { ... },
    "timestamp": "2025-11-20T14:30:00.000Z",
    "success": true
  }
}
```

### GET `/api/audit-log`

List audit log entries with filtering and pagination.

**Authentication:** Required
**Authorization:** Admin role required

**Query Parameters:**
- `userId`: Filter by user ID
- `guildId`: Filter by guild ID
- `action`: Filter by action
- `resourceType`: Filter by resource type
- `resourceId`: Filter by resource ID
- `success`: Filter by success status (`true` or `false`)
- `startDate`: Filter by start date (ISO 8601)
- `endDate`: Filter by end date (ISO 8601)
- `limit`: Number of results (1-1000, default: 100)
- `offset`: Pagination offset (default: 0)

**Response:**
```json
{
  "ok": true,
  "logs": [
    {
      "id": "cm3abc123...",
      "userId": "user-123",
      "user": {
        "id": "user-123",
        "username": "testuser",
        "globalName": "Test User"
      },
      "action": "guild.settings.update",
      "resourceType": "guild",
      "resourceId": "guild-456",
      "details": { ... },
      "timestamp": "2025-11-20T14:30:00.000Z",
      "success": true
    }
  ],
  "pagination": {
    "limit": 100,
    "offset": 0,
    "hasMore": false
  }
}
```

### GET `/api/audit-log/stats`

Get audit log statistics.

**Authentication:** Required
**Authorization:** Admin role required

**Query Parameters:**
- `userId`: Filter by user ID
- `action`: Filter by action
- `resourceType`: Filter by resource type
- `startDate`: Filter by start date (ISO 8601)
- `endDate`: Filter by end date (ISO 8601)

**Response:**
```json
{
  "ok": true,
  "stats": {
    "total": 1523,
    "successful": 1489,
    "failed": 34,
    "successRate": 97.8,
    "actionBreakdown": [
      { "action": "guild.settings.update", "count": 342 },
      { "action": "user.login", "count": 256 },
      ...
    ]
  }
}
```

### GET `/api/audit-log/:id`

Get a specific audit log entry by ID.

**Authentication:** Required
**Authorization:** Admin role required

**Response:**
```json
{
  "ok": true,
  "log": {
    "id": "cm3abc123...",
    "userId": "user-123",
    "user": {
      "id": "user-123",
      "username": "testuser",
      "globalName": "Test User",
      "discordId": "123456789"
    },
    "action": "guild.settings.update",
    "resourceType": "guild",
    "resourceId": "guild-456",
    "details": { ... },
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "sessionId": "sess-xyz",
    "requestId": "req-abc",
    "timestamp": "2025-11-20T14:30:00.000Z",
    "success": true,
    "errorMessage": null
  }
}
```

## Web Integration

### Client Library

**Location:** `apps/web/lib/api/auditLog.ts`

The web app uses a centralized client library to send audit events to admin-api:

```typescript
import { sendAuditEvent, AuditActions, ResourceTypes } from '@/lib/api/auditLog';

// Send an audit event
await sendAuditEvent({
  action: AuditActions.GUILD_SETTINGS_UPDATE,
  resourceType: ResourceTypes.GUILD,
  resourceId: guildId,
  details: {
    changed: ['publicStatsEnabled'],
    before: { publicStatsEnabled: false },
    after: { publicStatsEnabled: true }
  },
});
```

### Example Integration

See `apps/web/app/api/guilds/[id]/settings/route.ts` and `apps/web/app/api/guilds/[id]/flags/route.ts` for examples of integrated audit logging:

```typescript
// Capture old values
const oldFlags = getGuildFlags(guildId);

// Perform update
const updated = updateGuildFlags(guildId, body);

// Log the update (non-blocking)
sendAuditEvent({
  action: AuditActions.GUILD_FLAGS_UPDATE,
  resourceType: ResourceTypes.GUILD,
  resourceId: guildId,
  details: {
    changed: Object.keys(body),
    before: oldFlags,
    after: updated,
  },
}).catch(err => {
  console.error('[Audit] Failed to log update:', err);
});
```

**Key Principles:**
- Audit logging is **non-blocking** - failures don't break core functionality
- Use `.catch()` to handle errors gracefully
- Always capture before/after values when possible
- Use consistent action names from `AuditActions` constants

### Available Functions

```typescript
// Send an audit event
sendAuditEvent(payload: AuditEventPayload): Promise<ApiResponse>

// Fetch audit logs (admin only)
fetchAuditLogs(filters?: AuditLogFilters): Promise<ApiResponse>

// Fetch a single audit log (admin only)
fetchAuditLog(id: string): Promise<ApiResponse>

// Fetch audit log statistics (admin only)
fetchAuditLogStats(filters?: AuditLogFilters): Promise<ApiResponse>
```

## Standard Action Names

Use the `AuditActions` constants for consistency:

```typescript
export const AuditActions = {
  // Guild actions
  GUILD_CREATE: 'guild.create',
  GUILD_UPDATE: 'guild.update',
  GUILD_DELETE: 'guild.delete',
  GUILD_SETTINGS_UPDATE: 'guild.settings.update',
  GUILD_FLAGS_UPDATE: 'guild.flags.update',

  // Member actions
  MEMBER_ADD: 'member.add',
  MEMBER_REMOVE: 'member.remove',
  MEMBER_UPDATE: 'member.update',
  MEMBER_ROLE_UPDATE: 'member.role.update',

  // Code actions
  CODE_REPORT: 'code.report',
  CODE_VERIFY: 'code.verify',
  CODE_DELETE: 'code.delete',

  // Club analytics actions
  CLUB_ANALYSIS_CREATE: 'club.analysis.create',
  CLUB_ANALYSIS_DELETE: 'club.analysis.delete',
  CLUB_ANALYSIS_EXPORT: 'club.analysis.export',

  // Feature flag actions
  FEATURE_FLAG_UPDATE: 'feature.flag.update',

  // User actions
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  USER_PREFERENCES_UPDATE: 'user.preferences.update',

  // Admin actions
  ADMIN_ACCESS: 'admin.access',
  ADMIN_CONFIG_UPDATE: 'admin.config.update',

  // System actions
  SYSTEM_CONFIG_UPDATE: 'system.config.update',
  SYSTEM_MAINTENANCE: 'system.maintenance',
};
```

## Testing

### Admin-API Tests

**Location:** `apps/admin-api/src/routes/audit-log.test.js`

Comprehensive test suite covering:
- ✅ POST endpoint creates audit logs
- ✅ GET endpoint lists logs with filtering
- ✅ GET endpoint supports pagination
- ✅ GET /:id endpoint retrieves specific logs
- ✅ Stats endpoint returns statistics
- ✅ Authentication/authorization enforcement
- ✅ Validation of required fields

Run tests:
```bash
cd apps/admin-api
pnpm test -- audit-log.test.js
```

## Migration Notes

### Web's Deprecated AuditLog Model

The web app's `AuditLog` model in `apps/web/prisma/schema.prisma` is marked as deprecated but **NOT deleted** in this phase:

```prisma
// DEPRECATED: Use admin-api for audit logging
model AuditLog {
  id         String   @id @default(cuid())
  userId     String
  username   String?
  action     String
  resource   String
  resourceId String?
  changes    String?  @db.Text
  ...
}
```

**Rationale:**
- Existing data may still be in this table
- Future data migration task can consolidate old logs
- No new writes are being made to this model

**Future Cleanup:**
- Phase 4.x: Migrate historical audit logs from web to admin-api
- Phase 4.x: Remove deprecated AuditLog model from web schema

### Old File-Based Logger

The file-based logger at `apps/web/lib/audit-log.ts` is **replaced** by the new API client:
- Old: Writes to `data/audit-logs/*.jsonl` files
- New: POSTs to admin-api `/api/audit-log` endpoint

The old file is kept for reference but should not be imported in new code.

## Benefits

1. **Single Source of Truth**: All audit logs in one database with one schema
2. **Queryable**: Full SQL querying capabilities via Prisma
3. **Scalable**: Database-backed instead of file-based
4. **Consistent**: Same format across all apps
5. **Secure**: Centralized access control via admin-api
6. **Trackable**: Correlates events via requestId and sessionId
7. **Compliant**: Proper audit trail for security and compliance

## Future Enhancements

### Phase 3.2+
- Add audit log UI in admin-ui for browsing and searching
- Implement audit log export (CSV, JSON)
- Add audit log retention policies
- Implement audit log webhooks for real-time monitoring
- Add audit log alerting for critical events
- Enhance filtering with complex queries (AND/OR logic)

## Files Changed

### Created
- `apps/admin-api/src/routes/audit-log.js` - REST API routes
- `apps/admin-api/src/routes/audit-log.test.js` - Test suite
- `apps/web/lib/api/auditLog.ts` - Web client library
- `docs/PHASE_3_1_AUDIT_LOG_ADMIN_API_INTEGRATION.md` - This document

### Modified
- `apps/admin-api/src/routes/index.js` - Mount audit-log routes
- `apps/web/app/api/guilds/[id]/settings/route.ts` - Add audit logging example
- `apps/web/app/api/guilds/[id]/flags/route.ts` - Add audit logging example

### Existing (Leveraged)
- `apps/admin-api/src/lib/database.js` - `createAuditLog()`, `getAuditLogs()`, `getAuditLogStats()`
- `apps/admin-api/src/lib/queues/audit-processor.js` - Queue-based audit processing
- `apps/admin-api/prisma/schema.prisma` - Canonical AuditLog model

## Rollout Checklist

- [x] Define canonical AuditLog schema in admin-api
- [x] Implement REST API endpoints in admin-api
- [x] Create web client library for sending audit events
- [x] Add example integrations in web (guild settings, flags)
- [x] Add comprehensive tests for admin-api routes
- [x] Document API endpoints and usage
- [ ] Deploy admin-api with new routes
- [ ] Update web to use new audit client
- [ ] Monitor audit log creation and errors
- [ ] (Future) Build admin-ui for browsing audit logs
- [ ] (Future) Migrate historical logs from web to admin-api
- [ ] (Future) Remove deprecated web AuditLog model

## Summary

Phase 3.1 successfully centralizes audit logging via admin-api, providing a robust foundation for security monitoring, compliance, and debugging. All future audit events will flow through the admin-api, ensuring consistency and enabling powerful querying and analysis capabilities.
