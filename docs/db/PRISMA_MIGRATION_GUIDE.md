# Prisma Migration Guide

This guide explains the Prisma schema architecture and migration patterns for the slimy-monorepo.

## Schema Ownership Model

### Two Independent Prisma Schemas

The monorepo maintains **two separate Prisma schemas** with clear ownership boundaries:

1. **Admin-API Schema** (`apps/admin-api/prisma/schema.prisma`)
   - **Owner**: Admin-API backend service
   - **Purpose**: Canonical source of truth for shared/backend domains
   - **Controls**: All migrations for shared tables

2. **Web Schema** (`apps/web/prisma/schema.prisma`)
   - **Owner**: Web frontend application
   - **Purpose**: Web-specific local state and preferences
   - **Controls**: Migrations for web-only tables

### Critical Rule: No Schema Duplication

**As of Phase 2.4**, web does not own Prisma models for:
- ✅ Club analytics (ClubAnalysis, ClubAnalysisImage, ClubMetric)
- ✅ Audit logging (AuditLog)

These domains are **exclusively owned by admin-api**.

## Domain Ownership Reference

### Admin-API Owned Domains

These models are defined ONLY in `apps/admin-api/prisma/schema.prisma`:

- **User Management**: User, Session
- **Guild Management**: Guild, UserGuild
- **Club Analytics**: ClubAnalysis, ClubAnalysisImage, ClubMetric
- **Audit Logging**: AuditLog
- **Statistics**: Stat
- **Conversations**: Conversation, ChatMessage
- **Screenshots**: ScreenshotAnalysis, ScreenshotComparison

**Admin-API controls**:
- Schema definitions via Prisma
- Database migrations
- Table structure and indexes
- Data access patterns

**Web consumes via**:
- HTTP API calls to admin-api endpoints
- TypeScript interfaces (not Prisma types)

### Web-Only Domains

These models are defined ONLY in `apps/web/prisma/schema.prisma`:

- **UserPreferences**: Web UI preferences (theme, language, etc.)
- **ChatConversation**: Web chat UI state
- **ChatMessage**: Web chat messages
- **GuildFeatureFlags**: Web feature toggles
- **CodeReport**: Web code reporting system
- **UserSession**: Web authentication sessions

**Web controls**:
- Schema definitions for these web-specific tables
- Migrations for these tables only
- Direct Prisma access within web app

## Migration Patterns

### For Admin-API Domains

When you need to modify a shared domain (e.g., club analytics, audit logs):

1. **Update the schema** in `apps/admin-api/prisma/schema.prisma`
2. **Create migration** from admin-api:
   ```bash
   cd apps/admin-api
   pnpm db:migrate
   ```
3. **Generate client** for admin-api:
   ```bash
   cd apps/admin-api
   pnpm db:generate
   ```
4. **Update admin-api endpoints** to expose new fields/functionality
5. **Update web** to consume new API shape (update TypeScript interfaces only)
6. **DO NOT** add these models to web's schema

### For Web-Only Domains

When you need to modify web-specific models:

1. **Update the schema** in `apps/web/prisma/schema.prisma`
2. **Create migration** from web:
   ```bash
   cd apps/web
   pnpm db:migrate
   ```
3. **Generate client** for web:
   ```bash
   cd apps/web
   pnpm db:generate
   ```
4. **Use Prisma client** directly in web code

### When Adding a New Domain

Decide ownership first:

**Use Admin-API if**:
- Shared between bot and web
- Backend business logic required
- Needs audit logging
- Complex queries or aggregations

**Use Web if**:
- Pure UI/UX state
- User preferences for web only
- Temporary/cache data
- No backend access needed

## Common Patterns

### Accessing Admin-API Data from Web

**❌ WRONG** - Don't define Prisma models in web:
```typescript
// apps/web/prisma/schema.prisma
model ClubAnalysis {  // ❌ NO! Don't duplicate admin-api models
  id String @id
  // ...
}
```

**✅ CORRECT** - Define TypeScript interfaces, call HTTP API:
```typescript
// apps/web/lib/club/database.ts
export interface StoredClubAnalysis {
  id: string;
  guildId: string;
  // ... matches admin-api response shape
}

// apps/web/lib/api/clubAnalytics.ts
async function fetchAnalysis(id: string): Promise<StoredClubAnalysis> {
  const response = await fetch(`${ADMIN_API_URL}/club-analytics/${id}`);
  return response.json();
}
```

### Type Safety Without Duplication

You can create shared type packages if needed:

```bash
# Future improvement
packages/
  shared-types/
    club-analytics.ts
    audit-log.ts
```

But for now, web defines local interfaces matching API contracts.

## Database Setup

Both schemas point to the **same PostgreSQL database**, but manage **different tables**:

```env
# Both apps use same DATABASE_URL
DATABASE_URL=postgresql://user:pass@localhost:5432/slimy_db
```

**Important**: Prisma migrations from each app only touch their owned tables. The shared database means:
- Admin-API migrations manage: `club_analyses`, `audit_logs`, `users`, `guilds`, etc.
- Web migrations manage: `user_preferences`, `chat_conversations`, `code_reports`, etc.

## Migration Commands

### Admin-API

```bash
# From monorepo root or apps/admin-api
pnpm db:generate       # Generate Prisma client
pnpm db:migrate        # Create and apply migration
pnpm db:studio         # Open Prisma Studio
pnpm db:reset          # Reset database (destructive!)
```

### Web

```bash
# From monorepo root or apps/web
pnpm db:generate       # Generate Prisma client
pnpm db:migrate        # Create and apply migration
pnpm db:studio         # Open Prisma Studio
pnpm db:reset          # Reset database (destructive!)
```

## Troubleshooting

### "Cannot find Prisma type" in Web

If web code imports a type from `@prisma/client` that no longer exists (e.g., `ClubAnalysis`):

1. **Don't add it back to web schema**
2. **Define a local interface** instead:
   ```typescript
   export interface ClubAnalysis {
     id: string;
     // ... fields needed by web
   }
   ```
3. **Fetch data via admin-api HTTP endpoint**

### "Table already exists" during migration

This can happen if:
- You try to create a table in web that admin-api owns
- You try to create a table in admin-api that web owns

**Solution**: Determine correct ownership, remove from wrong schema, run migrations from correct app.

### Schema Drift

To check if schemas are in sync with database:

```bash
# Admin-API
cd apps/admin-api
npx prisma migrate status

# Web
cd apps/web
npx prisma migrate status
```

## Phase 2.4 Changes

As of Phase 2.4 (2025-11-20):

### Removed from Web Schema
- `ClubAnalysis` model
- `ClubAnalysisImage` model
- `ClubMetric` model
- `AuditLog` model

### Removed from Web Codebase
- `apps/web/lib/repositories/club-analytics.repository.ts` (unused Prisma repository)

### Web Now Uses
- Admin-API HTTP endpoints for club analytics
- Admin-API HTTP endpoints for audit logging
- Local TypeScript interfaces for type safety

### Database Tables
**No tables were dropped**. The underlying tables (`club_analyses`, `club_analysis_images`, `club_metrics`, `audit_logs`) remain in the database, managed by admin-api migrations.

## Future Considerations

When admin-api is fully stable and all domains are migrated:

1. **Consider table cleanup**: Drop old tables that are no longer needed
2. **Create shared type package**: Extract common types to `packages/shared-types`
3. **API versioning**: Implement versioned admin-api endpoints for stability
4. **Schema validation**: Add runtime validation of API responses in web

## Best Practices

1. ✅ **Always check ownership** before modifying a model
2. ✅ **Admin-API first** for shared domains
3. ✅ **Web schema is minimal** - only truly web-specific models
4. ✅ **Migrations from one app** - don't duplicate migrations
5. ✅ **Types in web match API** - keep interfaces in sync with admin-api responses
6. ❌ **Never duplicate models** across admin-api and web schemas
7. ❌ **Never run migrations from web** that touch admin-api tables

## Summary

| Aspect | Admin-API | Web |
|--------|-----------|-----|
| **Schema File** | `apps/admin-api/prisma/schema.prisma` | `apps/web/prisma/schema.prisma` |
| **Domains** | Shared/backend (club analytics, audit logs, users, guilds) | Web-specific (preferences, UI state) |
| **Migrations** | Owns migrations for shared tables | Owns migrations for web-only tables |
| **Access Pattern** | Prisma client within admin-api | HTTP API calls to admin-api |
| **Type Source** | Prisma-generated types | TypeScript interfaces matching API |

---

**Last Updated**: 2025-11-20 (Phase 2.4)
