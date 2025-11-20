# Prisma Database Migration Guide

**Status**: Phase 1-2 Complete + Phase 2.1 In Progress
**Last Updated**: 2025-11-20 (Phase 2.1 - Database Consolidation)
**Target**: Single canonical Prisma schema across web + admin-api with backwards compatibility

## Overview

This document outlines the incremental migration from:
1. MySQL → PostgreSQL/Prisma (admin-api)
2. Multiple separate Prisma schemas → Single canonical schema (Phase 2.1)
3. Isolated features → Integrated features via admin-api endpoints

The migration uses a **dual-write pattern** with feature flags for zero downtime.

## Current State (After Phase 2.1 - Database Consolidation)

### ✅ Completed

**Phase 1-2 (MySQL → Prisma):**
- PostgreSQL database configured (docker-compose in `apps/admin-api/infra/docker/`)
- Prisma schema extended with guild settings models:
  - `GuildSettings` - Guild configuration
  - `GuildPersonality` - AI personality settings
  - `Correction` - Club analytics corrections
- Feature flag system: `src/lib/config/featureFlags.ts`
- Test infrastructure: `tests/utils/setupTestDb.ts`, `tests/utils/factories.ts`

**Phase 2.1 (Database & Schema Consolidation):**
- ✅ Single PostgreSQL instance for both web + admin-api (DATABASE_URL shared)
- ✅ Chat models renamed for clarity:
  - `Conversation` → `GuildConversation` (guild communication)
  - `ChatMessage` → `GuildChatMessage` (guild communication)
  - Web keeps `ChatConversation` + `ChatMessage` (AI chat)
- ✅ Canonical models in admin-api:
  - ClubAnalysis* (from web, now canonical in admin-api)
  - AuditLog (from web, now canonical in admin-api)
- ✅ Web models marked as deprecated with migration comments
- ✅ Prisma migrations created for schema changes:
  - `20251120131627_rename_chat_models_for_clarity`
  - `20251120131640_mark_club_analytics_deprecated`

### ⏳ In Progress / Pending

**Phase 2.2-2.4:**
- Club analytics data migration (web → admin-api)
- Web to call admin-api /api/club-analytics/* instead of local Prisma
- Audit log integration (web events → admin-api)
- Session consolidation (optional)

## Schema Consolidation Architecture (Phase 2.1)

As of Phase 2.1, the database architecture is being consolidated to a single canonical schema:

### Database Connection Strategy
- **Single Postgres Instance per Environment**: Both web + admin-api use the same DATABASE_URL
- **Single Schema**: Both apps write to schema=public
- **Canonical Models in admin-api**: Guild management, club analytics, audit logs
- **Web-Local Models**: AI chat, user preferences, game features

### Canonical Models (Admin-API is source of truth)

**Core:**
- User, Session, Guild, UserGuild

**Guild Communication:**
- `GuildConversation` (renamed from `Conversation` for clarity)
- `GuildChatMessage` (renamed from `ChatMessage` for clarity)

**Club Analytics (moved from web):**
- ClubAnalysis, ClubAnalysisImage, ClubMetric

**Audit Trail:**
- AuditLog (comprehensive version with requestId, sessionId, etc.)

**Configuration:**
- GuildSettings, GuildPersonality, Correction

**Screenshots:**
- ScreenshotAnalysis, ScreenshotData, ScreenshotTag, ScreenshotComparison, etc.

**Webhooks:**
- Webhook, WebhookDelivery

### Web App Models (remain in web database, separate from admin-api)

**AI Chat (NOT guild communication):**
- `ChatConversation`, `ChatMessage` (AI conversations with roles: user/assistant/system)

**User Settings:**
- UserPreferences, GuildFeatureFlags

**Game Features:**
- CodeReport, UserSession

### Migration Path

**Web to Admin-API Integration:**
```
Old (Isolated):
Web App → Local ClubAnalysis table → Local PostgreSQL

New (Integrated):
Web App → HTTP Request → /api/club-analytics/* → Admin-API → Shared PostgreSQL
```

### Deprecation Timeline

**Current (Phase 2.1):**
- ClubAnalysis*, AuditLog marked as deprecated in web schema
- Models remain in web database for backwards compatibility
- Prisma migrations document the consolidation strategy

**Phase 2.2-2.3:**
- Data migration script (web ClubAnalysis → admin-api)
- Web calls admin-api endpoints instead of local Prisma
- Code updated to remove direct web schema references

**Phase 2.4 Cleanup:**
- Remove deprecated models from web schema
- Full consolidation to admin-api as canonical source

---

## Architecture: Dual-Write Pattern

The migration uses a **dual-write pattern** to gradually move data from MySQL/legacy storage to Prisma:

```
┌─────────────────────────────────────────────────────────┐
│                   Client Request                         │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────▼────────────┐
        │  GuildSettingsRepository│
        │  (isFeatureEnabled?)    │
        └───────┬──────────┬──────┘
        ╭───────▼──╮  ╭────▼──────╮
        │  MySQL   │  │  Prisma   │
        │ (Legacy) │  │(PostgreSQL)│
        ╰──────────╯  ╰───────────╯

Phase 1: Feature OFF (Default)
├─ Reads from MySQL
├─ Writes to MySQL
└─ (Reads from MySQL)

Phase 2: Feature ON - Dual Write
├─ Reads from MySQL (or Prisma if flag enables)
├─ Writes to BOTH MySQL AND Prisma
└─ Validates consistency

Phase 3: Feature ON - Read from Prisma
├─ Reads from Prisma
├─ Writes to Prisma (MySQL still optional for backwards compat)
└─ Can decommission MySQL

Phase 4: Cleanup
├─ Remove MySQL code
└─ Full PostgreSQL cutover
```

## Setting Up Local Development

### Prerequisites
- Docker & Docker Compose
- Node.js 20+
- pnpm

### 1. Start PostgreSQL Database

```bash
cd apps/admin-api

# Start PostgreSQL and Redis (from docker-compose.yml in infra/docker/)
docker-compose -f infra/docker/docker-compose.yml up -d

# Verify database is running
docker-compose -f infra/docker/docker-compose.yml ps
# Should show postgres and redis as "healthy"
```

### 2. Configure Environment

```bash
cd apps/admin-api

# Copy environment template
cp .env.example .env

# Update DATABASE_URL in .env (if not using Docker, or using different host)
# For local dev: postgresql://slimy:slimy_dev_password@localhost:5432/slimy
```

### 3. Run Migrations

```bash
cd apps/admin-api

# Install dependencies (if not done)
pnpm install

# Generate Prisma client
pnpm prisma:generate

# Run migrations
pnpm prisma:migrate

# Or reset/recreate database
pnpm db:reset
```

### 4. Verify Installation

```bash
# View database schema in Prisma Studio
pnpm prisma:studio

# Should open browser at http://localhost:5555
# Verify tables exist: guilds, users, guild_settings, guild_personalities, corrections, etc.
```

## Feature Flags

Feature flags control which database implementation is used for each domain:

### Environment Variables

```bash
# Feature Flags (all default to false/off for MySQL)
ENABLE_PRISMA_GUILD_SETTINGS=false    # OFF: Use MySQL, ON: Use Prisma
ENABLE_PRISMA_GUILD_PERSONALITY=false # OFF: Use files, ON: Use Prisma
ENABLE_PRISMA_CORRECTIONS=false       # OFF: Use in-memory, ON: Use Prisma
ENABLE_PRISMA_WEBHOOKS=true           # ON: Already uses Prisma (proven)
```

### Current Status

When server starts, feature flags are logged:

```
📋 Feature Flags:
  ✗ OFF - ENABLE_PRISMA_GUILD_SETTINGS
  ✗ OFF - ENABLE_PRISMA_GUILD_PERSONALITY
  ✗ OFF - ENABLE_PRISMA_CORRECTIONS
  ✓ ON  - ENABLE_PRISMA_WEBHOOKS
```

## Migration Phases

### Phase 1: Infrastructure ✅ COMPLETE
- [x] PostgreSQL running
- [x] Prisma schema defined
- [x] Migrations created
- [x] Test infrastructure in place
- [x] Server.js updated for Prisma initialization

### Phase 2: GuildSettings Dual-Write ⏳ IN PROGRESS

**Implementation**:
```typescript
// In src/repositories/guildSettings.ts
class GuildSettingsRepository {
  async upsertSettings(guildId: string, patch) {
    // 1. Read current from MySQL
    // 2. Merge with patch
    // 3. If ENABLE_PRISMA_GUILD_SETTINGS:
    //    - Write to Prisma (dual-write)
    // 4. Return merged result
  }
}
```

**Testing**:
```bash
# Run with feature flag OFF (default)
pnpm test

# Run with feature flag ON (dual-write)
ENABLE_PRISMA_GUILD_SETTINGS=true pnpm test

# Validate consistency
# Repository provides validateConsistency() method
```

**Rollout Steps**:
1. Deploy code with flag OFF (no behavior change)
2. Enable flag for test guilds (ENABLE_PRISMA_GUILD_SETTINGS=true)
3. Monitor for errors/inconsistencies
4. Enable flag globally (all guilds use dual-write)
5. Switch reads to Prisma (validate no data loss)
6. Decommission MySQL code

### Phase 3: Additional Domains

Similar to Phase 2, but for:
- Guild Personality settings
- Club Analytics corrections
- Session storage (from in-memory to database)

### Phase 4: Cleanup

- Remove MySQL code
- Remove feature flags
- Update documentation

## Test Database Setup

For integration tests using real database instead of mocks:

```typescript
// tests/guild-settings.test.ts
import {
  setupTestDb,
  cleanTestDb,
  teardownTestDb,
  createTestGuild,
  createTestGuildSettings,
} from './utils';

describe('GuildSettings', () => {
  beforeAll(async () => {
    await setupTestDb(); // Initialize test DB with migrations
  });

  afterEach(async () => {
    await cleanTestDb(); // Clean between tests
  });

  afterAll(async () => {
    await teardownTestDb(); // Close connection
  });

  test('should create guild settings', async () => {
    const guild = await createTestGuild();
    const settings = await createTestGuildSettings(guild.discordId);

    expect(settings.guildId).toBe(guild.discordId);
    expect(settings.viewMode).toBe('baseline');
  });
});
```

## Monitoring & Validation

### Feature Flag Logging

Server automatically logs status on startup:

```
[admin-api] Initializing Prisma database...
[admin-api] Prisma database initialized successfully
📋 Feature Flags:
  ✗ OFF - ENABLE_PRISMA_GUILD_SETTINGS
  ✗ OFF - ENABLE_PRISMA_GUILD_PERSONALITY
  ✗ OFF - ENABLE_PRISMA_CORRECTIONS
  ✓ ON  - ENABLE_PRISMA_WEBHOOKS
```

### Consistency Validation

```typescript
// Check if data is consistent between MySQL and Prisma
const repo = getGuildSettingsRepository();
const consistency = await repo.validateConsistency(guildId);

if (!consistency.consistent) {
  console.warn('Data mismatch detected!', consistency.differences);
}
```

### Metrics

The repository logs errors and migrations are tracked in server startup messages.

## Troubleshooting

### Database Connection Failed

```
✗ Failed to connect to test database
```

**Solution**:
```bash
# Check DATABASE_URL is set correctly
echo $DATABASE_URL

# Verify Postgres is running
docker-compose -f infra/docker/docker-compose.yml ps

# Check logs
docker-compose -f infra/docker/docker-compose.yml logs postgres

# Restart if needed
docker-compose -f infra/docker/docker-compose.yml restart postgres
```

### Migration Failed

```
Error: P3004 - Introspection operation failed
```

**Solution**:
```bash
# Reset database and re-run migrations
pnpm db:reset

# Or manually recreate:
docker-compose -f infra/docker/docker-compose.yml exec postgres dropdb -U slimy slimy
docker-compose -f infra/docker/docker-compose.yml exec postgres createdb -U slimy slimy
pnpm prisma:migrate
```

### Schema Mismatch

If Prisma schema doesn't match actual database:

```bash
# Introspect actual schema from database
pnpm prisma db pull

# Review changes, then sync
pnpm prisma migrate dev
```

## Next Steps

1. **Test Suite** - Run full test suite with new infrastructure
2. **Example Test** - Write sample integration test for GuildSettings
3. **Phase 2 Rollout** - Enable dual-write for GuildSettings in test environment
4. **Validation** - Verify data consistency between MySQL and Prisma
5. **Gradual Rollout** - Enable for all guilds, monitor, switch to Prisma reads
6. **Phase 3** - Repeat for other domains (Personality, Corrections, etc.)
7. **MySQL Decommission** - Remove legacy code after cutover

## References

- **Prisma Documentation**: https://www.prisma.io/docs/
- **Schema**: `apps/admin-api/prisma/schema.prisma`
- **Migrations**: `apps/admin-api/prisma/migrations/`
- **Repository**: `src/repositories/guildSettings.ts`
- **Feature Flags**: `src/lib/config/featureFlags.ts`
- **Test Utilities**: `tests/utils/`

## Questions & Issues

For questions or issues with the migration:

1. Check server logs for Prisma errors
2. Review feature flag status
3. Validate data consistency with `.validateConsistency()` method
4. Check this guide for troubleshooting section
5. Review Prisma logs in Prisma Studio (`pnpm prisma:studio`)
