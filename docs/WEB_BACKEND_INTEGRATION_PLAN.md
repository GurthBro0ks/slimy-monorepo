# Web Backend Integration Plan

This document tracks the progress of consolidating the web app's backend infrastructure with the admin-api.

## Background

The slimy-monorepo contains multiple applications that historically maintained separate database schemas and migrations. This plan outlines the phased approach to consolidate these systems while maintaining data integrity and system stability.

## Goals

1. Consolidate to a single PostgreSQL instance
2. Establish admin-api as the canonical owner of shared schemas
3. Remove duplicate Prisma models from the web app
4. Maintain backwards compatibility during the transition
5. Document migration paths for data consolidation

## Phases

### Phase 2.1: Database Consolidation ✅ COMPLETE

**Status**: COMPLETE

**Objective**: Consolidate to a single PostgreSQL instance and mark deprecated models in web schema.

**Changes**:
- All services now connect to a single PostgreSQL database
- Marked `ClubAnalysis`, `ClubAnalysisImage`, `ClubMetric`, and `AuditLog` in web Prisma schema as deprecated
- Admin-api established as canonical owner for these models
- Updated documentation with migration warnings

**Files Modified**:
- `apps/web/prisma/schema.prisma` (added deprecation comments)
- Environment configuration files

### Phase 2.2: Club Analytics API Integration ✅ COMPLETE

**Status**: COMPLETE

**Objective**: Wire web app's club analytics features to use admin-api endpoints instead of direct Prisma queries.

**Changes**:
- Implemented HTTP client for admin-api communication
- Updated web app to call admin-api endpoints for club analytics operations
- Maintained backwards-compatible interfaces
- Removed direct Prisma dependencies for club analytics in web runtime code

**Files Modified**:
- `apps/web/lib/api/admin-client.ts` (HTTP client)
- `apps/web/lib/club/database.ts` (interface definitions)
- API routes now proxy to admin-api

### Phase 2.3: Data Migration Tooling ✅ COMPLETE

**Status**: COMPLETE

**Objective**: Provide migration scripts and documentation for consolidating club analytics data.

**Changes**:
- Created migration script for club analytics data
- Documented migration procedures
- Added rollback strategies

**Files Created**:
- Migration scripts for data consolidation
- `docs/db/PRISMA_MIGRATION_GUIDE.md`

### Phase 2.4: Club Analytics Cleanup ✅ COMPLETE

**Status**: COMPLETE (2025-11-20)

**Objective**: Remove deprecated club analytics and audit-log Prisma models from the web app schema.

**Changes**:
- Removed `ClubAnalysis`, `ClubAnalysisImage`, `ClubMetric`, and `AuditLog` models from `apps/web/prisma/schema.prisma`
- Deleted unused repository file (`apps/web/lib/repositories/club-analytics.repository.ts`)
- Regenerated Prisma client for web app with updated schema
- Admin-api remains the canonical owner of these models and their migrations
- Web app continues to access club analytics via HTTP calls to admin-api

**Files Modified**:
- `apps/web/prisma/schema.prisma` (removed deprecated models)

**Files Deleted**:
- `apps/web/lib/repositories/club-analytics.repository.ts`

**Verification**:
- ✅ Prisma client generation succeeds
- ✅ TypeScript compilation has no new errors related to removed models
- ✅ Lint passes (pre-existing issues remain, as expected)
- ✅ Web app schema no longer contains duplicate models

**Notes**:
- Web app now relies purely on HTTP calls to admin-api for club analytics and audit logging
- No database migrations were run in web app (admin-api owns the tables)
- The actual database tables remain unchanged and continue to be managed by admin-api

## Future Phases

### Phase 2.5: Session Management Consolidation (Planned)

**Status**: PLANNED

**Objective**: Consolidate user session management between web and admin-api.

**Considerations**:
- Evaluate shared session storage (Redis)
- Define session schema ownership
- Plan migration strategy for existing sessions

### Phase 2.6: Feature Flag Consolidation (Planned)

**Status**: PLANNED

**Objective**: Consolidate feature flag management to a single source of truth.

**Considerations**:
- Evaluate centralized feature flag service
- Define ownership and migration path
- Consider runtime vs. build-time feature flags

## Success Criteria

- [ ] All applications use a single PostgreSQL instance (COMPLETE)
- [ ] No duplicate Prisma models across applications (COMPLETE for club analytics)
- [ ] Clear ownership of database schemas and migrations
- [ ] Comprehensive migration documentation
- [ ] Zero downtime during transitions
- [ ] All tests pass after each phase

## Rollback Strategy

Each phase includes:
1. Database backups before migration
2. Feature flags to toggle between old/new implementations
3. Documented rollback procedures
4. Monitoring and alerting for issues

## Related Documentation

- [Prisma Migration Guide](./db/PRISMA_MIGRATION_GUIDE.md)
- [Database Structure](./STRUCTURE.md)
