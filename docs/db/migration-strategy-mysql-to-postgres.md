# Database Migration Strategy: MySQL to PostgreSQL/Prisma

## Executive Summary

This document outlines the migration strategy for transitioning the slimy-monorepo from its current MySQL-based database infrastructure to a PostgreSQL-based system using Prisma ORM. This migration is part of a broader modernization effort to leverage Prisma's type-safe database access, better tooling, and improved PostgreSQL features.

## Current State

### Database Architecture

**Production Environment:**
- **Database Engine**: MySQL 8.x
- **Access Method**: Direct SQL queries via `mysql2/promise` (connection pooling)
- **Connection**: Via `apps/admin-api/lib/database.js`
- **Default URL**: `mysql://user:password@127.0.0.1:3306/slimy`
- **Charset**: `utf8mb4_general_ci`
- **Deployment**: Docker container (`slimy-mysql`)

### Current Tables/Entities

**Legacy MySQL Tables** (admin-api):
- `guild_settings` - Guild configuration and preferences
  - Uses MySQL-specific: ENUM('baseline','latest'), TINYINT(1), ON UPDATE CURRENT_TIMESTAMP
- `guild_personality` - AI personality configuration for guilds
  - Uses MySQL-specific: ENUM types for tone/formality, TINYINT(1) for booleans

**Prisma-Ready Entities** (defined but not yet active):

*admin-api schema:*
- `users` - Discord user accounts
- `sessions` - User authentication sessions
- `guilds` - Discord guild (server) information
- `user_guilds` - Many-to-many relationship between users and guilds
- `conversations` - Chat conversation threads
- `chat_messages` - Individual chat messages
- `stats` - Analytics and statistics
- `club_analyses` - Club analytics results
- `club_analysis_images` - Images associated with club analyses
- `club_metrics` - Individual metrics from analyses
- `screenshot_analyses` - Screenshot analysis results
- `screenshot_data` - Extracted data from screenshots
- `screenshot_tags` - Tags for screenshot categorization
- `screenshot_comparisons` - Comparison results between screenshots
- `screenshot_insights` - AI-generated insights from screenshots
- `screenshot_recommendations` - Actionable recommendations
- `audit_logs` - Event sourcing and compliance logs

*web schema:*
- `club_analyses`, `club_analysis_images`, `club_metrics` - Club analysis system
- `user_preferences` - User-specific settings
- `chat_conversations`, `chat_messages` - Chat system
- `guild_feature_flags` - Feature flag persistence
- `code_reports` - Reported game codes tracking
- `audit_logs` - Audit trail
- `user_sessions` - Session management

### Current Limitations

1. **Type Safety**: Raw SQL queries lack compile-time type checking
2. **Migrations**: Manual SQL file management (see `apps/admin-api/lib/*.sql`)
3. **Query Building**: String concatenation prone to SQL injection if not careful
4. **Schema Drift**: No single source of truth for schema
5. **Testing**: Difficult to mock/test database interactions
6. **Replication**: MySQL-specific DDL limits portability

### Backup Infrastructure

- **Tool**: `mysqldump` wrapped in `apps/admin-api/src/util/mysql-dump.js`
- **Options**: Single transaction, hex-blob, routines, triggers
- **Compression**: Gzip
- **Retention**: 14 days (configurable via `BACKUP_RETENTION_DAYS`)
- **Paths**:
  - Root: `/var/backups/slimy`
  - MySQL: `/var/backups/slimy/mysql`

## Desired Future State

### Target Architecture

**Database Engine**: PostgreSQL 14+ (or latest stable)
**Access Method**: Prisma Client (type-safe ORM)
**Migration Tool**: Prisma Migrate
**Connection**: Via `DATABASE_URL` environment variable
**Deployment**: Docker container (replacing `slimy-mysql`)

### Key Improvements

1. **Type Safety**: Full TypeScript integration with Prisma Client
2. **Declarative Migrations**: Schema defined in `schema.prisma`, migrations auto-generated
3. **Better JSON Support**: Native JSONB with indexing and querying capabilities
4. **Advanced Features**: CTEs, window functions, array types, full-text search
5. **Better Tooling**: Prisma Studio for data browsing, better debugging
6. **Standardization**: Both `admin-api` and `web` apps using same ORM approach

### Schema Consolidation

After migration, we'll have:
- **admin-api**: Prisma schema at `apps/admin-api/prisma/schema.prisma`
- **web**: Prisma schema at `apps/web/prisma/schema.prisma`
- Shared database or separate databases (TBD based on isolation requirements)

## Migration Phases

### Phase 0: Preparation & Backup

**Duration**: 1-2 days
**Risk Level**: Low

#### Tasks

1. **Full Database Backup**
   ```bash
   # Create comprehensive backup
   mysqldump --single-transaction --routines --triggers \
     --hex-blob --all-databases | gzip > backup-pre-migration-$(date +%Y%m%d).sql.gz

   # Verify backup integrity
   gunzip -t backup-pre-migration-*.sql.gz
   ```

2. **Document Current Schema**
   ```bash
   # Export current schema
   mysqldump --no-data --routines --triggers slimy > current-schema.sql

   # Document row counts
   mysql -e "SELECT table_name, table_rows
             FROM information_schema.tables
             WHERE table_schema = 'slimy'" > table-counts.txt
   ```

3. **Audit Data Dependencies**
   - Identify all foreign key relationships
   - Document stored procedures/triggers (if any)
   - List all views (if any)
   - Catalog all indexes

4. **Set Up PostgreSQL Environment**
   ```bash
   # Update docker-compose to add Postgres service
   # Keep MySQL running in parallel initially
   ```

5. **Verify Prisma Schemas**
   - Review `apps/admin-api/prisma/schema.prisma`
   - Review `apps/web/prisma/schema.prisma`
   - Ensure all legacy tables are represented
   - Map MySQL-specific types to Postgres equivalents

6. **Create Rollback Plan**
   - Document steps to revert to MySQL
   - Test backup restoration procedures
   - Prepare monitoring/alerting for post-migration

#### Verification Checklist

- [ ] Full MySQL backup created and verified
- [ ] Schema documentation exported
- [ ] All table row counts documented
- [ ] PostgreSQL container running successfully
- [ ] Prisma schemas validated with `prisma validate`
- [ ] Rollback procedures documented and tested

---

### Phase 1: Shadow Database & Data Migration

**Duration**: 3-5 days
**Risk Level**: Medium

#### Tasks

1. **Initialize Prisma Migrations**
   ```bash
   cd apps/admin-api
   # Generate initial migration from schema
   npx prisma migrate dev --name init --create-only

   # Review generated SQL
   cat prisma/migrations/*/migration.sql

   # Apply to shadow database
   DATABASE_URL="postgresql://..." npx prisma migrate deploy
   ```

2. **Data Type Transformations**

   Create data migration scripts to handle:

   **MySQL → PostgreSQL Type Mappings**

   | MySQL Type | Postgres Type | Transformation Required |
   |------------|---------------|-------------------------|
   | `TINYINT(1)` | `BOOLEAN` | Convert 0/1 to false/true |
   | `ENUM('a','b')` | `TEXT` with CHECK or native ENUM | Create ENUM types first |
   | `VARCHAR(n)` | `VARCHAR(n)` or `TEXT` | Direct mapping |
   | `TEXT` | `TEXT` | Direct mapping |
   | `JSON` | `JSONB` | Direct with potential cleanup |
   | `TIMESTAMP` | `TIMESTAMP(3)` | Direct with precision |
   | `ON UPDATE CURRENT_TIMESTAMP` | Trigger or app logic | Create triggers if needed |
   | `AUTO_INCREMENT` | `SERIAL` or `IDENTITY` | Handled by Prisma |

3. **Data Migration Script**

   Create `scripts/migrate-data-mysql-to-postgres.js`:
   ```javascript
   // Pseudo-code
   // 1. Connect to both MySQL and Postgres
   // 2. For each table:
   //    - Extract data from MySQL
   //    - Transform data types
   //    - Batch insert into Postgres
   //    - Verify row counts match
   // 3. Update sequences to max(id) + 1
   ```

4. **Dual-Write Period (Optional)**

   If zero-downtime is critical:
   - Implement write interceptor to write to both MySQL and Postgres
   - Verify data consistency between databases
   - Duration: 1-7 days depending on confidence level

5. **Data Validation**
   ```bash
   # Compare row counts
   # Compare sample data checksums
   # Verify foreign key relationships
   # Test application queries against Postgres
   ```

6. **Update Application Code**
   - Replace `require('./lib/database.js')` with Prisma Client
   - Update all raw SQL queries to Prisma queries
   - Update backup scripts to use `pg_dump` instead of `mysqldump`

#### Code Migration Example

**Before (MySQL):**
```javascript
const { query } = require('./lib/database');
const guilds = await query('SELECT * FROM guilds WHERE discord_id = ?', [discordId]);
```

**After (Prisma):**
```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const guilds = await prisma.guild.findMany({
  where: { discordId }
});
```

#### Verification Checklist

- [ ] PostgreSQL schema matches Prisma schema
- [ ] All MySQL data successfully migrated
- [ ] Row counts match between MySQL and Postgres
- [ ] Foreign key relationships verified
- [ ] Sample queries tested against Postgres
- [ ] Application code updated to use Prisma
- [ ] All tests passing against Postgres
- [ ] Backup/restore procedures tested with `pg_dump`

---

### Phase 2: Cutover & Decommission

**Duration**: 1-2 days
**Risk Level**: High

#### Tasks

1. **Pre-Cutover Validation**
   - Run full test suite against Postgres
   - Performance test critical queries
   - Load test with production-like data volume
   - Verify all application features work

2. **Cutover Window Planning**
   - Schedule maintenance window (off-peak hours)
   - Notify stakeholders
   - Prepare rollback criteria
   - Assign team roles

3. **Cutover Execution**
   ```bash
   # 1. Enable maintenance mode
   # 2. Stop admin-api service
   # 3. Perform final MySQL backup
   # 4. Run final incremental data sync (if dual-write not used)
   # 5. Update DATABASE_URL to point to Postgres
   # 6. Update docker-compose.yml (switch from MySQL to Postgres)
   # 7. Start admin-api with Postgres
   # 8. Smoke test critical paths
   # 9. Disable maintenance mode
   # 10. Monitor closely for 24-48 hours
   ```

4. **Post-Cutover Monitoring**
   - Monitor application logs for database errors
   - Check query performance (slower queries?)
   - Verify data integrity
   - Monitor connection pool usage
   - Check disk space usage (Postgres vs MySQL)

5. **MySQL Decommission** (after 7-14 day soak period)
   ```bash
   # Keep final MySQL backup archived
   # Stop MySQL container
   # Remove MySQL from docker-compose
   # Archive MySQL data volume
   # Remove mysql2 dependencies from package.json
   # Remove legacy database.js file
   # Remove mysqldump utilities
   ```

#### Rollback Criteria

Rollback to MySQL if:
- Data corruption detected
- Critical query performance >2x slower
- Application errors >5% of requests
- Data inconsistencies found
- Critical feature broken

#### Rollback Procedure

```bash
# 1. Enable maintenance mode
# 2. Stop admin-api
# 3. Restore MySQL from final backup
# 4. Revert DATABASE_URL to MySQL
# 5. Revert docker-compose.yml
# 6. Start admin-api with MySQL
# 7. Verify functionality
# 8. Disable maintenance mode
```

#### Verification Checklist

- [ ] Application running on Postgres in production
- [ ] No critical errors in logs (24hr period)
- [ ] Query performance acceptable
- [ ] Data integrity verified
- [ ] Backups running successfully with `pg_dump`
- [ ] Monitoring dashboards updated
- [ ] Documentation updated
- [ ] Team trained on Prisma workflows

---

## Risk Areas & Mitigation

### 1. Date/Time Type Differences

**Risk**: MySQL `TIMESTAMP` has different timezone behavior than Postgres `TIMESTAMP`

**MySQL Behavior**:
- `TIMESTAMP` stored in UTC, converted based on session timezone
- `DATETIME` timezone-naive

**Postgres Behavior**:
- `TIMESTAMP` is timezone-naive (local time)
- `TIMESTAMPTZ` is timezone-aware (UTC storage)

**Mitigation**:
- Use Prisma's `DateTime` type (maps to `TIMESTAMP(3)`)
- Ensure application always works in UTC
- Test timezone edge cases thoroughly
- Document expected timezone behavior

### 2. JSON Field Differences

**Risk**: MySQL `JSON` vs Postgres `JSONB` have different storage and querying

**MySQL**:
- Validates JSON but stores as text
- Limited querying capabilities
- No indexing

**Postgres JSONB**:
- Binary storage format
- Rich querying with operators (`->`, `->>`, `@>`, etc.)
- Indexable with GIN indexes

**Mitigation**:
- Validate all JSON data during migration
- Update queries that access JSON fields to use Prisma's JSON filtering
- Consider adding GIN indexes for frequently queried JSON fields
- Test NULL vs empty object handling

### 3. ENUM Type Handling

**Risk**: MySQL `ENUM` must be migrated to Postgres ENUM or constrained TEXT

**Current MySQL ENUMs**:
```sql
-- guild_settings.view_mode
ENUM('baseline','latest')

-- guild_personality.tone
ENUM('neutral','friendly','playful','serious')

-- guild_personality.formality
ENUM('casual','neutral','formal')
```

**Options**:

**Option A: Native Postgres ENUM**
```sql
CREATE TYPE view_mode AS ENUM ('baseline', 'latest');
CREATE TYPE tone AS ENUM ('neutral', 'friendly', 'playful', 'serious');
```
- ✅ Type-safe at database level
- ❌ Harder to modify (requires migration to add values)

**Option B: VARCHAR/TEXT with CHECK constraint**
```sql
ALTER TABLE guild_settings
ADD CONSTRAINT view_mode_check
CHECK (view_mode IN ('baseline', 'latest'));
```
- ✅ Easier to modify
- ❌ Less explicit type safety

**Recommendation**: Use Prisma enums (generates Postgres ENUMs):
```prisma
enum ViewMode {
  baseline
  latest
}

enum Tone {
  neutral
  friendly
  playful
  serious
}
```

**Mitigation**:
- Map all MySQL ENUMs to Prisma enums
- Validate existing data matches allowed values
- Plan for ENUM evolution (adding values requires migrations)

### 4. Boolean Representation

**Risk**: MySQL `TINYINT(1)` vs Postgres `BOOLEAN`

**MySQL**:
- `TINYINT(1)` commonly used for booleans (0/1)
- Can also store other small integers

**Postgres**:
- Native `BOOLEAN` type (true/false/null)
- More explicit

**Mitigation**:
```javascript
// During migration, convert:
humor: row.humor === 1 ? true : false
emojis: row.emojis === 1 ? true : false
```

### 5. AUTO_INCREMENT vs SERIAL/IDENTITY

**Risk**: Sequence continuation after data migration

**Mitigation**:
```sql
-- After data migration, update sequences
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('guilds_id_seq', (SELECT MAX(id) FROM guilds));
-- Repeat for all tables with auto-increment/serial columns
```

Or use Prisma's `@default(cuid())` for new records (as currently defined).

### 6. Text Size Limits

**Risk**: `VARCHAR(n)` size differences and TEXT handling

**MySQL**:
- `VARCHAR` max: 65,535 bytes (depends on charset)
- `TEXT` types: TINYTEXT, TEXT, MEDIUMTEXT, LONGTEXT

**Postgres**:
- `VARCHAR(n)` enforces length
- `TEXT` unlimited (no practical limit)

**Mitigation**:
- Review all VARCHAR limits in migration
- Use TEXT for unlimited fields (Prisma default for `String`)
- Test with large content (chat messages, descriptions)

### 7. Foreign Key Constraint Timing

**Risk**: Circular dependencies during data load

**Mitigation**:
- Load data in topological order (parents before children)
- Temporarily defer constraints if needed:
  ```sql
  SET CONSTRAINTS ALL DEFERRED;
  -- load data
  SET CONSTRAINTS ALL IMMEDIATE;
  ```

### 8. Charset/Collation Differences

**Risk**: Emoji and special character handling

**MySQL**: `utf8mb4_general_ci` (case-insensitive)
**Postgres**: UTF8 with `en_US.UTF-8` collation (case-sensitive)

**Mitigation**:
- Ensure Postgres database created with UTF8 encoding
- Test emoji handling (Discord usernames, messages)
- Review case-sensitive queries (ILIKE vs LIKE)
- Update queries expecting case-insensitive comparison

### 9. Connection Pool Configuration

**Risk**: Different pooling behavior and limits

**MySQL** (mysql2):
- connectionLimit: 10
- waitForConnections: true

**Postgres** (Prisma):
- Default connection limit: (num_cores * 2) + 1
- Configurable via `connection_limit` parameter

**Mitigation**:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // DATABASE_URL example:
  // postgresql://user:pass@localhost:5432/slimy?connection_limit=10
}
```

### 10. Query Performance Differences

**Risk**: Some queries may be faster/slower on Postgres

**Mitigation**:
- Profile slow queries in MySQL
- Test equivalent Prisma queries against Postgres
- Use `EXPLAIN ANALYZE` in Postgres
- Add indexes as needed
- Consider materialized views for complex aggregations
- Monitor query performance post-migration

---

## Things That MUST Be Verified in Staging

### Data Integrity

- [ ] **Row Counts Match**: Every table has identical count MySQL vs Postgres
- [ ] **Sample Data Comparison**: Random sample of 100+ rows per table matches exactly
- [ ] **Foreign Key Integrity**: All FK relationships valid, no orphaned records
- [ ] **NULL Handling**: NULL vs empty string/zero values preserved correctly
- [ ] **JSON Validation**: All JSON fields parse correctly, nested structures intact
- [ ] **Date Ranges**: Historical dates (oldest/newest) match source
- [ ] **Unique Constraints**: All unique indexes enforced, no duplicates

### Application Functionality

- [ ] **User Authentication**: Login, logout, session management
- [ ] **Discord OAuth Flow**: Authorization callback handling
- [ ] **Guild Management**: CRUD operations on guilds and settings
- [ ] **Chat System**: Send/receive messages, conversation management
- [ ] **Stats Collection**: Analytics recording and retrieval
- [ ] **Club Analysis**: Upload, analyze, retrieve results
- [ ] **Screenshot Analysis**: Image upload, OCR, data extraction
- [ ] **Audit Logging**: Events recorded correctly with full details
- [ ] **Backup/Restore**: `pg_dump` creates valid backups, restoration works
- [ ] **Error Handling**: Database errors caught and logged appropriately

### Performance

- [ ] **Cold Start**: Application startup time with Prisma Client
- [ ] **Query Latency**: P50, P95, P99 latencies for critical queries
  - User lookup by Discord ID
  - Guild settings retrieval
  - Chat message pagination
  - Stats aggregation
  - Recent analyses listing
- [ ] **Connection Pool**: No pool exhaustion under normal load
- [ ] **Bulk Operations**: Large imports/exports complete successfully
- [ ] **Concurrent Writes**: No deadlocks or lock timeout issues
- [ ] **Index Effectiveness**: EXPLAIN plans show index usage

### Edge Cases

- [ ] **Unicode/Emoji**: Discord usernames with emoji, special characters
- [ ] **Large Text Fields**: Chat messages with 2000+ characters
- [ ] **Large JSON**: Complex analysis results with deep nesting
- [ ] **Timezone Edge Cases**: Daylight saving transitions, midnight boundaries
- [ ] **Concurrent Updates**: Race conditions on settings updates
- [ ] **Cascading Deletes**: User deletion cascades correctly to related records
- [ ] **NULL Coalescing**: Queries expecting NULL vs default values
- [ ] **Boolean Edge Cases**: true/false/NULL handling in filters
- [ ] **Empty Arrays/Objects**: JSON fields with [] and {} values

### Migration-Specific

- [ ] **ENUM Values**: All existing values valid in new schema
- [ ] **Sequence Initialization**: Auto-increment continues from max(id)
- [ ] **Default Values**: New records get correct defaults
- [ ] **Triggers/Constraints**: `updatedAt` fields auto-update on modification
- [ ] **Transaction Isolation**: Read committed behavior consistent
- [ ] **Locking Behavior**: No unexpected table locks during updates

### Monitoring & Observability

- [ ] **Logging**: Database queries logged at appropriate level
- [ ] **Error Tracking**: Prisma errors captured in error tracking (e.g., Sentry)
- [ ] **Metrics**: Connection pool size, query duration metrics available
- [ ] **Alerting**: Alerts configured for slow queries, errors, connection issues
- [ ] **Dashboards**: Database health dashboard showing key metrics

### Rollback Testing

- [ ] **Rollback Procedure Documented**: Step-by-step rollback tested
- [ ] **Rollback Time Measured**: Can rollback within SLA window
- [ ] **Backup Restoration**: MySQL backup restores successfully
- [ ] **Application Reverts**: Code rollback to MySQL version works

---

## Timeline Estimate

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Phase 0: Preparation & Backup | 1-2 days | 2 days |
| Phase 1: Shadow DB & Migration | 3-5 days | 7 days |
| Phase 2: Staging Verification | 2-3 days | 10 days |
| Phase 3: Cutover (Production) | 1 day | 11 days |
| Phase 4: Monitoring Period | 7 days | 18 days |
| Phase 5: MySQL Decommission | 1 day | 19 days |

**Total Estimated Time**: 3-4 weeks (with conservative estimates)

**Assumptions**:
- Data volume is moderate (<1M rows total)
- No major schema redesign required
- Dedicated engineering resources
- Staging environment available
- Stakeholder alignment on schedule

---

## Success Criteria

### Immediate (Day 1 Post-Cutover)

- ✅ Application fully operational on PostgreSQL
- ✅ Zero data loss (row counts match)
- ✅ All critical user paths functional
- ✅ Error rate <1%
- ✅ P95 query latency within 10% of baseline

### Short-term (Week 1)

- ✅ No database-related incidents
- ✅ Backup/restore procedures validated in production
- ✅ Team comfortable with Prisma workflows
- ✅ Performance metrics stable or improved

### Long-term (Month 1)

- ✅ MySQL fully decommissioned
- ✅ Documentation updated
- ✅ New features using Prisma exclusively
- ✅ Cost savings realized (if applicable)
- ✅ Developer satisfaction improved

---

## Appendix

### A. Useful Commands

**Prisma**:
```bash
# Generate Prisma Client
npx prisma generate

# Create migration
npx prisma migrate dev --name migration_name

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (dev only)
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio

# Validate schema
npx prisma validate

# Format schema
npx prisma format
```

**PostgreSQL**:
```bash
# Backup
pg_dump -Fc -f backup.dump slimy

# Restore
pg_restore -d slimy backup.dump

# Connect to database
psql postgresql://user:pass@localhost:5432/slimy

# Query table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

# Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

### B. Reference Links

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Migrate Guide](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [MySQL to PostgreSQL Migration Guide](https://www.postgresql.org/docs/current/migration.html)

### C. Team Contacts

*(Fill in with actual team information)*

- **DBA**: [Name/Contact]
- **DevOps**: [Name/Contact]
- **Backend Lead**: [Name/Contact]
- **On-Call**: [Rotation Schedule]

### D. Configuration Reference

**Environment Variables**:
```bash
# PostgreSQL connection
DATABASE_URL="postgresql://user:password@localhost:5432/slimy?schema=public&connection_limit=10"

# Prisma settings
PRISMA_QUERY_LOG=true  # Enable query logging
PRISMA_DEBUG=true      # Enable debug output
```

**Docker Compose Postgres Service**:
```yaml
postgres:
  image: postgres:14-alpine
  container_name: slimy-postgres
  restart: unless-stopped
  environment:
    POSTGRES_USER: ${POSTGRES_USER:-slimy}
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    POSTGRES_DB: ${POSTGRES_DB:-slimy}
  ports:
    - "5432:5432"
  volumes:
    - postgres-data:/var/lib/postgresql/data
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER}"]
    interval: 10s
    timeout: 5s
    retries: 5
```

---

**Document Version**: 1.0
**Last Updated**: 2025-11-19
**Author**: Claude Code
**Status**: Draft - Pending Review
