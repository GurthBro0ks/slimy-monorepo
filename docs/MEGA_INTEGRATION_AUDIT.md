# Mega Integration Audit

This document tracks known integration issues, duplications, and inconsistencies across the monorepo, along with their status and resolutions.

## Overview

The slimy-monorepo consists of multiple applications that historically evolved independently:
- **admin-api**: Backend service with canonical database models
- **web**: Next.js frontend with some backend routes
- **admin-ui**: Admin dashboard (Next.js)
- **bot**: Discord bot

As we integrate these apps, we've identified several areas of duplication and inconsistency that need resolution.

## Database & Schema Issues

### ✅ AuditLog Duplication (Phase 3.1 - RESOLVED)

**Issue:**
- Admin-api had a comprehensive `AuditLog` Prisma model with no HTTP API
- Web had a simpler `AuditLog` model and file-based logger
- No centralized audit logging
- Inconsistent audit event formats

**Impact:**
- Audit events were scattered (files + DB)
- Difficult to query and analyze audit trail
- Compliance and security monitoring challenges

**Resolution:**
- **Phase 3.1** (November 2025)
- Made admin-api the canonical audit log source
- Created REST API endpoints in admin-api (`/api/audit-log`)
- Created web client library (`lib/api/auditLog.ts`)
- Integrated audit logging in web routes (guild settings, flags)
- Web's deprecated `AuditLog` model kept for historical data (future migration)

**Status:** ✅ Addressed at API/behavior level
**Documents:** [PHASE_3_1_AUDIT_LOG_ADMIN_API_INTEGRATION.md](./PHASE_3_1_AUDIT_LOG_ADMIN_API_INTEGRATION.md)

### 🚧 ClubAnalysis Data Source (Phase 2.2-2.3 - PARTIAL)

**Issue:**
- Web originally created club analyses directly in its database
- Admin-api also had club analysis capabilities
- Duplication and inconsistency

**Resolution:**
- **Phase 2.2-2.3**
- Admin-api designated as canonical source
- Web calls admin-api via `lib/api/clubAnalytics.ts`
- Migration infrastructure created

**Status:** 🚧 Core functionality centralized, data migration pending
**Remaining Work:** Historical data migration

### ⏳ User/Session Management (Planned)

**Issue:**
- Multiple session stores and authentication flows
- Inconsistent user data models

**Status:** ⏳ Planned for future phase
**Impact:** Medium - works but duplicates effort

## API Integration Issues

### ✅ Missing Audit Log API (Phase 3.1 - RESOLVED)

**Issue:**
- Admin-api had database methods but no REST API for audit logs
- Web couldn't send audit events to admin-api

**Resolution:**
- Created comprehensive REST API in admin-api:
  - `POST /api/audit-log` - Create entries
  - `GET /api/audit-log` - List with filtering
  - `GET /api/audit-log/:id` - Get specific entry
  - `GET /api/audit-log/stats` - Statistics

**Status:** ✅ Complete

### 🚧 Guild Settings Fragmentation (In Progress)

**Issue:**
- Guild settings managed in multiple places
- Some in feature flags, some in database, some in memory
- Inconsistent update patterns

**Status:** 🚧 Partial - being addressed incrementally
**Impact:** Medium - functional but confusing

## Code Quality Issues

### ⏳ TypeScript/JavaScript Mixing (Known Issue)

**Issue:**
- Admin-api primarily JavaScript
- Web primarily TypeScript
- Shared packages have mixed types
- Type safety gaps at boundaries

**Status:** ⏳ Accepted - incremental improvement
**Impact:** Low - manageable with good testing

### ⏳ Error Handling Inconsistency (Known Issue)

**Issue:**
- Different error formats across apps
- Admin-api uses `AppError` classes
- Web uses various error patterns
- Shared error catalog exists but not universally adopted

**Status:** ⏳ Gradual improvement
**Impact:** Medium - affects debugging and user experience

## Testing & Quality Assurance

### Known Test Flakiness

**Issue:**
- Some E2E tests are flaky
- Build processes have known experimental failures
- Tests depend on external services

**Status:** ⏳ Ongoing maintenance
**Impact:** Low - doesn't block development
**Mitigation:** Focus on scoped unit tests for new features

## Documentation Gaps

### ✅ Audit Logging Documentation (Phase 3.1 - RESOLVED)

**Resolution:**
- Created comprehensive documentation
- API contracts documented
- Integration examples provided
- Migration notes included

### 🚧 Overall Architecture Docs (In Progress)

**Status:** 🚧 Being built incrementally
**Current Docs:**
- PHASE_3_1_AUDIT_LOG_ADMIN_API_INTEGRATION.md
- FEATURE_PORT_STATUS.md
- MEGA_INTEGRATION_AUDIT.md (this doc)
- WEB_BACKEND_INTEGRATION_PLAN.md

## Cleanup Backlog

### Web's Deprecated Models

**Items:**
- `AuditLog` model (Phase 3.1 - deprecated, not deleted)
- Old file-based audit logger (`lib/audit-log.ts` - replaced)

**Plan:**
- Keep deprecated models for historical data
- Phase 4.x: Migrate data
- Phase 4.x: Remove deprecated schemas

### Legacy Service Files

**Items:**
- `apps/admin-api/src/services/audit.js` - Old audit service (still used for legacy `admin_audit_log` table)

**Plan:**
- Evaluate usage
- Migrate to new audit system if needed
- Remove or consolidate

## Monitoring & Observability

### Audit Log Monitoring

**Current:**
- Audit logs written to PostgreSQL
- Basic console logging for failures
- Non-blocking error handling

**Future:**
- Real-time audit event streaming
- Alerting for critical events (failed logins, permission changes)
- Audit log analytics dashboard in admin-ui

## Resolution Principles

1. **Admin-api is canonical** for all backend data and business logic
2. **Non-breaking changes** - keep deprecated code until migration complete
3. **Incremental migration** - one feature at a time
4. **Document everything** - capture decisions and rationale
5. **Test thoroughly** - especially integration points
6. **Monitor actively** - watch for issues in production

## Issue Priority Matrix

| Category | Priority | Examples |
|----------|----------|----------|
| Data Duplication | 🔴 High | AuditLog (✅ resolved), ClubAnalysis (🚧 partial) |
| API Gaps | 🟡 Medium | Missing audit API (✅ resolved) |
| Code Quality | 🟢 Low | TypeScript mixing, error handling |
| Documentation | 🟡 Medium | Architecture docs (🚧 in progress) |
| Testing | 🟢 Low | Flaky tests, build issues |

## Recent Changes

### November 2025 - Phase 3.1: Audit Logging
- ✅ Resolved AuditLog duplication
- ✅ Created REST API in admin-api
- ✅ Integrated web with admin-api
- ✅ Comprehensive documentation

## Next Steps

1. **Phase 3.2:** Build admin-ui for audit log browsing
2. **Phase 3.3:** Implement audit log export and retention
3. **Phase 4.x:** Migrate historical audit data
4. **Phase 4.x:** Remove deprecated web AuditLog model
5. **Phase 5.x:** Centralize remaining guild settings
6. **Phase 6.x:** Consolidate user/session management

## Related Documents

- [FEATURE_PORT_STATUS.md](./FEATURE_PORT_STATUS.md) - Feature centralization tracking
- [PHASE_3_1_AUDIT_LOG_ADMIN_API_INTEGRATION.md](./PHASE_3_1_AUDIT_LOG_ADMIN_API_INTEGRATION.md) - Audit logging details
- [WEB_BACKEND_INTEGRATION_PLAN.md](./WEB_BACKEND_INTEGRATION_PLAN.md) - Overall integration roadmap
