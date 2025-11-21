# Web Backend Integration Plan

This document outlines the strategic plan for integrating the web application with the admin-api backend service, ensuring admin-api serves as the canonical data source and business logic layer.

## Vision

**Admin-API as the canonical backend:**
- Single source of truth for all data
- Consistent business logic across all clients
- Clean separation between frontend (web, admin-ui) and backend (admin-api)
- RESTful APIs for all operations

**Web as a frontend client:**
- Consumes admin-api via HTTP APIs
- Minimal backend logic (only Next.js routing and rendering)
- Client libraries for type-safe API calls
- No direct database access from web routes

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Web App (Next.js)                    │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Pages/     │  │  API Routes  │  │   Client     │      │
│  │  Components  │  │  (Proxies)   │  │  Libraries   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │ HTTP (REST)
                             ▼
┌────────────────────────────────────────────────────────────┐
│                     Admin-API (Express)                     │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐     │
│  │   Routes    │  │   Services   │  │  Prisma/DB    │     │
│  │  (REST API) │─▶│  (Business   │─▶│  (PostgreSQL) │     │
│  │             │  │   Logic)     │  │               │     │
│  └─────────────┘  └──────────────┘  └───────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Integration Phases

### Phase 1: Foundation (Complete)
**Status:** ✅ Complete

- [x] Separate database per environment (Postgres)
- [x] Shared schema between admin-api and web
- [x] Basic authentication via admin-api OAuth
- [x] Session management via cookies

### Phase 2: Club Analytics (Complete)
**Status:** ✅ Complete
**Completion:** Phases 2.1-2.3

**Achievements:**
- [x] Admin-api designated as canonical club analytics source
- [x] Created `POST /api/club/analyze` endpoint
- [x] Created `GET /api/club/history` endpoint
- [x] Web client library: `lib/api/clubAnalytics.ts`
- [x] Migration infrastructure in place
- [x] Web routes updated to call admin-api

**Documents:**
- Club analytics migration docs (referenced in Phase 2.x)

### Phase 3: Audit Logging (Complete)
**Status:** ✅ Complete
**Completion:** Phase 3.1 (November 2025)

**Achievements:**
- [x] Admin-api provides REST API for audit logs
- [x] Created `POST /api/audit-log` endpoint (create)
- [x] Created `GET /api/audit-log` endpoint (list with filters)
- [x] Created `GET /api/audit-log/:id` endpoint (get specific)
- [x] Created `GET /api/audit-log/stats` endpoint (statistics)
- [x] Web client library: `lib/api/auditLog.ts`
- [x] Example integrations: guild settings, guild flags
- [x] Comprehensive test suite
- [x] Deprecated web's file-based audit logger

**Benefits:**
- Centralized audit trail in PostgreSQL
- Queryable audit data with filtering
- Consistent audit event format
- Admin-only access for browsing logs
- Non-blocking logging (failures don't break flows)

**Documents:**
- [PHASE_3_1_AUDIT_LOG_ADMIN_API_INTEGRATION.md](./PHASE_3_1_AUDIT_LOG_ADMIN_API_INTEGRATION.md)

### Phase 3.1: Audit Logging Details

**Admin-API Endpoints:**
```typescript
POST   /api/audit-log        // Create audit log entry (any auth user)
GET    /api/audit-log        // List logs with filters (admin only)
GET    /api/audit-log/:id    // Get specific log (admin only)
GET    /api/audit-log/stats  // Get statistics (admin only)
```

**Web Integration:**
```typescript
import { sendAuditEvent, AuditActions, ResourceTypes } from '@/lib/api/auditLog';

// Log an action
await sendAuditEvent({
  action: AuditActions.GUILD_SETTINGS_UPDATE,
  resourceType: ResourceTypes.GUILD,
  resourceId: guildId,
  details: { changed: ['publicStatsEnabled'], before: {...}, after: {...} }
});
```

**Key Principles:**
- Non-blocking: Audit failures don't break core flows
- Use `.catch()` for graceful error handling
- Capture before/after values
- Use consistent action names from `AuditActions`

**Next Steps for Audit:**
- Phase 3.2: Build admin-ui for browsing logs
- Phase 3.3: Export and retention policies
- Phase 4.x: Migrate historical web audit data

### Phase 4: Guild Management (Planned)
**Status:** ⏳ Planned

**Goals:**
- Centralize all guild CRUD operations
- Unify guild settings management
- Consolidate feature flags

**Endpoints to Create:**
```
GET    /api/guilds           // List guilds
GET    /api/guilds/:id       // Get guild details
PUT    /api/guilds/:id       // Update guild
DELETE /api/guilds/:id       // Delete guild
GET    /api/guilds/:id/members
POST   /api/guilds/:id/members
```

**Migration:**
- Web's guild routes become proxies
- Move business logic to admin-api
- Deprecate direct database access from web

### Phase 5: User Management (Planned)
**Status:** ⏳ Planned

**Goals:**
- Centralize user profile operations
- Unify preferences management
- Consolidate session handling

**Endpoints to Create:**
```
GET    /api/users/:id        // Get user profile
PUT    /api/users/:id        // Update user
GET    /api/users/:id/preferences
PUT    /api/users/:id/preferences
GET    /api/users/:id/guilds
```

### Phase 6: Stats & Metrics (Planned)
**Status:** ⏳ Planned

**Goals:**
- Centralize stats aggregation
- Move away from Google Sheets dependency
- Real-time metrics API

**Endpoints to Create:**
```
GET    /api/stats/summary
GET    /api/stats/guilds/:id
GET    /api/stats/users/:id
POST   /api/stats/events     // Ingest events
```

### Phase 7: Chat & Messages (Planned)
**Status:** ⏳ Planned

**Goals:**
- Centralize chat message storage
- Unified conversation management
- Cross-app chat history

**Endpoints to Create:**
```
GET    /api/chat/conversations
POST   /api/chat/conversations
GET    /api/chat/conversations/:id/messages
POST   /api/chat/conversations/:id/messages
```

## Integration Patterns

### 1. Client Library Pattern

For each feature, create a typed client library in web:

```typescript
// apps/web/lib/api/[feature].ts
import { adminApiClient } from './admin-client';

export interface FeatureData { ... }

export async function getFeature(id: string) {
  return adminApiClient.get<FeatureData>(`/api/feature/${id}`);
}

export async function createFeature(data: CreateFeaturePayload) {
  return adminApiClient.post<FeatureData>('/api/feature', data);
}
```

**Benefits:**
- Type safety
- Centralized error handling
- Consistent request patterns
- Easy to mock for testing

### 2. Proxy Route Pattern

Web API routes become thin proxies when needed:

```typescript
// apps/web/app/api/feature/route.ts
import { getFeature } from '@/lib/api/feature';

export async function GET(request: Request) {
  const result = await getFeature(id);

  if (!result.ok) {
    return NextResponse.json(result, { status: result.status });
  }

  return NextResponse.json(result.data);
}
```

**When to use:**
- Server-side rendering needs
- Cookie/session handling
- Client can't call admin-api directly

### 3. Direct Client Call Pattern

For client-side operations, call admin-api directly:

```typescript
// apps/web/components/FeatureComponent.tsx
import { useQuery } from '@tanstack/react-query';
import { getFeature } from '@/lib/api/feature';

export function FeatureComponent({ id }: Props) {
  const { data, error } = useQuery({
    queryKey: ['feature', id],
    queryFn: () => getFeature(id)
  });

  // ...
}
```

**When to use:**
- Client-side data fetching
- Real-time updates
- Interactive features

### 4. Audit Logging Pattern

Always log important actions (non-blocking):

```typescript
// After successful operation
sendAuditEvent({
  action: AuditActions.FEATURE_UPDATE,
  resourceType: ResourceTypes.FEATURE,
  resourceId: featureId,
  details: { changed: [...], before: {...}, after: {...} }
}).catch(err => {
  console.error('[Audit] Failed to log action:', err);
});

// After failed operation
sendAuditEvent({
  action: AuditActions.FEATURE_UPDATE,
  resourceType: ResourceTypes.FEATURE,
  resourceId: featureId,
  success: false,
  errorMessage: error.message
}).catch(err => {
  console.error('[Audit] Failed to log failure:', err);
});
```

## Data Migration Strategy

For each feature with existing data in web's database:

1. **Assess data volume** - Small vs large datasets
2. **Create migration script** - In `apps/admin-api/prisma/migrations/`
3. **Implement dual-write period** - Write to both old and new
4. **Validate data consistency** - Compare old vs new
5. **Switch reads to new source** - Update web to read from admin-api
6. **Deprecate old writes** - Stop writing to web's database
7. **Clean up old data** - After validation period

## Testing Strategy

### Unit Tests
- Admin-api: Test routes, services, database methods
- Web: Test client libraries, components

### Integration Tests
- Test web → admin-api communication
- Test error handling and retries
- Test authentication/authorization

### E2E Tests
- Focus on critical user flows
- Test across app boundaries
- Validate end-to-end functionality

### Manual Testing
- Smoke tests after deployment
- Monitor production logs
- User acceptance testing

## Rollout Process

For each phase:

1. **Plan** - Document endpoints, schemas, migration needs
2. **Implement** - Build admin-api routes and services
3. **Integrate** - Create web client library
4. **Test** - Unit, integration, E2E tests
5. **Document** - API docs, integration guides
6. **Deploy** - Staged rollout (dev → staging → prod)
7. **Monitor** - Watch logs, metrics, errors
8. **Validate** - Confirm working as expected
9. **Deprecate** - Mark old code as deprecated
10. **Clean up** - Remove old code after validation period

## Success Metrics

### Technical Metrics
- ✅ All web backend operations go through admin-api
- ✅ No direct database queries from web routes
- ✅ < 5% of web API routes remain (only for SSR/cookies)
- ✅ 100% type coverage on client libraries
- ✅ < 100ms p95 latency for admin-api calls
- ✅ > 99.9% admin-api uptime

### Quality Metrics
- ✅ Comprehensive test coverage (>80%)
- ✅ All endpoints documented
- ✅ Zero data loss during migration
- ✅ Consistent error handling

### Developer Experience
- ✅ Clear client library patterns
- ✅ Easy to add new features
- ✅ Good TypeScript types
- ✅ Helpful error messages

## Current Status Summary

| Phase | Feature | Status | Completion |
|-------|---------|--------|------------|
| 1 | Foundation | ✅ Complete | 100% |
| 2 | Club Analytics | ✅ Complete | 100% |
| 3 | Audit Logging | ✅ Complete | 100% |
| 4 | Guild Management | ⏳ Planned | 0% |
| 5 | User Management | ⏳ Planned | 0% |
| 6 | Stats & Metrics | ⏳ Planned | 0% |
| 7 | Chat & Messages | ⏳ Planned | 0% |

## Related Documents

- [FEATURE_PORT_STATUS.md](./FEATURE_PORT_STATUS.md) - Feature migration tracking
- [MEGA_INTEGRATION_AUDIT.md](./MEGA_INTEGRATION_AUDIT.md) - Issues and resolutions
- [PHASE_3_1_AUDIT_LOG_ADMIN_API_INTEGRATION.md](./PHASE_3_1_AUDIT_LOG_ADMIN_API_INTEGRATION.md) - Audit logging details

## Appendix: Lessons Learned

### Phase 2 & 3 Insights

1. **Non-blocking is key** - Audit logging failures shouldn't break core flows
2. **Type safety matters** - Client libraries with types prevent errors
3. **Document early** - Write docs as you build, not after
4. **Test thoroughly** - Integration tests catch boundary issues
5. **Deprecate gracefully** - Keep old code during migration period
6. **Monitor actively** - Watch for issues in production

### Best Practices

- **Start small** - One feature at a time
- **Iterate quickly** - Don't wait for perfection
- **Communicate clearly** - Document decisions and rationale
- **Test rigorously** - Especially integration points
- **Deploy carefully** - Staged rollouts reduce risk
- **Monitor actively** - Catch issues early
