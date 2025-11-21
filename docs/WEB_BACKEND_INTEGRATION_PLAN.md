# Web Backend Integration Plan

This document tracks the integration of web app functionality with the admin-api backend service.

## Overview

The web application is being migrated from a self-contained architecture to a client-server architecture where admin-api serves as the canonical backend for shared functionality.

## Architecture Principles

- **Admin-API as Single Source of Truth**: Admin-api owns all Prisma schema definitions for shared domains
- **Web as Thin Client**: Web app consumes admin-api endpoints via HTTP, does not duplicate schema definitions
- **No Schema Duplication**: Shared models are defined ONLY in admin-api, not in web's Prisma schema

## Migration Phases

### Phase 1: Foundation (Completed)
- ✅ Admin-api backend infrastructure established
- ✅ Core authentication and session management

### Phase 2: Club Analytics (Completed)

#### Phase 2.1-2.3: Admin-API Canonical Implementation
- ✅ ClubAnalysis, ClubAnalysisImage, ClubMetric models in admin-api
- ✅ Admin-api endpoints for club analytics operations
- ✅ Web app migrated to consume admin-api endpoints

#### Phase 2.4: Web Schema Cleanup (COMPLETED)
- ✅ **Removed deprecated Prisma models from web**:
  - ClubAnalysis
  - ClubAnalysisImage
  - ClubMetric
- ✅ **Removed unused web repository layer**:
  - apps/web/lib/repositories/club-analytics.repository.ts (was using Prisma directly, never used)
- ✅ **Web now uses**:
  - Admin-api HTTP endpoints for club analytics operations
  - Local TypeScript interfaces for domain types (not Prisma-generated)

**Status**: Club analytics is fully canonical in admin-api. Web has no local Prisma models for this domain.

### Phase 3: Audit Logging (Completed)

#### Phase 3.1-3.2: Centralized Audit Logging
- ✅ AuditLog model in admin-api with comprehensive fields
- ✅ Admin-api audit logging endpoints
- ✅ Key actions instrumented with audit logging

#### Phase 3.4: Web Schema Cleanup (COMPLETED)
- ✅ **Removed deprecated AuditLog model from web**
- ✅ **Web audit logging approach**:
  - apps/web/lib/audit-log.ts provides file-based logging for web-local concerns
  - Critical actions call admin-api audit endpoints
  - No Prisma dependency for audit logging

**Status**: Audit logging is centralized in admin-api. Web does not own AuditLog schema.

### Phase 4: Future Domains (Planned)

Potential candidates for future migration:
- User preferences (if shared across bot and web)
- Guild settings and feature flags
- Analytics and metrics aggregation

## Current State Summary

### Models Owned by Admin-API
- User, Session
- Guild, UserGuild
- ClubAnalysis, ClubAnalysisImage, ClubMetric
- AuditLog
- Stat, Conversation, ChatMessage
- ScreenshotAnalysis, ScreenshotComparison

### Models Owned by Web
- UserPreferences (web-specific preferences)
- ChatConversation, ChatMessage (web UI chat state)
- GuildFeatureFlags (web feature toggles)
- CodeReport (web-specific code reporting)
- UserSession (web authentication sessions)

## Integration Patterns

### For Admin-API Canonical Domains

When consuming admin-api endpoints from web:

1. **Define domain types locally** (e.g., in `lib/club/database.ts`):
   ```typescript
   export interface StoredClubAnalysis {
     id: string;
     guildId: string;
     // ... match admin-api response shape
   }
   ```

2. **Call admin-api HTTP endpoints**:
   ```typescript
   const response = await fetch(`${ADMIN_API_URL}/club-analytics`, {
     method: 'POST',
     body: JSON.stringify(data)
   });
   ```

3. **Do NOT**:
   - Define Prisma models in web for admin-api domains
   - Use Prisma client in web to access shared tables
   - Create migrations in web that touch shared tables

## Migration Checklist

For any new domain being migrated to admin-api:

- [ ] Define Prisma models in admin-api/prisma/schema.prisma
- [ ] Create admin-api endpoints for CRUD operations
- [ ] Update web to call admin-api endpoints
- [ ] Remove duplicate Prisma models from web/prisma/schema.prisma
- [ ] Run `prisma generate` in web to update client
- [ ] Verify web build and tests pass
- [ ] Update this documentation

## Notes

- **Database Migrations**: Admin-api controls all migrations for shared schemas
- **Web Prisma Client**: Web maintains a Prisma client ONLY for web-specific models
- **Type Safety**: Web defines TypeScript interfaces matching admin-api response shapes
- **Testing**: Integration tests should verify web <-> admin-api communication

## Last Updated

Phase 2.4 completed: 2025-11-20
