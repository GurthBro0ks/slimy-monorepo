# Local Development Database Options

This guide explains how developers can use simpler database setups for local development without affecting the production PostgreSQL configuration.

## TL;DR - Quick Setup

**Recommended for most developers:**
```bash
# Option 1: PostgreSQL in Docker (most production-like)
docker run -d \
  --name slimy-dev-db \
  -e POSTGRES_PASSWORD=devpass \
  -e POSTGRES_USER=slimyai \
  -e POSTGRES_DB=slimyai \
  -p 5432:5432 \
  postgres:16-alpine

# Then set in your .env:
DATABASE_URL="postgresql://slimyai:devpass@localhost:5432/slimyai?schema=public"
```

---

## Database Options Comparison

### 1. PostgreSQL in Docker (Recommended)

**Pros:**
- ✅ **Production parity**: Same database engine as production
- ✅ **Feature complete**: All PostgreSQL features, extensions, and data types work
- ✅ **Migration safety**: Migrations tested in same environment as production
- ✅ **Easy reset**: `docker rm -f slimy-dev-db` and recreate
- ✅ **Isolated**: Doesn't affect system-wide installations
- ✅ **Team consistency**: Everyone uses the same DB version

**Cons:**
- ⚠️ Requires Docker installed
- ⚠️ Slightly heavier resource usage (~100-200MB RAM)
- ⚠️ Container must be running during development

**Best for:** Most developers, CI/CD pipelines, team consistency

---

### 2. SQLite (File-based, Quick & Dirty)

**Pros:**
- ✅ **Zero setup**: No Docker, no server, just a file
- ✅ **Ultra fast**: In-memory mode for tests
- ✅ **Portable**: Database is a single `.db` file
- ✅ **Lightweight**: Minimal resource usage
- ✅ **Great for demos**: Easy to share database state via file

**Cons:**
- ❌ **Not production-like**: Different SQL dialect and behaviors
- ❌ **Type differences**: No native UUID type (uses TEXT), different date handling
- ❌ **Limited features**: No advanced PostgreSQL features (JSONB operations, full-text search, etc.)
- ❌ **Migration risks**: Migrations might work in SQLite but fail in PostgreSQL
- ❌ **Concurrent access**: Limited multi-connection support
- ❌ **Schema differences**: May need conditional schemas in Prisma

**Best for:** Quick prototyping, isolated tests, offline development

---

### 3. MySQL in Docker

**Pros:**
- ✅ Easy Docker setup like PostgreSQL
- ✅ Familiar to many developers
- ✅ Good performance

**Cons:**
- ❌ **Different from production**: PostgreSQL-specific features won't work
- ❌ **Migration incompatibility**: SQL syntax differences can break migrations
- ❌ **Not recommended**: Introduces yet another database variant

**Best for:** Projects already using MySQL (not this one)

---

## Environment Variable Strategy

### Switching Between Databases

Create different `.env` files for different environments:

#### `.env.development` (PostgreSQL in Docker)
```bash
# Local PostgreSQL in Docker
DATABASE_URL="postgresql://slimyai:devpass@localhost:5432/slimyai?schema=public"
NODE_ENV=development
```

#### `.env.development.sqlite` (SQLite - optional)
```bash
# SQLite for quick local testing
DATABASE_URL="file:./dev.db"
NODE_ENV=development
```

#### `.env.test` (In-memory SQLite for fast tests)
```bash
# Fast in-memory database for tests
DATABASE_URL="file::memory:?cache=shared"
NODE_ENV=test
```

#### `.env.production` (Never committed)
```bash
# Production PostgreSQL (managed service)
DATABASE_URL="postgresql://prod_user:SECRET@prod-host.aws.com:5432/slimyai?schema=public&sslmode=require"
NODE_ENV=production
```

### Loading the Right .env File

**Option 1: Manual copy**
```bash
cp .env.development .env
```

**Option 2: Use dotenv-cli**
```bash
npm install -D dotenv-cli

# Run with specific env file
dotenv -e .env.development -- npm run dev
dotenv -e .env.test -- npm test
```

**Option 3: Script in package.json**
```json
{
  "scripts": {
    "dev": "dotenv -e .env.development -- tsx src/index.ts",
    "dev:sqlite": "dotenv -e .env.development.sqlite -- tsx src/index.ts",
    "test": "dotenv -e .env.test -- vitest"
  }
}
```

---

## Prisma Configuration for Multiple Databases

### Current Schema (PostgreSQL only)
Your current `schema.prisma` is PostgreSQL-only:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Supporting SQLite (Optional)

If you want to optionally support SQLite for local dev, you have two options:

#### Option A: Separate schema file (cleaner)
```bash
# Keep schema.prisma as-is for PostgreSQL
# Create schema.sqlite.prisma for SQLite if needed
```

#### Option B: Environment-based provider (complex, not recommended)
```prisma
datasource db {
  provider = env("DATABASE_PROVIDER") // "postgresql" | "sqlite"
  url      = env("DATABASE_URL")
}
```
Then set `DATABASE_PROVIDER=postgresql` or `DATABASE_PROVIDER=sqlite` in your `.env`.

**⚠️ Warning**: We don't recommend this approach for this project. Stick with PostgreSQL.

---

## Migration Caveats & Rules

### Type Differences to Watch Out For

| Feature | PostgreSQL | SQLite |
|---------|-----------|--------|
| **UUIDs** | Native `uuid` | TEXT (stored as string) |
| **Timestamps** | `TIMESTAMP` with timezone | TEXT/INTEGER |
| **JSONB** | Native with operations | TEXT (no queries) |
| **Full-text search** | Built-in | Limited |
| **Arrays** | Native `TEXT[]` | TEXT (JSON string) |
| **Enums** | Native `ENUM` | TEXT with CHECK |

### Migration Safety Rules

1. **Always test migrations on PostgreSQL before production**
   - Even if you develop on SQLite, run migrations in a PostgreSQL container before merging

2. **Use Prisma's type-safe migrations**
   ```bash
   # Generate migration
   npx prisma migrate dev --name add_user_table

   # Verify it works on PostgreSQL Docker
   DATABASE_URL="postgresql://..." npx prisma migrate deploy
   ```

3. **Avoid database-specific SQL in migrations**
   - Don't use PostgreSQL-specific functions in migration files
   - Keep schema.prisma provider-agnostic where possible

4. **CI should use PostgreSQL**
   ```yaml
   # .github/workflows/test.yml
   services:
     postgres:
       image: postgres:16
       env:
         POSTGRES_PASSWORD: testpass
   ```

---

## Example Connection Strings

### PostgreSQL

```bash
# Local Docker (development)
DATABASE_URL="postgresql://slimyai:devpass@localhost:5432/slimyai?schema=public"

# Local with SSL disabled (development)
DATABASE_URL="postgresql://slimyai:devpass@localhost:5432/slimyai?schema=public&sslmode=disable"

# Production (with SSL required)
DATABASE_URL="postgresql://slimyai:SECRETPASS@prod.db.aws.com:5432/slimyai?schema=public&sslmode=require&connection_limit=10"

# Cloud provider (example)
DATABASE_URL="postgresql://user:pass@db-cluster.us-east-1.rds.amazonaws.com:5432/mydb?schema=public&sslmode=require"
```

### SQLite

```bash
# File-based (persisted to disk)
DATABASE_URL="file:./dev.db"

# In-memory (fast, but lost on restart)
DATABASE_URL="file::memory:?cache=shared"

# Named in-memory (can be shared across connections)
DATABASE_URL="file:testdb?mode=memory&cache=shared"
```

### MySQL (Not recommended for this project)

```bash
# Just for reference
DATABASE_URL="mysql://user:password@localhost:3306/slimyai"
```

---

## "Good Enough" Local Dev Setup

Here's a simple, battle-tested setup for local development:

### Step 1: Create `docker-compose.dev.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: slimy-dev-db
    environment:
      POSTGRES_USER: slimyai
      POSTGRES_PASSWORD: devpass
      POSTGRES_DB: slimyai
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U slimyai"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres-data:
```

### Step 2: Add npm scripts to package.json

```json
{
  "scripts": {
    "db:up": "docker-compose -f docker-compose.dev.yml up -d",
    "db:down": "docker-compose -f docker-compose.dev.yml down",
    "db:reset": "npm run db:down && npm run db:up && sleep 3 && npm run db:migrate",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "dev": "npm run db:up && tsx watch src/index.ts"
  }
}
```

### Step 3: Set up your `.env`

```bash
# Copy the example
cp .env.example .env

# Edit .env with local PostgreSQL
DATABASE_URL="postgresql://slimyai:devpass@localhost:5432/slimyai?schema=public"
NODE_ENV=development

# ... other env vars
```

### Step 4: Daily workflow

```bash
# Start database
npm run db:up

# Run migrations (first time or when schema changes)
npm run db:migrate

# Start development server
npm run dev

# Open Prisma Studio to view/edit data
npm run db:studio

# When done (optional - container can stay running)
npm run db:down
```

### Step 5: Reset database when needed

```bash
# Nuclear option - wipe everything
npm run db:reset

# Or manually
docker-compose -f docker-compose.dev.yml down -v  # -v removes volumes
npm run db:up
npm run db:migrate
```

---

## When to Use What

| Scenario | Recommended Database |
|----------|---------------------|
| Daily development | PostgreSQL in Docker |
| Quick prototyping new feature | PostgreSQL in Docker (or SQLite if you're confident) |
| Running unit tests | SQLite in-memory (fast) or PostgreSQL (accurate) |
| Integration tests | PostgreSQL in Docker |
| CI/CD pipeline | PostgreSQL in Docker |
| Offline work (no Docker) | SQLite file-based |
| Sharing DB state with teammate | SQLite file (commit the `.db` to a branch) |

---

## Troubleshooting

### "Database already exists" error
```bash
docker exec -it slimy-dev-db psql -U slimyai -c "DROP DATABASE IF EXISTS slimyai;"
docker exec -it slimy-dev-db psql -U slimyai -c "CREATE DATABASE slimyai;"
npx prisma migrate deploy
```

### Port 5432 already in use
```bash
# Check what's using it
lsof -i :5432

# Either stop that process or use a different port
docker run -p 5433:5432 ...  # Maps to localhost:5433
DATABASE_URL="postgresql://slimyai:devpass@localhost:5433/slimyai"
```

### Migrations fail on SQLite
This means the migration uses PostgreSQL-specific features. You must use PostgreSQL.

### "Too many connections" error
Reduce connection pool size in your connection string:
```bash
DATABASE_URL="postgresql://...?connection_limit=5"
```

Or in your Prisma Client initialization:
```typescript
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '?connection_limit=5'
    }
  }
})
```

---

## Summary

- **Production**: Uses PostgreSQL (managed cloud service)
- **Local Development (Recommended)**: PostgreSQL in Docker via docker-compose
- **Local Development (Alternative)**: SQLite for quick experimentation only
- **Testing**: SQLite in-memory for speed, PostgreSQL Docker for accuracy
- **CI/CD**: Always PostgreSQL in Docker

**Golden Rule**: When in doubt, use PostgreSQL in Docker. It's worth the extra 2 minutes of setup to avoid migration headaches later.
