# Feature Port Status

This document tracks the status of feature centralization efforts across the monorepo, particularly the migration from web-specific implementations to admin-api canonical services.

## Overview

As part of the mega integration effort, we're centralizing backend services in **admin-api** to serve as the canonical data source for all applications (web, admin-ui, bot, etc.).

## Feature Status

| Feature | Status | Canonical Location | Client Integration | Notes |
|---------|--------|-------------------|-------------------|-------|
| **Club Analytics** | ✅ Complete | admin-api | web (`lib/api/clubAnalytics.ts`) | Phase 2.2-2.3: Web calls admin-api for club analysis |
| **Audit Logging** | ✅ Complete | admin-api | web (`lib/api/auditLog.ts`) | **Phase 3.1**: Centralized audit logging via admin-api |
| Guild Settings | 🚧 Partial | admin-api | web (direct calls) | Some settings still managed locally |
| User Authentication | ✅ Complete | admin-api | web (session cookies) | OAuth flow centralized |
| Stats/Metrics | 🚧 In Progress | admin-api | web (mixed) | Some stats still from sheets |
| Chat/Messages | ⏳ Planned | admin-api | - | To be centralized |
| Bot Commands | ⏳ Planned | admin-api | - | To be centralized |

## Phase 3.1: Audit Logging

**Status:** ✅ Complete
**Date:** November 2025

### What Changed
- Admin-api now provides REST API for audit log creation and querying
- Web uses `lib/api/auditLog.ts` client to send audit events to admin-api
- All audit data stored in admin-api's PostgreSQL database
- Deprecated web's file-based audit logger

### Endpoints Added
- `POST /api/audit-log` - Create audit log entry
- `GET /api/audit-log` - List audit logs with filtering (admin only)
- `GET /api/audit-log/:id` - Get specific audit log (admin only)
- `GET /api/audit-log/stats` - Get audit statistics (admin only)

### Integration Examples
- Guild settings updates (`apps/web/app/api/guilds/[id]/settings/route.ts`)
- Guild flags updates (`apps/web/app/api/guilds/[id]/flags/route.ts`)

### Documentation
See [PHASE_3_1_AUDIT_LOG_ADMIN_API_INTEGRATION.md](./PHASE_3_1_AUDIT_LOG_ADMIN_API_INTEGRATION.md) for full details.

## Legend

- ✅ **Complete** - Feature fully centralized and integrated
- 🚧 **Partial** - Feature partially centralized, some work remaining
- ⏳ **Planned** - Feature identified for future centralization
- ❌ **Blocked** - Feature blocked by dependencies or issues

## Next Steps

### Immediate (Phase 3.2+)
1. Build admin-ui for browsing audit logs
2. Add audit log export functionality
3. Implement audit log retention policies

### Short-term
1. Centralize remaining guild settings operations
2. Consolidate stats/metrics data sources
3. Migrate chat/messages to admin-api

### Long-term
1. Full admin-ui parity with web admin features
2. Bot command integration with admin-api
3. Real-time event streaming via admin-api

## Migration Strategy

For each feature:
1. **Define canonical schema** in admin-api Prisma models
2. **Implement REST API** in admin-api
3. **Create client library** in consuming apps (web, admin-ui, bot)
4. **Migrate data** (if needed) from old sources to admin-api
5. **Update applications** to use admin-api client
6. **Deprecate old implementations** (but don't delete immediately)
7. **Monitor and validate** new implementation
8. **Remove deprecated code** after validation period

## Related Documents

- [PHASE_3_1_AUDIT_LOG_ADMIN_API_INTEGRATION.md](./PHASE_3_1_AUDIT_LOG_ADMIN_API_INTEGRATION.md) - Audit logging details
- [MEGA_INTEGRATION_AUDIT.md](./MEGA_INTEGRATION_AUDIT.md) - Integration issues and solutions
- [WEB_BACKEND_INTEGRATION_PLAN.md](./WEB_BACKEND_INTEGRATION_PLAN.md) - Overall integration plan
