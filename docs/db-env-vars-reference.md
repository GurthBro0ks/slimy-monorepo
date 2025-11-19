# Database Environment Variables Reference

**Last Updated**: 2025-11-19
**Purpose**: Comprehensive reference for all database-related environment variables across the Slimy monorepo

---

## Overview

This document catalogs all database-related environment variables used across the monorepo, organized by service. This reference is essential for:
- Environment setup and configuration
- Migration from MySQL to PostgreSQL
- Troubleshooting database connection issues
- DevOps and deployment automation

---

## Quick Reference Table

| Variable | Type | Service(s) | Status | Purpose |
|----------|------|------------|--------|---------|
| `DATABASE_URL` | PostgreSQL | admin-api, web | ✅ Current | Primary PostgreSQL connection string |
| `DB_URL` | MySQL | admin-api | ⚠️ Legacy | MySQL connection string (being phased out) |
| `REDIS_URL` | Redis | admin-api, web | ✅ Current | Redis connection URL |
| `REDIS_HOST` | Redis | web | ✅ Current | Redis host (alternative to URL) |
| `REDIS_PORT` | Redis | web | ✅ Current | Redis port (alternative to URL) |
| `REDIS_PASSWORD` | Redis | web | ✅ Current | Redis password (alternative to URL) |

**Legend**:
- ✅ **Current**: Actively used and should be configured
- ⚠️ **Legacy**: Deprecated, will be removed after MySQL migration
- ❌ **Deprecated**: No longer used, can be removed

---

## 1. apps/admin-api

### 1.1 PostgreSQL (Current/Target)

#### `DATABASE_URL`

**Status**: ✅ Current
**Type**: PostgreSQL connection string
**Required**: Yes (for PostgreSQL setup)
**Format**: `postgresql://[user]:[password]@[host]:[port]/[database]?schema=public`

**Example**:
```bash
DATABASE_URL=postgresql://slimyai:your_password_here@postgres:5432/slimyai?schema=public
```

**Configuration Files**:
- `.env.example` (line 22)
- `.env` (local development)
- `.env.production` (production - not in repo)

**Validation**:
- **File**: `apps/admin-api/src/lib/config/index.js` (lines 66-71)
- **Logic**:
  - Must be a valid PostgreSQL URL
  - Must start with `postgresql://`
  - Must contain username, host, and database name
  - Port defaults to 5432 if not specified

**Used By**:
- `apps/admin-api/src/lib/database.js` (Prisma client)
- `apps/admin-api/prisma/schema.prisma` (line 10)

**Docker Compose**:
- `infra/docker/docker-compose.slimy-nuc2.yml`
- Loaded from: `/opt/slimy/app/admin-api/.env.production`

**Related Commands**:
```bash
# Generate Prisma client
DATABASE_URL="..." pnpm prisma generate

# Run migrations
DATABASE_URL="..." pnpm prisma migrate deploy

# Open Prisma Studio
DATABASE_URL="..." pnpm prisma studio
```

**Troubleshooting**:
- ❌ **Error**: "Invalid `DATABASE_URL` environment variable"
  - **Cause**: Missing or malformed connection string
  - **Fix**: Ensure format matches `postgresql://user:pass@host:port/db`
- ❌ **Error**: "Can't reach database server"
  - **Cause**: PostgreSQL not running or network issue
  - **Fix**: Check `docker ps` for postgres container, verify network connectivity
- ❌ **Error**: "Authentication failed"
  - **Cause**: Incorrect username or password
  - **Fix**: Verify credentials match PostgreSQL user setup

---

### 1.2 MySQL (Legacy - Being Phased Out)

#### `DB_URL`

**Status**: ⚠️ Legacy (to be removed)
**Type**: MySQL connection string
**Required**: No (only if still using MySQL)
**Format**: `mysql://[user]:[password]@[host]:[port]/[database]`

**Example**:
```bash
DB_URL=mysql://slimy:your_password@127.0.0.1:3306/slimy
```

**Configuration Files**:
- `.env.admin.example`
- `.env.admin.production.example`
- `.env.admin.production` (production - not in repo)

**Validation**:
- **File**: None (direct usage in old database.js)
- **Logic**: Parsed by mysql2 library automatically

**Used By**:
- `apps/admin-api/lib/database.js` (line 18) - **Legacy file**
- Currently loaded by `apps/admin-api/server.js:8` ⚠️

**Docker Compose**:
- `infra/docker/docker-compose.slimy-nuc1.yml`
- Custom entrypoint script parses `DB_URL` into:
  - `MYSQL_USER`
  - `MYSQL_PASSWORD`
  - `MYSQL_DATABASE`
  - `MYSQL_HOST`
  - `MYSQL_PORT`

**Migration Note**:
- This variable will be **removed** once MySQL migration is complete
- All services should transition to `DATABASE_URL` (PostgreSQL)
- See: `docs/db-migration-roadmap.md` for migration plan

**Troubleshooting**:
- ❌ **Error**: "ER_ACCESS_DENIED_ERROR"
  - **Cause**: Incorrect MySQL credentials
  - **Fix**: Verify username/password in `DB_URL`
- ❌ **Error**: "ECONNREFUSED"
  - **Cause**: MySQL server not running
  - **Fix**: Check `docker ps` for slimy-mysql container
- ❌ **Error**: "Unknown database"
  - **Cause**: Database name in URL doesn't exist
  - **Fix**: Verify database name, or create database

---

### 1.3 Redis (Caching & Queues)

#### `REDIS_URL`

**Status**: ✅ Current
**Type**: Redis connection URL
**Required**: No (optional, improves performance)
**Format**: `redis://[[username]:[password]@][host]:[port][/database]`

**Example**:
```bash
REDIS_URL=redis://localhost:6379
# With authentication:
REDIS_URL=redis://:password@localhost:6379
# With database selection:
REDIS_URL=redis://localhost:6379/0
```

**Configuration Files**:
- `.env.example` (commented out - optional)
- `.env` (local development, if using Redis)
- `.env.production` (production - not in repo)

**Validation**:
- **File**: `apps/admin-api/src/lib/config/index.js` (lines 179-194)
- **Logic**:
  - Optional (application works without Redis)
  - If provided, must be valid Redis URL
  - Defaults to undefined if not set

**Used By**:
- `apps/admin-api/src/lib/redis.js` (if exists)
- Caching layer for database queries
- Queue processing (job queues)
- Session storage (optional)

**Docker Compose**:
- Not included in default docker-compose files
- Typically run as separate service or cloud service (e.g., Redis Cloud, AWS ElastiCache)

**Features Using Redis** (if available):
- API response caching
- Rate limiting
- Job queues (background tasks)
- Session storage
- DDoS protection

**Performance Impact**:
- **Without Redis**: Application works, but slower for repeated queries
- **With Redis**: Significant performance improvement for cached data

**Troubleshooting**:
- ❌ **Error**: "Redis connection failed"
  - **Cause**: Redis server not running or unreachable
  - **Fix**: Start Redis server or remove `REDIS_URL` (app will work without it)
- ❌ **Error**: "WRONGPASS invalid username-password pair"
  - **Cause**: Incorrect Redis password
  - **Fix**: Update password in `REDIS_URL`

---

### 1.4 MySQL-Specific Variables (Docker Only)

These variables are **auto-generated** by the custom entrypoint script in `docker-compose.slimy-nuc1.yml` and should **not** be set manually.

#### `MYSQL_USER`

**Status**: ⚠️ Legacy (auto-generated from `DB_URL`)
**Type**: String
**Required**: No (generated automatically)
**Source**: Extracted from `DB_URL` by entrypoint script

#### `MYSQL_PASSWORD`

**Status**: ⚠️ Legacy (auto-generated from `DB_URL`)
**Type**: String
**Required**: No (generated automatically)
**Source**: Extracted from `DB_URL` by entrypoint script

#### `MYSQL_DATABASE`

**Status**: ⚠️ Legacy (auto-generated from `DB_URL`)
**Type**: String
**Required**: No (generated automatically)
**Source**: Extracted from `DB_URL` by entrypoint script

**Note**: These variables are only relevant in the MySQL Docker container and should not be set in application `.env` files.

---

## 2. apps/web

### 2.1 PostgreSQL (Current)

#### `DATABASE_URL`

**Status**: ✅ Current
**Type**: PostgreSQL connection string
**Required**: Yes
**Format**: `postgresql://[user]:[password]@[host]:[port]/[database]?schema=public`

**Example**:
```bash
DATABASE_URL=postgresql://slimyai:your_password_here@localhost:5432/slimyai?schema=public
```

**Configuration Files**:
- `.env.example` (if exists)
- `.env.local` (local development)
- `.env.production` (production - not in repo)

**Validation**:
- **File**: `apps/web/lib/env.ts` (if exists, or validated by Prisma)
- **Logic**: Must be valid PostgreSQL connection string

**Used By**:
- `apps/web/lib/db.ts` (Prisma client singleton)
- `apps/web/prisma/schema.prisma` (line 10)

**Prisma Configuration**:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Docker Compose**:
- `infra/docker/docker-compose.slimy-nuc2.yml`
- Web service depends on `slimy-db` (PostgreSQL) container

**Models** (apps/web specific):
- ClubAnalysis, ClubAnalysisImage, ClubMetric
- UserPreferences
- ChatConversation, ChatMessage
- GuildFeatureFlags
- CodeReport
- AuditLog
- UserSession

**Troubleshooting**:
- ❌ **Error**: "P1001: Can't reach database server"
  - **Cause**: PostgreSQL not running or network issue
  - **Fix**: Verify PostgreSQL is running, check connection string host/port
- ❌ **Error**: "P1002: The database server was reached but timed out"
  - **Cause**: PostgreSQL overloaded or network latency
  - **Fix**: Check PostgreSQL resource usage, optimize queries
- ❌ **Error**: "P1003: Database does not exist"
  - **Cause**: Database specified in URL doesn't exist
  - **Fix**: Create database or update URL to correct database name

---

### 2.2 Redis (Caching & DDoS Protection)

#### `REDIS_URL`

**Status**: ✅ Current
**Type**: Redis connection URL
**Required**: No (optional)
**Format**: `redis://[[username]:[password]@][host]:[port][/database]`

**Example**:
```bash
REDIS_URL=redis://localhost:6379
```

**Configuration Files**:
- `apps/web/.env.example` (if exists)
- `apps/web/.env.local` (local development)
- `apps/web/.env.production` (production)

**Validation**:
- **File**: `apps/web/lib/env.ts` (lines 35-38)
- **Logic**: Optional, validated by Redis client if provided

**Used By**:
- Code caching (`apps/web/lib/code-cache.ts` or similar)
- DDoS protection middleware
- Session management
- API response caching

**Alternative Configuration**: Instead of `REDIS_URL`, you can use individual variables:

#### `REDIS_HOST`

**Status**: ✅ Current (alternative to `REDIS_URL`)
**Type**: String (hostname or IP)
**Required**: No
**Default**: `localhost`

**Example**:
```bash
REDIS_HOST=localhost
```

#### `REDIS_PORT`

**Status**: ✅ Current (alternative to `REDIS_URL`)
**Type**: Number
**Required**: No
**Default**: `6379`

**Example**:
```bash
REDIS_PORT=6379
```

#### `REDIS_PASSWORD`

**Status**: ✅ Current (alternative to `REDIS_URL`)
**Type**: String
**Required**: No (only if Redis has auth enabled)
**Default**: `undefined`

**Example**:
```bash
REDIS_PASSWORD=your_redis_password
```

**Configuration Priority**:
1. If `REDIS_URL` is set, it takes precedence
2. Otherwise, `REDIS_HOST`, `REDIS_PORT`, and `REDIS_PASSWORD` are used
3. If neither set, Redis features are disabled (app still works)

**Validation**:
- **File**: `apps/web/lib/env.ts` (lines 35-38)
- **Logic**: All are optional strings

**Features Using Redis**:
- Code snippet caching (significant performance improvement)
- Rate limiting for API endpoints
- DDoS protection (request throttling)
- User session caching

**Troubleshooting**:
- ❌ **Error**: "Redis connection timeout"
  - **Cause**: Redis not reachable
  - **Fix**: Check Redis is running, verify host/port, check firewall
- ⚠️ **Warning**: "Redis not configured, caching disabled"
  - **Cause**: No Redis variables set
  - **Impact**: App works but without caching (slower)
  - **Fix**: Set `REDIS_URL` or `REDIS_HOST/PORT` to enable caching

---

## 3. apps/admin-ui

**Database Access**: None (frontend application)

The admin-ui application is a frontend-only service that does not directly access any databases. All data is fetched through REST API calls to `apps/admin-api`.

**Environment Variables**: No database-related environment variables needed.

---

## 4. apps/bot

**Status**: Empty placeholder (no implementation yet)

**Database Access**: None currently

**Future Consideration**: If this service is implemented, it will likely need:
- `DATABASE_URL` (PostgreSQL) to access shared database
- `REDIS_URL` (optional) for caching

---

## 5. Docker Compose Configurations

### 5.1 slimy-nuc1 (MySQL-based - Legacy)

**File**: `infra/docker/docker-compose.slimy-nuc1.yml`

**MySQL Container Configuration**:
```yaml
slimy-mysql:
  image: mysql:8
  container_name: slimy-mysql
  environment:
    MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
    MYSQL_USER: ${MYSQL_USER}        # Extracted from DB_URL
    MYSQL_PASSWORD: ${MYSQL_PASSWORD} # Extracted from DB_URL
    MYSQL_DATABASE: ${MYSQL_DATABASE} # Extracted from DB_URL
  ports:
    - "3306:3306"
  volumes:
    - slimy-db-data:/var/lib/mysql
```

**Custom Entrypoint**:
The MySQL container uses a custom entrypoint script that parses `DB_URL` and extracts individual MySQL environment variables.

**Environment Files**:
- `admin-api`: `/opt/slimy/app/admin-api/.env.admin.production`
- `admin-ui`: `/opt/slimy/app/admin-ui/.env`
- `web`: `/opt/slimy/app/web/.env`

**Migration Status**: ⚠️ This configuration is being **phased out** in favor of PostgreSQL.

---

### 5.2 slimy-nuc2 (PostgreSQL-based - Current)

**File**: `infra/docker/docker-compose.slimy-nuc2.yml`

**PostgreSQL Container Configuration**:
```yaml
slimy-db:
  image: postgres:16-alpine
  container_name: slimy-db
  environment:
    POSTGRES_USER: ${POSTGRES_USER:-slimyai}
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-changeme}
    POSTGRES_DB: ${POSTGRES_DB:-slimyai}
  ports:
    - "5432:5432"
  volumes:
    - postgres_data:/var/lib/postgresql/data
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-slimyai}"]
    interval: 10s
    timeout: 5s
    retries: 5
```

**Environment Variables** (used by PostgreSQL container):

#### `POSTGRES_USER`
- **Default**: `slimyai`
- **Purpose**: PostgreSQL superuser name

#### `POSTGRES_PASSWORD`
- **Default**: `changeme` (⚠️ change in production!)
- **Purpose**: PostgreSQL superuser password

#### `POSTGRES_DB`
- **Default**: `slimyai`
- **Purpose**: Default database to create

**Environment Files**:
- `admin-api`: `/opt/slimy/app/admin-api/.env.production`
- `web`: `/opt/slimy/app/web/.env.production`

**Constructed `DATABASE_URL`** (in application .env files):
```bash
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@slimy-db:5432/${POSTGRES_DB}?schema=public
```

**Migration Status**: ✅ This is the **current and target** configuration.

---

## 6. Environment Variable Best Practices

### 6.1 Security

1. **Never commit `.env` files** containing real credentials
   - Use `.env.example` with placeholder values
   - Add `.env`, `.env.local`, `.env.production` to `.gitignore`

2. **Use strong passwords** for database users
   - Minimum 16 characters
   - Mix of letters, numbers, symbols
   - Unique per environment

3. **Rotate credentials regularly**
   - Production database passwords: every 90 days
   - Redis passwords: every 90 days
   - Update all services simultaneously

4. **Use secrets management** in production
   - Docker secrets
   - Kubernetes secrets
   - Cloud provider secret managers (AWS Secrets Manager, etc.)

### 6.2 Development vs Production

**Development** (local):
```bash
# PostgreSQL (local Docker or managed service)
DATABASE_URL=postgresql://dev_user:dev_pass@localhost:5432/slimy_dev

# Redis (local Docker)
REDIS_URL=redis://localhost:6379
```

**Staging**:
```bash
# PostgreSQL (staging server)
DATABASE_URL=postgresql://staging_user:staging_pass@staging-db.internal:5432/slimy_staging

# Redis (staging server)
REDIS_URL=redis://staging-redis.internal:6379
```

**Production**:
```bash
# PostgreSQL (production server)
DATABASE_URL=postgresql://prod_user:STRONG_PASSWORD@prod-db.internal:5432/slimy

# Redis (production server with auth)
REDIS_URL=redis://:STRONG_PASSWORD@prod-redis.internal:6379
```

### 6.3 Connection String Format Reference

#### PostgreSQL

**Full Format**:
```
postgresql://[user]:[password]@[host]:[port]/[database]?[query_parameters]
```

**Components**:
- `user`: Database username
- `password`: Database password (URL-encode special characters)
- `host`: Hostname or IP address (use `localhost` for local, `slimy-db` in Docker)
- `port`: Port number (default: 5432)
- `database`: Database name
- `query_parameters`: Optional parameters
  - `schema=public` (recommended for Prisma)
  - `sslmode=require` (for SSL connections)
  - `connect_timeout=10` (connection timeout in seconds)

**Examples**:
```bash
# Basic local connection
postgresql://user:pass@localhost:5432/mydb

# Docker internal network
postgresql://user:pass@postgres-container:5432/mydb

# With schema specification (recommended)
postgresql://user:pass@localhost:5432/mydb?schema=public

# With SSL
postgresql://user:pass@prod-db.com:5432/mydb?sslmode=require

# URL-encoded special characters in password
# Password: my@p@ss! → my%40p%40ss%21
postgresql://user:my%40p%40ss%21@localhost:5432/mydb
```

#### MySQL (Legacy)

**Full Format**:
```
mysql://[user]:[password]@[host]:[port]/[database]?[query_parameters]
```

**Components**: Similar to PostgreSQL

**Examples**:
```bash
# Basic connection
mysql://root:password@localhost:3306/mydb

# Docker connection
mysql://user:pass@mysql-container:3306/mydb

# With timezone
mysql://user:pass@localhost:3306/mydb?timezone=UTC
```

#### Redis

**Full Format**:
```
redis://[[username]:[password]@][host]:[port][/database]
```

**Components**:
- `username`: Optional (Redis 6+ ACL)
- `password`: Optional (if auth enabled)
- `host`: Hostname or IP
- `port`: Port number (default: 6379)
- `database`: Database number (0-15, default: 0)

**Examples**:
```bash
# Basic connection (no auth)
redis://localhost:6379

# With password only (Redis <6)
redis://:mypassword@localhost:6379

# With username and password (Redis 6+)
redis://myuser:mypassword@localhost:6379

# With database selection
redis://localhost:6379/1

# Full example
redis://:mypassword@prod-redis.internal:6379/0
```

### 6.4 URL Encoding Special Characters

If your password contains special characters, URL-encode them:

| Character | Encoded |
|-----------|---------|
| `@` | `%40` |
| `:` | `%3A` |
| `/` | `%2F` |
| `?` | `%3F` |
| `#` | `%23` |
| `[` | `%5B` |
| `]` | `%5D` |
| `!` | `%21` |
| `$` | `%24` |
| `&` | `%26` |
| `'` | `%27` |
| `(` | `%28` |
| `)` | `%29` |
| `*` | `%2A` |
| `+` | `%2B` |
| `,` | `%2C` |
| `;` | `%3B` |
| `=` | `%3D` |
| `%` | `%25` |
| ` ` (space) | `%20` |

**Example**:
```bash
# Password: P@ss:w/rd!
# Encoded:  P%40ss%3Aw%2Frd%21

DATABASE_URL=postgresql://user:P%40ss%3Aw%2Frd%21@localhost:5432/db
```

---

## 7. Troubleshooting Guide

### 7.1 Connection Issues

#### Cannot connect to database

**Symptoms**:
- Error: "Can't reach database server"
- Error: "ECONNREFUSED"
- Error: "Connection timeout"

**Debugging Steps**:

1. **Check if database is running**:
   ```bash
   # PostgreSQL
   docker ps | grep postgres
   # or
   systemctl status postgresql

   # MySQL (if still using)
   docker ps | grep mysql
   # or
   systemctl status mysql
   ```

2. **Verify connection string**:
   ```bash
   echo $DATABASE_URL
   # Should output full connection string
   ```

3. **Test connection manually**:
   ```bash
   # PostgreSQL
   psql "postgresql://user:pass@localhost:5432/dbname"

   # MySQL
   mysql -h localhost -u user -p dbname
   ```

4. **Check network**:
   ```bash
   # Test port availability
   nc -zv localhost 5432  # PostgreSQL
   nc -zv localhost 3306  # MySQL
   ```

5. **Check Docker network** (if using Docker):
   ```bash
   docker network ls
   docker network inspect <network_name>
   # Ensure app and database containers are on same network
   ```

#### Authentication failed

**Symptoms**:
- Error: "password authentication failed"
- Error: "Access denied for user"

**Debugging Steps**:

1. **Verify credentials**:
   - Check `DATABASE_URL` or `DB_URL` username and password
   - Ensure no typos

2. **Check user exists** (PostgreSQL):
   ```bash
   psql -U postgres
   \du  # List all users
   ```

3. **Check user permissions**:
   ```bash
   # PostgreSQL
   GRANT ALL PRIVILEGES ON DATABASE mydb TO myuser;

   # MySQL
   GRANT ALL PRIVILEGES ON mydb.* TO 'myuser'@'%';
   FLUSH PRIVILEGES;
   ```

4. **Check password in database**:
   ```bash
   # PostgreSQL - reset password
   ALTER USER myuser WITH PASSWORD 'newpassword';

   # MySQL - reset password
   ALTER USER 'myuser'@'%' IDENTIFIED BY 'newpassword';
   ```

### 7.2 Prisma Issues

#### Prisma Client not generated

**Symptoms**:
- Error: "Cannot find module '@prisma/client'"
- Error: "PrismaClient is not a constructor"

**Solution**:
```bash
cd apps/admin-api  # or apps/web
pnpm install
pnpm prisma generate
```

#### Schema out of sync

**Symptoms**:
- Error: "Prisma schema and database are out of sync"

**Solution** (Development):
```bash
# Reset database (destroys data!)
pnpm prisma migrate reset

# Or create new migration
pnpm prisma migrate dev
```

**Solution** (Production):
```bash
# Apply pending migrations
pnpm prisma migrate deploy
```

### 7.3 Migration Issues

#### Migration failed

**Symptoms**:
- Migration script fails mid-execution
- Database in inconsistent state

**Solution**:
```bash
# Check migration status
pnpm prisma migrate status

# Mark migration as rolled back
pnpm prisma migrate resolve --rolled-back <migration_name>

# Or mark as applied (if it actually succeeded)
pnpm prisma migrate resolve --applied <migration_name>

# Re-run migrations
pnpm prisma migrate deploy
```

### 7.4 Performance Issues

#### Slow queries

**Debugging**:

1. **Enable query logging** (Prisma):
   ```typescript
   const prisma = new PrismaClient({
     log: ['query', 'info', 'warn', 'error'],
   });
   ```

2. **Analyze query plan** (PostgreSQL):
   ```sql
   EXPLAIN ANALYZE SELECT * FROM users WHERE guild_id = 123;
   ```

3. **Check missing indexes**:
   ```sql
   -- PostgreSQL: Find missing indexes
   SELECT schemaname, tablename, attname, n_distinct, correlation
   FROM pg_stats
   WHERE schemaname = 'public'
   AND n_distinct > 100
   AND correlation < 0.1;
   ```

4. **Add indexes** (via Prisma schema):
   ```prisma
   model User {
     id      Int    @id @default(autoincrement())
     guildId Int

     @@index([guildId])  // Add index
   }
   ```

#### Connection pool exhausted

**Symptoms**:
- Error: "Too many connections"
- Error: "Connection pool timeout"

**Solution**:

1. **Tune connection pool** (Prisma):
   ```bash
   DATABASE_URL=postgresql://user:pass@localhost:5432/db?connection_limit=10
   ```

2. **Check active connections** (PostgreSQL):
   ```sql
   SELECT count(*) FROM pg_stat_activity;
   ```

3. **Kill idle connections** (PostgreSQL):
   ```sql
   SELECT pg_terminate_backend(pid)
   FROM pg_stat_activity
   WHERE state = 'idle'
   AND state_change < current_timestamp - INTERVAL '5 minutes';
   ```

---

## 8. Migration Checklist

When migrating from MySQL to PostgreSQL, update the following:

### Per Service Checklist

- [ ] Update `.env` files:
  - [ ] Change `DB_URL` to `DATABASE_URL`
  - [ ] Update connection string format (mysql:// → postgresql://)
- [ ] Update Prisma schema:
  - [ ] Change provider to `postgresql`
  - [ ] Review data types (DATETIME → TIMESTAMP(3), JSON → JSONB)
- [ ] Update `package.json`:
  - [ ] Remove `mysql2` dependency
  - [ ] Add `@prisma/client` and `prisma` dependencies
- [ ] Update database client imports:
  - [ ] Change from old database.js to new database.js (admin-api)
- [ ] Update Docker Compose:
  - [ ] Switch from `docker-compose.slimy-nuc1.yml` to `docker-compose.slimy-nuc2.yml`
  - [ ] Update environment file paths
- [ ] Run database migrations:
  - [ ] `pnpm prisma migrate deploy`
  - [ ] Verify schema with `pnpm prisma studio`
- [ ] Test thoroughly:
  - [ ] Run test suite
  - [ ] Manual testing of critical flows
  - [ ] Performance testing

---

## 9. Quick Setup Guides

### 9.1 Local Development Setup (PostgreSQL)

**Prerequisites**:
- Docker installed
- pnpm installed

**Steps**:

1. **Start PostgreSQL**:
   ```bash
   docker run -d \
     --name slimy-postgres \
     -e POSTGRES_USER=slimyai \
     -e POSTGRES_PASSWORD=devpassword \
     -e POSTGRES_DB=slimy_dev \
     -p 5432:5432 \
     postgres:16-alpine
   ```

2. **Create `.env` file**:
   ```bash
   # apps/admin-api/.env
   DATABASE_URL=postgresql://slimyai:devpassword@localhost:5432/slimy_dev?schema=public

   # apps/web/.env.local
   DATABASE_URL=postgresql://slimyai:devpassword@localhost:5432/slimy_dev?schema=public
   ```

3. **Install dependencies**:
   ```bash
   pnpm install
   ```

4. **Run migrations**:
   ```bash
   cd apps/admin-api
   pnpm prisma migrate deploy
   pnpm prisma generate

   cd ../web
   pnpm prisma generate
   ```

5. **Start development server**:
   ```bash
   pnpm dev
   ```

### 9.2 Adding Redis (Optional)

**Start Redis**:
```bash
docker run -d \
  --name slimy-redis \
  -p 6379:6379 \
  redis:7-alpine
```

**Update `.env`**:
```bash
REDIS_URL=redis://localhost:6379
```

**Restart application** - Redis will be picked up automatically.

---

## 10. Environment Variable Templates

### 10.1 apps/admin-api/.env.example

```bash
# PostgreSQL Database (Current)
DATABASE_URL=postgresql://slimyai:your_password_here@postgres:5432/slimyai?schema=public

# Redis Cache (Optional)
# REDIS_URL=redis://localhost:6379

# Other admin-api specific variables
# (see full .env.example in repo)
```

### 10.2 apps/web/.env.example

```bash
# PostgreSQL Database
DATABASE_URL=postgresql://slimyai:your_password_here@localhost:5432/slimyai?schema=public

# Redis Cache (Optional - choose URL or individual vars)
# Option 1: URL
# REDIS_URL=redis://localhost:6379

# Option 2: Individual variables
# REDIS_HOST=localhost
# REDIS_PORT=6379
# REDIS_PASSWORD=

# Other web-specific variables
# (see full .env.example in repo)
```

### 10.3 Production .env Template

```bash
# PostgreSQL Database
DATABASE_URL=postgresql://prod_user:STRONG_PASSWORD@prod-db.internal:5432/slimy?schema=public&sslmode=require

# Redis Cache
REDIS_URL=redis://:STRONG_PASSWORD@prod-redis.internal:6379/0

# Ensure strong passwords and SSL in production!
```

---

## Appendix A: Related Documentation

- **Migration Roadmap**: See `docs/db-migration-roadmap.md`
- **Prisma Documentation**: https://www.prisma.io/docs
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/
- **Redis Documentation**: https://redis.io/documentation

---

## Appendix B: Support

For issues with environment variables or database connections:

1. Check this reference document
2. Review error messages in application logs
3. Verify database is running (`docker ps` or `systemctl status`)
4. Test connection manually (psql, mysql, redis-cli)
5. Consult `docs/db-migration-roadmap.md` for migration-specific issues

---

## Document History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2025-11-19 | 1.0 | Claude | Initial environment variables reference |

---

**Note**: This is a living document. Update as new services are added or environment variables change.
