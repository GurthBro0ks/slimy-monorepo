# Database Migration Roadmap: MySQL to PostgreSQL

**Status**: Migration in progress
**Target**: Consolidate to PostgreSQL 16 for all services
**Last Updated**: 2025-11-19

---

## Executive Summary

The Slimy monorepo is currently in a **partial migration state** from MySQL 8.0 to PostgreSQL 16. This document outlines the current state, target architecture, and step-by-step migration plan to complete the transition.

**Key Finding**: The infrastructure is split across two production environments:
- **slimy-nuc1**: MySQL 8.0 (legacy)
- **slimy-nuc2**: PostgreSQL 16 (current target)

---

## 1. Current State

### 1.1 Database Infrastructure

#### MySQL 8.0 (Legacy - slimy-nuc1)
- **Location**: `infra/docker/docker-compose.slimy-nuc1.yml:4-47`
- **Container**: `slimy-mysql`
- **Port**: 3306
- **Volume**: `slimy-db-data`
- **Services Using**:
  - `apps/admin-api` (via legacy `lib/database.js`)
  - Dependency declared for `admin-ui` and `web` (though web uses Postgres)

#### PostgreSQL 16 (Current - slimy-nuc2)
- **Location**: `infra/docker/docker-compose.slimy-nuc2.yml:4-21`
- **Container**: `slimy-db`
- **Image**: `postgres:16-alpine`
- **Port**: 5432
- **Volume**: `postgres_data` (external)
- **Health Check**: `pg_isready`
- **Services Using**:
  - `apps/admin-api` (via new `src/lib/database.js`)
  - `apps/web` (fully migrated)

### 1.2 Service-Level Database Usage

#### apps/web ✅ **FULLY MIGRATED**
- **Database**: PostgreSQL only
- **ORM**: Prisma 6.19.0
- **Schema**: `apps/web/prisma/schema.prisma:9` (provider: `postgresql`)
- **Client**: `apps/web/lib/db.ts`
- **Connection**: `DATABASE_URL` env variable
- **Models**:
  - ClubAnalysis, ClubAnalysisImage, ClubMetric
  - UserPreferences
  - ChatConversation, ChatMessage
  - GuildFeatureFlags
  - CodeReport
  - AuditLog
  - UserSession
- **Migration Status**: ✅ Complete (no MySQL dependencies)

#### apps/admin-api ⚠️ **DUAL DATABASE SETUP**

**Legacy MySQL Implementation** (Still Active):
- **File**: `apps/admin-api/lib/database.js`
- **Driver**: `mysql2/promise` (v3.15.3)
- **Connection**: `DB_URL` env variable
- **Usage**: Direct SQL queries with connection pooling
- **Methods**: `query()`, `one()`, `tx()` (transactions)
- **Loaded by**: `apps/admin-api/server.js:8` ⚠️ **Currently active entrypoint**

**New PostgreSQL Implementation** (Prepared but inactive):
- **File**: `apps/admin-api/src/lib/database.js`
- **ORM**: Prisma Client (5.22.0 in package-lock only)
- **Connection**: `DATABASE_URL` env variable
- **Schema**: `apps/admin-api/prisma/schema.prisma:9` (provider: `postgresql`)
- **Migration**: `apps/admin-api/prisma/migrations/20241106000000_init/`
- **Models**:
  - User, Session
  - Guild, UserGuild
  - Conversation, ChatMessage
  - Stat
  - ClubAnalysis, ClubAnalysisImage, ClubMetric
  - ScreenshotAnalysis, ScreenshotData, ScreenshotTag
  - ScreenshotComparison, ScreenshotInsight, ScreenshotRecommendation
  - AuditLog
- **Issue**: ❌ `@prisma/client` not in `package.json` dependencies (only in lockfile)
- **Loaded by**: Nothing yet (not wired to server.js)

#### apps/admin-ui
- **Type**: Frontend only
- **Database Access**: None (communicates with admin-api via REST)

#### apps/bot
- **Type**: Empty placeholder
- **Database Access**: None

### 1.3 Environment Variable State

**MySQL (Legacy)**:
- `DB_URL=mysql://user:password@127.0.0.1:3306/slimy`
- Used in: `apps/admin-api/.env.admin.example`, `.env.admin.production.example`
- Parsed by: Custom entrypoint script in `docker-compose.slimy-nuc1.yml`

**PostgreSQL (Current)**:
- `DATABASE_URL=postgresql://slimyai:password@postgres:5432/slimyai?schema=public`
- Used in: `apps/admin-api/.env.example`, `apps/web/.env.example`
- Validated by: `apps/admin-api/src/lib/config/index.js:66-71`

**Redis (Both apps)**:
- `REDIS_URL`, `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
- Used for: Caching, session storage, queue processing, DDoS protection
- Not affected by database migration

### 1.4 Schema Compatibility Analysis

**Overlapping Models** (exist in both web and admin-api schemas):
- ClubAnalysis
- ClubAnalysisImage
- ClubMetric
- AuditLog

**admin-api Specific Models**:
- User, Session
- Guild, UserGuild
- Conversation, ChatMessage (admin context)
- Stat
- Screenshot* (analysis, data, tags, comparisons, insights, recommendations)

**web Specific Models**:
- UserPreferences
- ChatConversation, ChatMessage (user context)
- GuildFeatureFlags
- CodeReport
- UserSession

**Type Differences** (MySQL vs PostgreSQL):
- MySQL uses `DATETIME` → Postgres uses `TIMESTAMP(3)`
- MySQL uses `JSON` → Postgres uses `JSONB`
- MySQL uses `TEXT` → Postgres uses `TEXT` (compatible)
- MySQL AUTO_INCREMENT → Postgres SERIAL/IDENTITY
- Charset concerns: MySQL `utf8mb4` → Postgres native UTF-8

---

## 2. Target State

### 2.1 Target Architecture

**Single Database System**:
- PostgreSQL 16 (alpine) as the sole RDBMS
- Redis for caching/sessions/queues (unchanged)
- All services use Prisma ORM for type-safety and migrations

**Service Configuration**:
- `apps/web`: PostgreSQL via Prisma ✅ (already complete)
- `apps/admin-api`: PostgreSQL via Prisma (migration needed)
- `apps/admin-ui`: No changes (frontend only)

**Infrastructure**:
- Deprecate `docker-compose.slimy-nuc1.yml` (MySQL-based)
- Standardize on `docker-compose.slimy-nuc2.yml` pattern (PostgreSQL-based)
- Single `DATABASE_URL` environment variable standard
- Remove all `DB_URL` references

### 2.2 Benefits of Target State

1. **Simplified Infrastructure**:
   - Single database system to maintain
   - Unified backup/restore procedures
   - Consistent monitoring and alerting

2. **Developer Experience**:
   - Single ORM (Prisma) across all services
   - Type-safe database access
   - Automatic migration generation
   - Better IDE support

3. **PostgreSQL Advantages**:
   - Superior JSON support (JSONB with indexing)
   - Better full-text search capabilities
   - More robust concurrency (MVCC)
   - Advanced features (CTEs, window functions, array types)
   - No licensing concerns (truly open source)

4. **Cost & Performance**:
   - Eliminate dual-database operational overhead
   - Better query optimization in PostgreSQL
   - Reduced complexity in deployment pipelines

---

## 3. Migration Phases

### Phase 1: Preparation & Validation ⏱️ **1-2 weeks**

#### 1.1 Code Inventory & Dependency Audit
**Objective**: Identify all MySQL-specific code that needs conversion

**Tasks**:
- [ ] Audit all SQL queries in `apps/admin-api/lib/database.js`
- [ ] Search for direct `mysql2` usage across codebase
- [ ] Identify MySQL-specific syntax (e.g., `LIMIT` vs `OFFSET`, date functions)
- [ ] Document all stored procedures/triggers (if any)
- [ ] List all direct SQL queries that bypass the ORM
- [ ] Review transaction handling patterns

**Success Criteria**:
- Complete inventory document of MySQL-specific code
- All breaking changes identified
- Zero unknown dependencies

#### 1.2 Schema Reconciliation
**Objective**: Ensure Prisma schemas accurately reflect production MySQL schemas

**Tasks**:
- [ ] Generate current MySQL schema dump from production
- [ ] Compare with `apps/admin-api/prisma/schema.prisma`
- [ ] Identify schema drift (missing columns, indexes, constraints)
- [ ] Update Prisma schema to match production state
- [ ] Generate new Prisma migration for any corrections
- [ ] Validate foreign key relationships
- [ ] Document any MySQL-specific features that need PostgreSQL equivalents

**Files to Update**:
- `apps/admin-api/prisma/schema.prisma`
- `apps/admin-api/prisma/migrations/` (new migration if needed)

**Success Criteria**:
- Prisma schema 100% matches production MySQL schema
- All indexes documented and equivalent in PostgreSQL
- All constraints validated

#### 1.3 Prisma Dependency Fix
**Objective**: Add missing Prisma dependency to admin-api

**Tasks**:
- [ ] Add `@prisma/client` to `apps/admin-api/package.json` dependencies
- [ ] Update Prisma to latest stable version (currently 6.19.0 in web)
- [ ] Run `pnpm install` to update lockfile
- [ ] Verify `prisma generate` works correctly
- [ ] Add Prisma scripts to package.json (generate, migrate, studio)

**Files to Update**:
- `apps/admin-api/package.json`

**Success Criteria**:
- Prisma properly installed as a direct dependency
- `pnpm db:generate` works without errors
- TypeScript types generated correctly

#### 1.4 Test Data Preparation
**Objective**: Create comprehensive test dataset for validation

**Tasks**:
- [ ] Export representative sample from production MySQL (anonymized)
- [ ] Create SQL dump scripts for MySQL and PostgreSQL formats
- [ ] Set up staging environment with both databases
- [ ] Validate data integrity tools (checksums, row counts)
- [ ] Document data volume and expected migration time

**Success Criteria**:
- Test dataset represents all table structures
- Migration time estimates established
- Rollback procedures documented

### Phase 2: Data Migration Strategy ⏱️ **2-3 weeks**

#### 2.1 Migration Tool Selection
**Options**:

**Option A: Prisma Migrate (Recommended for new deployments)**
- ✅ Type-safe, version-controlled migrations
- ✅ Automatic migration generation
- ✅ Built-in rollback support
- ❌ Not designed for cross-database data transfer
- **Use case**: Schema creation on new PostgreSQL database

**Option B: Custom Migration Script**
- ✅ Full control over data transformation
- ✅ Can handle complex data conversions
- ✅ Progress tracking and resumability
- ❌ More development time required
- **Use case**: Large datasets with complex transformations

**Option C: pgLoader (Recommended for bulk data transfer)**
- ✅ Purpose-built for MySQL → PostgreSQL migration
- ✅ Handles type conversions automatically
- ✅ Incremental load support
- ✅ Excellent performance
- ❌ Requires additional tooling
- **Use case**: Bulk data transfer with minimal transformation

**Option D: Dual-Write Pattern (Zero-downtime migration)**
- ✅ No downtime required
- ✅ Gradual migration with rollback safety
- ✅ Data validation in production
- ❌ Application complexity increases
- ❌ Requires careful synchronization logic
- **Use case**: Mission-critical systems requiring zero downtime

**Recommendation**:
- **Phase 2a**: Use **Prisma Migrate** to set up PostgreSQL schema
- **Phase 2b**: Use **pgLoader** for initial bulk data transfer
- **Phase 2c**: Implement **Dual-Write** pattern for zero-downtime cutover

#### 2.2 Prisma Schema Setup (PostgreSQL)

**Tasks**:
- [ ] Ensure `apps/admin-api/prisma/schema.prisma` is finalized
- [ ] Run `prisma migrate deploy` on staging PostgreSQL
- [ ] Verify all tables, indexes, and constraints created correctly
- [ ] Run `prisma generate` to create TypeScript client
- [ ] Validate schema matches MySQL structure (minus MySQL-specific features)

**Success Criteria**:
- PostgreSQL schema created without errors
- All foreign keys and indexes present
- Prisma client generated successfully

#### 2.3 Bulk Data Transfer (pgLoader)

**Setup**:
```bash
# Install pgLoader
apt-get install pgloader  # or brew install pgloader

# Create pgLoader configuration
# See: apps/admin-api/scripts/pgloader-config.load (to be created)
```

**Tasks**:
- [ ] Create pgLoader configuration file
- [ ] Test on staging environment with sample data
- [ ] Validate data type conversions:
  - DATETIME → TIMESTAMP(3)
  - JSON → JSONB
  - TINYINT(1) → BOOLEAN
  - AUTO_INCREMENT → SERIAL
- [ ] Test performance and estimate production load time
- [ ] Document any data transformation requirements
- [ ] Create rollback plan

**Data Validation Checklist**:
- [ ] Row counts match between MySQL and PostgreSQL
- [ ] Primary keys preserved
- [ ] Foreign key relationships intact
- [ ] JSON data structure preserved
- [ ] Date/time values match (accounting for timezone)
- [ ] NULL handling consistent
- [ ] Unicode/emoji data preserved (utf8mb4 → UTF8)

**Success Criteria**:
- All tables transferred successfully
- Zero data loss
- Referential integrity maintained
- Performance acceptable (<X hours for full dataset)

#### 2.4 Custom Migration Script Development (If needed)

**Use Case**: If pgLoader cannot handle specific transformations

**Tasks**:
- [ ] Create `apps/admin-api/scripts/migrate-mysql-to-postgres.js`
- [ ] Implement connection to both databases
- [ ] Add progress tracking and logging
- [ ] Implement batch processing for large tables
- [ ] Add error handling and resume capability
- [ ] Create data validation functions
- [ ] Test on staging environment

**Script Structure**:
```javascript
// Pseudocode structure
async function migrateTable(tableName, batchSize = 1000) {
  // 1. Get total row count from MySQL
  // 2. Loop in batches
  // 3. Transform data (dates, JSON, etc.)
  // 4. Insert into PostgreSQL using Prisma
  // 5. Validate checksums
  // 6. Log progress
}
```

**Success Criteria**:
- Script handles all edge cases
- Resume from failure supported
- Comprehensive logging
- Data validation built-in

### Phase 3: Application Code Migration ⏱️ **3-4 weeks**

#### 3.1 Database Abstraction Layer Update

**Current State**:
- MySQL: `apps/admin-api/lib/database.js` (raw SQL with mysql2)
- PostgreSQL: `apps/admin-api/src/lib/database.js` (Prisma wrapper)

**Tasks**:
- [ ] Review all SQL queries in old `lib/database.js`
- [ ] Convert to Prisma queries in `src/lib/database.js`
- [ ] Handle SQL syntax differences:
  - MySQL backticks → PostgreSQL quotes (or use Prisma)
  - `LIMIT` behavior
  - Date/time functions (`NOW()` vs `CURRENT_TIMESTAMP`)
  - String concatenation (`CONCAT()` vs `||`)
  - Case sensitivity
- [ ] Add comprehensive error handling
- [ ] Implement connection pooling configuration
- [ ] Add query logging for debugging

**Success Criteria**:
- All database operations use Prisma
- Zero raw SQL queries (or documented exceptions)
- Comprehensive test coverage

#### 3.2 API Route Conversion

**Objective**: Update all Express routes to use new Prisma-based database layer

**Tasks**:
- [ ] Identify all route handlers using database
- [ ] Update imports from `../lib/database` → `./lib/database`
- [ ] Convert raw SQL queries to Prisma queries
- [ ] Update transaction handling (mysql2 transactions → Prisma `$transaction`)
- [ ] Test each endpoint individually
- [ ] Update error handling for Prisma-specific errors

**Example Conversion**:
```javascript
// OLD (MySQL)
const users = await db.query('SELECT * FROM users WHERE guild_id = ?', [guildId]);

// NEW (Prisma)
const users = await db.user.findMany({
  where: { guildId }
});
```

**Files to Review**:
- All files in `apps/admin-api/routes/` or `apps/admin-api/src/routes/`
- Any controllers, services, or middleware using database

**Success Criteria**:
- All routes use new database module
- Integration tests pass
- API contract unchanged (same responses)

#### 3.3 Transaction Handling Migration

**MySQL Transaction Pattern** (current):
```javascript
await db.tx(async (connection) => {
  await connection.query('INSERT INTO ...');
  await connection.query('UPDATE ...');
});
```

**Prisma Transaction Pattern** (target):
```javascript
await db.$transaction(async (tx) => {
  await tx.model.create({...});
  await tx.model.update({...});
});
```

**Tasks**:
- [ ] Identify all transaction usage
- [ ] Convert to Prisma `$transaction` API
- [ ] Test rollback behavior
- [ ] Document transaction isolation levels

**Success Criteria**:
- All transactions migrated
- ACID properties preserved
- Rollback behavior validated

#### 3.4 Testing & Validation

**Unit Tests**:
- [ ] Update database mocks for Prisma
- [ ] Test individual Prisma queries
- [ ] Test edge cases (NULL handling, empty results)
- [ ] Test error conditions

**Integration Tests**:
- [ ] Test API endpoints against PostgreSQL
- [ ] Validate response formats unchanged
- [ ] Test authentication/authorization flows
- [ ] Test file uploads, websockets, etc.

**Performance Tests**:
- [ ] Benchmark critical queries
- [ ] Compare PostgreSQL performance to MySQL baseline
- [ ] Identify slow queries and optimize
- [ ] Test under load (concurrent requests)

**Success Criteria**:
- All tests pass
- Performance equal or better than MySQL
- No regressions in functionality

### Phase 4: Dual-Write Implementation (Zero-Downtime Migration) ⏱️ **2-3 weeks**

**Note**: This phase is optional but recommended for production systems requiring zero downtime.

#### 4.1 Dual-Write Logic

**Objective**: Write to both MySQL and PostgreSQL simultaneously during migration

**Architecture**:
```javascript
async function createUser(userData) {
  // Write to both databases
  const [mysqlResult, postgresResult] = await Promise.allSettled([
    oldDb.query('INSERT INTO users ...', userData),    // MySQL
    newDb.user.create({ data: userData })               // PostgreSQL
  ]);

  // Log discrepancies
  if (mysqlResult.status !== postgresResult.status) {
    logger.warn('Dual-write mismatch', { mysqlResult, postgresResult });
  }

  // Return MySQL result (primary) during migration
  return mysqlResult.value;
}
```

**Tasks**:
- [ ] Create dual-write wrapper functions
- [ ] Add feature flag to enable/disable dual-write
- [ ] Implement conflict resolution strategy
- [ ] Add monitoring and alerting for write failures
- [ ] Log all discrepancies for analysis
- [ ] Test rollback scenarios

**Success Criteria**:
- All writes go to both databases
- Discrepancies logged and monitored
- Feature flag allows instant rollback

#### 4.2 Data Validation & Reconciliation

**Objective**: Ensure MySQL and PostgreSQL data remain in sync

**Tasks**:
- [ ] Create data comparison script
- [ ] Schedule periodic reconciliation jobs
- [ ] Monitor data drift
- [ ] Automatically sync missing records (based on policy)
- [ ] Alert on critical mismatches

**Validation Script** (pseudocode):
```javascript
// apps/admin-api/scripts/validate-dual-write.js
async function validateTable(tableName) {
  const mysqlCount = await mysql.query('SELECT COUNT(*) FROM ' + tableName);
  const pgCount = await prisma[tableName].count();

  if (mysqlCount !== pgCount) {
    // Find missing records
    // Log discrepancy
    // Trigger alert
  }
}
```

**Success Criteria**:
- Data consistency >99.9%
- All discrepancies investigated
- Reconciliation process documented

#### 4.3 Read Traffic Gradual Migration

**Objective**: Gradually shift read traffic from MySQL to PostgreSQL

**Strategy**:
```javascript
// Feature flag-based routing
async function getUser(userId) {
  const readFromPostgres = featureFlags.get('use_postgres_reads');

  if (readFromPostgres) {
    return await newDb.user.findUnique({ where: { id: userId } });
  } else {
    return await oldDb.query('SELECT * FROM users WHERE id = ?', [userId]);
  }
}
```

**Tasks**:
- [ ] Implement feature flag system
- [ ] Add database routing logic
- [ ] Start with 1% of read traffic to PostgreSQL
- [ ] Monitor error rates and performance
- [ ] Gradually increase to 10%, 25%, 50%, 75%, 100%
- [ ] Rollback capability at each stage

**Monitoring Metrics**:
- Query latency (p50, p95, p99)
- Error rates
- Database CPU/memory usage
- Connection pool utilization

**Success Criteria**:
- 100% read traffic on PostgreSQL
- Error rate unchanged
- Performance acceptable

#### 4.4 Write Traffic Cutover

**Objective**: Switch primary writes from MySQL to PostgreSQL

**Tasks**:
- [ ] Verify data sync is 100% accurate
- [ ] Schedule maintenance window (or go zero-downtime)
- [ ] Update dual-write logic to make PostgreSQL primary
- [ ] Monitor for errors
- [ ] Keep MySQL as backup (write but not read)
- [ ] After soak period, disable MySQL writes

**Success Criteria**:
- All writes to PostgreSQL successful
- MySQL no longer receiving writes
- Rollback plan tested

### Phase 5: Cutover & Cleanup ⏱️ **1-2 weeks**

#### 5.1 Final Data Sync

**Objective**: Ensure PostgreSQL has all data before cutting over

**Tasks**:
- [ ] Put application in read-only mode (optional)
- [ ] Run final data sync from MySQL to PostgreSQL
- [ ] Validate row counts for all tables
- [ ] Verify foreign key integrity
- [ ] Take final MySQL backup
- [ ] Document final data state

**Success Criteria**:
- PostgreSQL 100% synchronized with MySQL
- All validation checks pass
- Backup secured

#### 5.2 Application Cutover

**Objective**: Switch admin-api to use PostgreSQL exclusively

**Tasks**:
- [ ] Update `apps/admin-api/server.js:8` to load `src/lib/database.js`
- [ ] Remove import of old `lib/database.js`
- [ ] Update all environment files to use `DATABASE_URL` (PostgreSQL)
- [ ] Remove `DB_URL` (MySQL) from all configs
- [ ] Update Docker Compose to use `slimy-nuc2` pattern
- [ ] Deploy to staging first
- [ ] Run full test suite
- [ ] Deploy to production
- [ ] Monitor for 24-48 hours

**Files to Update**:
- `apps/admin-api/server.js`
- `apps/admin-api/.env.admin.production` (remove DB_URL)
- `infra/docker/docker-compose.slimy-nuc1.yml` (deprecate)

**Success Criteria**:
- Application runs successfully on PostgreSQL
- All API endpoints functional
- No errors in logs
- Performance metrics acceptable

#### 5.3 Infrastructure Cleanup

**Objective**: Remove MySQL infrastructure and dependencies

**Tasks**:
- [ ] Keep MySQL running in read-only mode for 1-2 weeks (safety period)
- [ ] Monitor for any unexpected MySQL connections
- [ ] After soak period, stop MySQL container
- [ ] Remove MySQL from `docker-compose.slimy-nuc1.yml`
- [ ] Archive MySQL data backups
- [ ] Remove `mysql2` dependency from `apps/admin-api/package.json`
- [ ] Delete old `apps/admin-api/lib/database.js`
- [ ] Remove MySQL-specific scripts/utilities
- [ ] Update documentation to remove MySQL references

**Files to Delete/Update**:
- `apps/admin-api/lib/database.js` (delete after archival)
- `apps/admin-api/package.json` (remove mysql2)
- `apps/admin-api/src/util/mysql-dump.js` (delete or archive)
- `infra/docker/docker-compose.slimy-nuc1.yml` (delete or deprecate)

**Success Criteria**:
- No MySQL containers running
- No MySQL dependencies in package.json
- All documentation updated
- Backups archived securely

#### 5.4 Documentation Updates

**Objective**: Update all documentation to reflect PostgreSQL-only architecture

**Tasks**:
- [ ] Update README files in all apps
- [ ] Update deployment guides
- [ ] Update environment variable documentation
- [ ] Update developer onboarding docs
- [ ] Create "Migration Complete" announcement
- [ ] Archive this migration roadmap

**Success Criteria**:
- All docs reference PostgreSQL only
- Setup instructions validated
- Onboarding process updated

---

## 4. Risk Assessment & Mitigation

### 4.1 High-Risk Areas

#### Risk 1: Data Loss During Migration
**Severity**: 🔴 Critical
**Likelihood**: Medium
**Impact**: Complete loss of production data

**Mitigation**:
- [ ] Multiple backup layers (before, during, after migration)
- [ ] Dry run migrations in staging environment
- [ ] Data validation at every step
- [ ] Row count and checksum verification
- [ ] Keep MySQL running in read-only mode for safety period
- [ ] Automated backup verification scripts

**Rollback Plan**:
1. Stop PostgreSQL writes immediately
2. Restore from MySQL (still running)
3. Redirect application to MySQL
4. Investigate data loss cause
5. Fix and retry migration

#### Risk 2: Schema Mismatches
**Severity**: 🟡 High
**Likelihood**: Medium
**Impact**: Application errors, data corruption

**Mitigation**:
- [ ] Comprehensive schema comparison before migration
- [ ] Prisma schema validation against production MySQL
- [ ] Foreign key relationship verification
- [ ] Index verification (performance impact if missing)
- [ ] Constraint validation

**Rollback Plan**:
1. Generate new Prisma migration to fix schema
2. Apply migration to PostgreSQL
3. Re-validate
4. If unfixable, rollback to MySQL

#### Risk 3: SQL Syntax Incompatibilities
**Severity**: 🟡 High
**Likelihood**: High (if raw SQL queries exist)
**Impact**: Runtime errors, incorrect results

**MySQL vs PostgreSQL Differences**:
| Feature | MySQL | PostgreSQL |
|---------|-------|------------|
| Backticks | \`column\` | "column" or unquoted |
| LIMIT | `LIMIT 10 OFFSET 20` | `LIMIT 10 OFFSET 20` (same) |
| Auto-increment | AUTO_INCREMENT | SERIAL / IDENTITY |
| Date functions | NOW() | CURRENT_TIMESTAMP or NOW() |
| Concat | CONCAT(a, b) | a \|\| b |
| Case sensitivity | Insensitive by default | Sensitive |
| Boolean | TINYINT(1) | BOOLEAN |
| JSON | JSON | JSONB (better) |

**Mitigation**:
- [ ] Use Prisma exclusively (avoids raw SQL)
- [ ] Audit all raw SQL queries
- [ ] Create PostgreSQL equivalents
- [ ] Comprehensive testing of all queries
- [ ] Database abstraction layer for any remaining raw SQL

**Rollback Plan**:
1. Identify failing query
2. Fix PostgreSQL syntax
3. Deploy hotfix
4. If widespread, rollback to MySQL

#### Risk 4: Performance Degradation
**Severity**: 🟡 High
**Likelihood**: Low
**Impact**: Slow API responses, timeouts

**Mitigation**:
- [ ] Benchmark critical queries in staging
- [ ] Index optimization (PostgreSQL may need different indexes)
- [ ] Connection pool tuning
- [ ] Query plan analysis (EXPLAIN)
- [ ] Load testing before production deployment
- [ ] Monitor query performance in production

**Rollback Plan**:
1. Scale PostgreSQL resources (CPU, memory)
2. Optimize slow queries (indexes, query rewrite)
3. If severe, rollback to MySQL
4. Analyze and fix performance issues
5. Retry migration

#### Risk 5: Downtime During Cutover
**Severity**: 🟡 High
**Likelihood**: Medium (if not using dual-write)
**Impact**: Service unavailable

**Mitigation**:
- [ ] Implement dual-write pattern (zero-downtime)
- [ ] Schedule maintenance window if needed
- [ ] Blue-green deployment strategy
- [ ] Automated rollback capability
- [ ] Status page notifications

**Rollback Plan**:
1. Switch application back to MySQL immediately
2. Investigate cutover failure
3. Fix issues
4. Retry cutover

#### Risk 6: Third-Party Service Compatibility
**Severity**: 🟠 Medium
**Likelihood**: Low
**Impact**: External integrations break

**Mitigation**:
- [ ] Audit all third-party integrations
- [ ] Test integrations in staging
- [ ] Verify API contracts unchanged
- [ ] Monitor external service calls

**Rollback Plan**:
1. Identify incompatible integration
2. Fix or disable integration
3. If critical, rollback to MySQL

### 4.2 Rollback Strategy

#### Immediate Rollback (< 5 minutes)
**Trigger**: Critical production errors, data loss detected

**Steps**:
1. Execute rollback command (feature flag or deployment)
2. Point application to MySQL database
3. Verify MySQL is operational
4. Monitor error rates
5. Investigate PostgreSQL issue
6. Post-mortem analysis

**Preconditions**:
- MySQL still running and synchronized
- Feature flags configured for instant rollback
- Deployment rollback tested

#### Delayed Rollback (< 1 hour)
**Trigger**: Performance issues, minor data inconsistencies

**Steps**:
1. Assess severity and impact
2. Attempt fix on PostgreSQL first
3. If unfixable quickly, initiate rollback
4. Sync any new data from PostgreSQL to MySQL
5. Point application to MySQL
6. Schedule fix and retry

#### Point-of-No-Return
**When**: After MySQL is decommissioned and data deleted

**Before reaching this point**:
- [ ] Run PostgreSQL in production for 2+ weeks
- [ ] Zero critical errors
- [ ] Performance validated
- [ ] All stakeholders approve
- [ ] Final MySQL backup secured

---

## 5. Testing Strategy

### 5.1 Pre-Migration Testing

**Schema Validation**:
- [ ] Prisma schema matches production MySQL
- [ ] All indexes present
- [ ] All constraints validated
- [ ] Foreign keys mapped correctly

**Data Migration Testing**:
- [ ] Test migration on staging environment
- [ ] Validate data integrity (row counts, checksums)
- [ ] Test edge cases (NULL values, unicode, large text)
- [ ] Measure migration time

**Application Testing**:
- [ ] Unit tests pass against PostgreSQL
- [ ] Integration tests pass
- [ ] End-to-end tests pass
- [ ] Performance benchmarks meet baseline

### 5.2 During Migration Testing

**Dual-Write Validation**:
- [ ] Monitor write success rates to both databases
- [ ] Validate data consistency
- [ ] Alert on discrepancies
- [ ] Test rollback mechanism

**Read Traffic Testing**:
- [ ] Canary rollout (1% → 10% → 50% → 100%)
- [ ] Monitor error rates at each stage
- [ ] Performance comparison MySQL vs PostgreSQL
- [ ] Rollback testing at each stage

### 5.3 Post-Migration Testing

**Smoke Tests**:
- [ ] All API endpoints respond
- [ ] Authentication/authorization works
- [ ] Database reads/writes successful
- [ ] No errors in application logs

**Regression Testing**:
- [ ] Full test suite execution
- [ ] Manual testing of critical flows
- [ ] User acceptance testing
- [ ] Load testing

**Monitoring Validation**:
- [ ] Database metrics reporting correctly
- [ ] Application metrics normal
- [ ] Error tracking functional
- [ ] Alerts configured

---

## 6. Monitoring & Success Criteria

### 6.1 Key Metrics to Monitor

**Database Metrics**:
- Connection pool utilization
- Query latency (p50, p95, p99)
- Slow query count (> 1 second)
- Database CPU and memory usage
- Disk I/O
- Active connections
- Replication lag (if applicable)

**Application Metrics**:
- API response times
- Error rates (4xx, 5xx)
- Request throughput
- Failed database operations

**Business Metrics**:
- User-facing error rates
- Critical transaction success rates
- Data consistency checks

### 6.2 Success Criteria

**Phase 1 (Preparation)**:
- ✅ All MySQL code identified
- ✅ Prisma schema validated
- ✅ Dependencies installed correctly

**Phase 2 (Migration)**:
- ✅ All data transferred to PostgreSQL
- ✅ Zero data loss
- ✅ Data validation passing

**Phase 3 (Code Migration)**:
- ✅ All raw SQL converted to Prisma
- ✅ Test suite passing
- ✅ No performance regressions

**Phase 4 (Dual-Write)**:
- ✅ 100% write success rate to both databases
- ✅ Data consistency >99.9%
- ✅ Read traffic fully migrated to PostgreSQL

**Phase 5 (Cutover)**:
- ✅ Application running on PostgreSQL only
- ✅ MySQL decommissioned
- ✅ Documentation updated

**Final Success Criteria**:
- ✅ Zero MySQL dependencies
- ✅ No production errors related to migration
- ✅ Performance equal or better than baseline
- ✅ Team trained on PostgreSQL operations
- ✅ 30 days of stable operation

---

## 7. Timeline & Resource Allocation

### 7.1 Estimated Timeline

| Phase | Duration | Parallel Work Possible |
|-------|----------|------------------------|
| Phase 1: Preparation | 1-2 weeks | Yes (code audit + schema reconciliation) |
| Phase 2: Data Migration | 2-3 weeks | Partially (testing while developing scripts) |
| Phase 3: Code Migration | 3-4 weeks | Yes (route conversion can be parallel) |
| Phase 4: Dual-Write (optional) | 2-3 weeks | No (sequential rollout) |
| Phase 5: Cutover & Cleanup | 1-2 weeks | Partially (cleanup while monitoring) |

**Total: 9-14 weeks (without dual-write) or 11-17 weeks (with dual-write)**

**Recommended**: Budget 12-16 weeks with dual-write for safety.

### 7.2 Resource Requirements

**Personnel**:
- Backend developer (lead): 100% allocated
- Backend developer (support): 50% allocated
- DevOps engineer: 25% allocated
- QA engineer: 50% allocated during testing phases
- Product owner: 10% allocated for approvals

**Infrastructure**:
- Staging environment with both MySQL and PostgreSQL
- Increased monitoring during migration
- Additional PostgreSQL capacity for production
- Backup storage for MySQL archives

**Tools**:
- Prisma (already in use)
- pgLoader (for bulk transfer)
- Monitoring tools (Prometheus, Grafana, or similar)
- Feature flag system (for gradual rollout)

---

## 8. Communication Plan

### 8.1 Stakeholder Updates

**Weekly Updates**:
- Progress against timeline
- Blockers and risks
- Upcoming milestones
- Resource needs

**Pre-Cutover Communication**:
- 2 weeks before: Announce cutover date
- 1 week before: Reminder and final timeline
- 24 hours before: Final confirmation or postponement
- During cutover: Status updates every 30 minutes
- Post-cutover: Success announcement and monitoring summary

### 8.2 Documentation Updates

**Living Documents**:
- This migration roadmap (update weekly)
- Known issues log
- Migration runbook (step-by-step operational guide)

**Final Documentation**:
- Migration post-mortem
- Lessons learned
- Updated architecture diagrams
- PostgreSQL operations guide

---

## 9. Post-Migration Optimization

### 9.1 Database Tuning

**After migration is stable**:
- [ ] Analyze query patterns
- [ ] Optimize indexes (remove unused, add missing)
- [ ] Tune PostgreSQL configuration (shared_buffers, work_mem, etc.)
- [ ] Implement query caching where appropriate
- [ ] Set up automated VACUUM and ANALYZE

### 9.2 Schema Consolidation

**Future Consideration**:
- Evaluate merging overlapping models between `web` and `admin-api`
- Consider shared Prisma schema for common entities
- Implement multi-schema or multi-database pattern if needed

### 9.3 Advanced PostgreSQL Features

**Leverage PostgreSQL capabilities**:
- [ ] JSONB indexing for JSON columns
- [ ] Full-text search (if applicable)
- [ ] Materialized views for complex queries
- [ ] Partitioning for large tables
- [ ] Advanced replication for high availability

---

## 10. Appendix

### 10.1 Reference Files

**Current Infrastructure**:
- `infra/docker/docker-compose.slimy-nuc1.yml` (MySQL-based)
- `infra/docker/docker-compose.slimy-nuc2.yml` (PostgreSQL-based)

**Database Layers**:
- `apps/admin-api/lib/database.js` (MySQL, current)
- `apps/admin-api/src/lib/database.js` (Prisma/PostgreSQL, prepared)
- `apps/web/lib/db.ts` (Prisma/PostgreSQL, active)

**Prisma Schemas**:
- `apps/admin-api/prisma/schema.prisma`
- `apps/web/prisma/schema.prisma`

**Configuration**:
- `apps/admin-api/src/lib/config/index.js` (validates DATABASE_URL)
- `apps/admin-api/.env.example` (PostgreSQL)
- `apps/admin-api/.env.admin.example` (MySQL legacy)

### 10.2 Useful Commands

**Prisma**:
```bash
# Generate Prisma client
pnpm prisma generate

# Create migration
pnpm prisma migrate dev --name migration_name

# Deploy migrations (production)
pnpm prisma migrate deploy

# Open Prisma Studio
pnpm prisma studio

# Reset database (dev only)
pnpm prisma migrate reset
```

**PostgreSQL**:
```bash
# Connect to PostgreSQL
psql -U slimyai -d slimyai

# Dump database
pg_dump -U slimyai slimyai > backup.sql

# Restore database
psql -U slimyai slimyai < backup.sql

# Check database size
SELECT pg_size_pretty(pg_database_size('slimyai'));

# List tables
\dt

# Describe table
\d table_name
```

**MySQL**:
```bash
# Connect to MySQL
mysql -u user -p slimy

# Dump database
mysqldump -u user -p slimy > backup.sql

# Restore database
mysql -u user -p slimy < backup.sql

# Show tables
SHOW TABLES;

# Describe table
DESCRIBE table_name;
```

**pgLoader**:
```bash
# Basic migration
pgloader mysql://user:pass@localhost/slimy postgresql://user:pass@localhost/slimyai

# With configuration file
pgloader pgloader-config.load
```

### 10.3 Support Resources

**Documentation**:
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [pgLoader Documentation](https://pgloader.readthedocs.io/)

**Migration Guides**:
- [Prisma: Migrating from MySQL to PostgreSQL](https://www.prisma.io/docs/guides/migrate-to-prisma/migrate-from-mysql-to-postgresql)
- [pgLoader: MySQL to PostgreSQL](https://pgloader.readthedocs.io/en/latest/ref/mysql.html)

**Community**:
- Prisma Discord
- PostgreSQL Slack
- Stack Overflow

---

## Document History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2025-11-19 | 1.0 | Claude | Initial roadmap creation |

---

**Next Steps**: Review this roadmap with the team, adjust timeline and approach based on business constraints, and begin Phase 1 preparation.
